"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { sdk } from "@farcaster/miniapp-sdk";

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
  const [walletConnected, setWalletConnected] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [mountedFade, setMountedFade] = useState(false);

  // Farcaster: hide splash as soon as app is ready to render
  useEffect(() => {
    (async () => {
      try {
        await sdk.actions.ready();
      } catch {
        // ignore – some environments might not support actions yet
      }
      setTimeout(() => setMountedFade(true), 20);
    })();
  }, []);

  // Connect wallet from START gate
const connectWallet = async () => {
  try {
await sdk.actions.openUrl("farcaster://wallet");
    setWalletConnected(true);
  } catch {
    // user cancelled or provider not available – remain on gate
  }
};


  // Load trades only after wallet is connected
  useEffect(() => {
    if (!walletConnected) return;

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
  }, [walletConnected]);

  // -------- GATE SCREEN (until wallet is connected) --------
  if (!walletConnected) {
    return (
      <main
        className={`min-h-screen w-full flex items-center justify-center p-6 bg-[var(--bg)] transition-opacity duration-150 ${
          mountedFade ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="w-full max-w-md text-center">
          <div className="rounded-[18px] border border-[var(--line)] bg-[var(--panel)]/70 backdrop-blur-sm shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)] px-6 py-8">
            <h1 className="text-[22px] md:text-[24px] font-[var(--font-playfair)] text-[var(--ink)]">
              Polymarket Trade Radar
            </h1>
            <p className="mt-2 text-[12px] text-[var(--muted)]">
              Restricted access. Connect wallet to enter the terminal.
            </p>
            <button
              onClick={connectWallet}
              className="mt-6 inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white/5 hover:bg-white/10 active:bg-white/15 px-6 py-2 text-[13px] text-[var(--ink)] transition-colors"
            >
              START
            </button>
          </div>
        </div>
      </main>
    );
  }

  // -------- TERMINAL (after wallet is connected) --------
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
            <h2 className="text-[20px] md:text-[22px] font-[var(--font-playfair)] text-[var(--ink)] tracking-wide leading-none">
              Polymarket Trade Radar
            </h2>
            <div className="mt-1 text-[11px] text-[var(--muted)]">
              {updatedAt ? `Updated: ${format(updatedAt, "HH:mm:ss")}` : "— — : — — : — —"}
            </div>
            <div className="mt-1 text-[11px] text-emerald-300/80 font-mono">
              [time] [side] [$notional | $price] | market [View]
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
  const isHighBuy = t.side === "BUY" && t.amountUSD > 10_000;

  // G2 FFT gold highlight for high-value BUYs
  const base =
    "px-4 py-2 text-[13px] font-mono transition-colors duration-150 text-emerald-200/90";
  const high =
    "bg-[#6f5b1a]/25 ring-1 ring-[#6f5b1a]/30"; // мягкое золото, благородно
  const hover = "hover:bg-white/3";

  return (
    <div className={`${base} ${isHighBuy ? high : hover}`}>
      <span className="inline-flex items-center">
        {isHighBuy && <span className="text-yellow-300 mr-1">★</span>}
        <span className="text-emerald-300">[{time}]</span>
      </span>{" "}
      <span
        className={
          t.side === "BUY" ? "text-emerald-300 font-semibold" : "text-red-300 font-semibold"
        }
      >
        {t.side}
      </span>{" "}
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
