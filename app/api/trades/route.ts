import { NextResponse } from "next/server";

type Trade = {
  id: string;
  ts: string;               // ISO datetime
  side: "BUY" | "SELL";
  amountUSD: number;        // notional (≈ USDC)
  price?: number;           // 0..1
  outcome?: string;
  market: string;
  url?: string;
};

// Полезно: конвертирует seconds/ms -> ISO
function tsToIso(t: number): string {
  // Поля timestamp в Data-API — integer; встречается в секундах
  // Если внезапно попадутся миллисекунды — нормализуем.
  const ms = t > 10_000_000_000 ? t : t * 1000;
  return new Date(ms).toISOString();
}

async function fetchPolymarketTrades(minUSD = 800, limit = 150): Promise<Trade[]> {
  const u = new URL("https://data-api.polymarket.com/trades");
  u.searchParams.set("limit", String(limit));
  u.searchParams.set("takerOnly", "true");             // только рыночные агрессоры
  u.searchParams.set("filterType", "CASH");            // фильтрация по "денежному" номиналу
  u.searchParams.set("filterAmount", String(minUSD));  // минимум $800

  const r = await fetch(u.toString(), {
    headers: { accept: "application/json" },
    // не кэшируем, чтобы терминал жил
    cache: "no-store",
    // В Next 14 это ок на Node runtime
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Polymarket API ${r.status} – ${text.slice(0, 200)}`);
  }

  const raw = (await r.json()) as any[];

  // Документация: поля side, price, size, timestamp, title, slug, eventSlug, outcome и т.д.
  // https://docs.polymarket.com/developers/CLOB/trades/trades-data-api
  const mapped: Trade[] = raw.map((x) => {
    const price = typeof x.price === "number" ? x.price : undefined;
    const size = typeof x.size === "number" ? x.size : 0;

    // В Polymarket номинал ~ size*price (USDC). Data-API фильтрует по CASH сам,
    // но мы всё равно посчитаем для отображения.
    const notional = Math.round((price ?? 0) * size);

    // Ссылка: если есть market slug — используем /market/<slug>, иначе event slug.
    let url: string | undefined = undefined;
    if (typeof x.slug === "string" && x.slug.length > 0) {
      url = `https://polymarket.com/market/${x.slug}`;
    } else if (typeof x.eventSlug === "string" && x.eventSlug.length > 0) {
      url = `https://polymarket.com/event/${x.eventSlug}`;
    }

    return {
      id: x.transactionHash || `${x.conditionId || "cond"}-${x.timestamp}`,
      ts: tsToIso(Number(x.timestamp)),
      side: String(x.side).toUpperCase() === "BUY" ? "BUY" : "SELL",
      amountUSD: notional,
      price,
      outcome: x.outcome ?? undefined,
      market: x.title || x.asset || "Unknown market",
      url,
    };
  });

  // Сортируем по времени (API уже даёт desc, но на всякий случай)
  mapped.sort((a, b) => +new Date(b.ts) - +new Date(a.ts));

  // На клиенте ты всё равно фильтруешь ≥ 800, но сервером тоже отрежем мусор
  return mapped.filter((t) => t.amountUSD >= minUSD);
}

export async function GET() {
  try {
    const data = await fetchPolymarketTrades(800, 200);
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    throw e;
  }
}
