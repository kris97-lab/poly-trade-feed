"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

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

const USD = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

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
          .slice(0, 150);

        setTrades(filtered);
        setUpdatedAt(new Date());
        setLoading(false);
      } catch {
        if (mounted) setLoading(false);
      }
    };

    pull();
    const id = setInterval(pull, 10_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 md:p-8 bg-[var(--bg)]">
      <div className="w-full max-w-4xl">
        {/* Bannner / frame top */}
        <div className="mx-auto max-w-3xl rounded-t-[18px] border-x border-t border-[var(--line)] bg-[var(--panel)] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)]">
          <div className="relative overflow-hidden rounded-t-[18px]">
            <div className="h-[40px] bg-[var(--banner)] border-b border-[var(--line)] px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[14px] tracking-[0.08em] uppercase text-[var(--gold)]">
                  Polymarket Feed
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  live
                </span>
              </div>
              <span className="text-[11px] text-[var(--muted)]">≥ 800 USD</span>
            </div>
          </div>

          {/* Header section */}
          <div className="px-4 py-3 border-b border-[var(--line)] bg-[var(--card)]">
            <div className="flex items-center justify-between">
              <h1 className="text-[15px] md:text-[17px] font-medium text-[var(--ink)]/95">
                Real-Time Polymarket Trades
              </h1>
              <div className="text-[11px] text-[var(--muted)]">
                {updatedAt ? `Updated: ${format(updatedAt, "HH:mm:ss")}` : "— — : — — : — —"}
              </div>
            </div>
            <div className="mt-1 text-[11px] text-emerald-300/80 font-mono">
              [time] [side] [$notional | $price] | market [View]
            </div>
          </div>

          {/* Trades feed */}
          <div className="max-h-[65vh] overflow-auto bg-[var(--card)]">
            <div className="h-px bg-[var(--line)]" />
            {loading ? (
              <SkeletonRows />
            ) : trades.length === 0 ? (
              <div className="p-4 text-[12px] text-[var(--muted)]">
                Listening for ≥ 800 USD fills…
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {trades.map((t) => (
                  <Row key={t.id} t={t} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--line)] bg-[var(--panel)]/70 px-4 py-2 rounded-b-[18px] text-[11px] text-[var(--muted)]">
            Powered by Polymarket • Auto-refreshing every 10s
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({ t }: { t: Trade }) {
  const time = format(new Date(t.ts), "HH:mm:ss");
  const sideColor = t.side === "BUY" ? "text-emerald-300" : "text-red-300";

  return (
    <div className="px-3 md:px-4 py-2 text-[12px] md:text-[13px] font-mono text-emerald-200/90 hover:bg-white/2.5 transition-colors duration-100">
      <span className="text-emerald-300">[{time}]</span>{" "}
      <span className={`${sideColor} font-semibold`}>{t.side}</span>{"  "}
      <span>
        {USD(t.amountUSD)}
        {typeof t.price === "number" && <> | ${t.price.toFixed(2)}</>}
      </span>
      {"  "} | {"  "}
      <span className="whitespace-pre-wrap text-[var(--ink)]/90">
        {t.outcome ? `${t.outcome} | ` : ""}
        {t.market}
      </span>{"  "}
      {t.url && (
        <a
          href={t.url}
          target="_blank"
          rel="noreferrer"
          className="ml-2 text-cyan-300 underline decoration-dotted hover:brightness-125"
        >
          [View]
        </a>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="p-3 space-y-1.5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-5 rounded bg-[var(--line)]/60 animate-pulse" />
      ))}
    </div>
  );
}
