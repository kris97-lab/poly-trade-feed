"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { actions } from "@coinbase/onchainkit/minikit"; // ✅ правильный импорт

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
  const [mountedFade, setMountedFade] = useState(false); // ✅ fade-in

  // ✅ Farcaster splash fix
  useEffect(() => {
    actions.ready(); // <--- ИСПРАВЛЕНО
    setTimeout(() => setMountedFade(true), 20); // soft fade-in
  }, []);

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
    <main
      className={`min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[var(--bg)] transition-opacity duration-150 ${
        mountedFade ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="w-full max-w-4xl">
        <div className="mx-auto max-w-3xl rounded-[18px] border border-[var(--line)] bg-[var(--panel)] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)]">
          {/* Header */}
          <header className="px-4 py-4 border-b border-[var(--line)] bg-[var(--card)]">
            <h1 className="text-[20px] md:text-[22px] font-[var(--font-playfair)] text-[var(--ink)] tracking-wide leading-none">
              Polymarket Trade Radar
            </h1>
            <div className="mt-1 text-[11px] text-[var(--muted)]">
              {updatedAt ? `Updated: ${format(updatedAt, "HH:mm:ss")}` : "— — : — — : — —"}
            </div>
          </header>

          {/* Trades Feed */}
          <div className="max-h-[70vh] overflow-auto bg-[var(--card)]">
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
        </div>
      </div>
    </main>
  );
}

function Row({ t }: { t: Trade }) {
  const time = format(new Date(t.ts), "HH:mm:ss");
  const sideColor = t.side === "BUY" ? "text-emerald-300" : "text-red-300";

  return (
    <div className="px-4 py-2 text-[13px] font-mono text-emerald-200/90 hover:bg-white/3 transition-colors duration-100">
      <span className="text-emerald-300">[{time}]</span>{" "}
      <span className={`${sideColor} font-semibold`}>{t.side}</span>{" "}
      <span>
        {USD(t.amountUSD)}
        {typeof t.price === "number" && <> | ${t.price.toFixed(2)}</>}
      </span>{" "}
      |{" "}
      <span className="whitespace-pre-wrap text-[var(--ink)]/90">
        {t.outcome ? `${t.outcome} | ` : ""}
        {t.market}
      </span>{" "}
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
    <div className="p-4 space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-5 bg-[var(--line)]/50 animate-pulse rounded" />
      ))}
    </div>
  );
}
