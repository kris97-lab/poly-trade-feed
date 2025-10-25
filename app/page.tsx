"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

type Trade = {
  id: string;
  ts: string;             // ISO timestamp
  side: "BUY" | "SELL";
  amountUSD: number;      // notional in USD
  price?: number;         // optional price (0..1)
  outcome?: string;       // e.g. "Yes" / "No"
  market: string;         // market title
  url?: string;           // link to market/trade
};

const USD = (n: number) =>
  `$${Math.round(n).toLocaleString("en-US")}`;

export default function MiniPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const pull = async () => {
      try {
        const r = await fetch("/api/trades", { cache: "no-store" });
        if (!r.ok) throw new Error("Failed to load trades");
        const data: Trade[] = await r.json();

        if (!mounted) return;
        const filtered = data
          .filter((t) => (t.amountUSD ?? 0) >= 800)
          .sort((a, b) => +new Date(b.ts) - +new Date(a.ts))
          .slice(0, 100);

        setTrades(filtered);
        setUpdatedAt(new Date());
        setLoading(false);
      } catch (e) {
        console.error(e);
        if (mounted) setLoading(false);
      }
    };

    pull();
    const id = setInterval(pull, 10_000); // 10s polling
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <main className="p-3 md:p-6">
      <div className="mx-auto max-w-5xl rounded-lg border border-[var(--line)] bg-[var(--bg)] shadow-sm">
        {/* Header */}
        <div className="border-b border-[var(--line)] px-3 py-2 text-center">
          <h1 className="font-[var(--font-playfair)] text-xl md:text-2xl text-emerald-300 tracking-wide">
            Polymarket Live Trades &gt; 800 USD
          </h1>
          <div className="mt-1 text-[11px] text-emerald-200/80">
            Updated: {updatedAt ? format(updatedAt, "HH:mm:ss") : "— — : — — : — —"}
          </div>
        </div>

        {/* Table header (thin line) */}
        <div className="border-b border-[var(--line)] px-2 py-1 text-[11px] text-emerald-300/80 font-mono">
          [time]   [side]   [$notional | $price ($amount)]   |   market   [View]
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--line)]">
          {loading ? (
            <SkeletonRows />
          ) : trades.length === 0 ? (
            <div className="p-3 text-[12px] text-emerald-200/70">
              listening for &gt; 800 USD fills…
            </div>
          ) : (
            trades.map((t) => <Row key={t.id} t={t} />)
          )}
        </div>
      </div>
    </main>
  );
}

function Row({ t }: { t: Trade }) {
  const time = format(new Date(t.ts), "HH:mm:ss");
  const sideColor =
    t.side === "BUY" ? "text-emerald-300" : "text-red-300";

  return (
    <div className="px-2 py-1 text-[12px] md:text-[13px] font-mono text-emerald-200/90">
      <span className="text-emerald-300">[{time}]</span>{" "}
      <span className={`${sideColor} font-semibold`}>{t.side.padEnd(3, " ")}</span>{"  "}
      <span>
        {USD(t.amountUSD)}
        {typeof t.price === "number" && (
          <>
            {" "} | {" "}${t.price.toFixed(2)}{" "}
            {typeof t.amountUSD === "number" && (
              <span className="text-emerald-300/80">
                ({USD(t.amountUSD)})
              </span>
            )}
          </>
        )}
      </span>
      {"  "} | {"  "}
      <span className="whitespace-pre-wrap">
        {t.outcome ? `${t.outcome} | ` : ""}
        {t.market}
      </span>{"  "}
      {t.url && (
        <>
          {" "}
          <a
            href={t.url}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-300 underline decoration-dotted hover:brightness-125"
          >
            [View]
          </a>
        </>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="p-2 space-y-1">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="h-5 rounded bg-[var(--line)]/60 animate-pulse"
        />
      ))}
    </div>
  );
}
