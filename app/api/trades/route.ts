import { NextResponse } from "next/server";

type Trade = {
  id: string;
  ts: string;
  side: "BUY" | "SELL";
  amountUSD: number;
  price?: number;
  outcome?: string;
  market: string;
  url?: string;
};

// --- MOCK for now --------------------------------------------------
function mock(): Trade[] {
  const markets = [
    "Yes | Will AC Milan win on 2025-10-24?",
    "No | Will the price of Bitcoin be between 112,000 and 114,000 on October?",
    "Anadolu Efes | Anadolu Efes vs. Fenerbahce",
    "Yes | Will lighter perform an airdrop by December 31?",
    "Wild | Utah vs. Wild",
  ];
  const rand = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  return Array.from({ length: 12 }).map((_, i) => {
    const side = Math.random() > 0.5 ? "BUY" : "SELL";
    const amount = Math.round(rand(600, 5000)); // часть ниже 800, часть выше
    const minsAgo = Math.floor(rand(0, 5));
    const price = +rand(0.3, 0.85).toFixed(2);
    const title = markets[Math.floor(rand(0, markets.length))];
    return {
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
      ts: new Date(Date.now() - minsAgo * 60 * 1000).toISOString(),
      side,
      amountUSD: amount,
      price,
      outcome: undefined,
      market: title,
      url: "https://polymarket.com/markets",
    };
  });
}

// --- REAL fetch (replace this block when endpoint is ready) --------
// Example shape you’ll likely adapt to:
// async function fetchPolymarket(): Promise<Trade[]> {
//   const r = await fetch("https://<POLYMARKET_API>/fills?limit=100", { headers: { "accept": "application/json" }, cache: "no-store" });
//   const raw = await r.json();
//   return raw.items.map((x: any) => ({
//     id: x.id || x.txHash,
//     ts: x.timestamp,
//     side: x.side?.toUpperCase() === "BUY" ? "BUY" : "SELL",
//     amountUSD: Math.round(x.notionalUSD ?? x.sizeUSD ?? 0),
//     price: typeof x.price === "number" ? x.price : undefined,
//     outcome: x.outcomeTitle ?? x.outcome,
//     market: x.marketTitle ?? x.market?.question ?? "Unknown market",
//     url: x.marketUrl ?? `https://polymarket.com/event/${x.marketId}`,
//   }));
// }

export async function GET() {
  try {
    // const data = await fetchPolymarket(); // ← включим, когда будет реальный endpoint
    const data = mock();
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
  if (e instanceof Error) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
  throw e;
}

}
