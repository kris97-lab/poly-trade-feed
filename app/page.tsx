"use client";

import { useEffect, useState, useCallback } from "react";
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
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [mountedFade, setMountedFade] = useState(false);

  // === Farcaster: готовность приложения ===
  useEffect(() => {
    (async () => {
      try {
        await sdk.actions.ready();
      } catch {}
      setTimeout(() => setMountedFade(true), 20);
    })();
  }, []);

  // === Проверка и восстановление подключения кошелька ===
  const checkWallet = useCallback(async () => {
    try {
      const provider = await sdk.wallet.getEthereumProvider();
      if (!provider) return;

      const accounts = await provider.request({ method: "eth_accounts" });
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    checkWallet();
    const interval = setInterval(checkWallet, 3000);
    return () => clearInterval(interval);
  }, [checkWallet]);

  // === Подключение кошелька ===
  const connectWallet = async () => {
    try {
      const(provider = await sdk.wallet.getEthereumProvider();
      if (!provider) {
        await sdk.actions.notify({ type: "error", message: "Wallet not available" });
        return;
      }

      const accounts = await provider.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        await sdk.actions.notify({ type: "success", message: "Wallet connected" });
      }
    } catch {
      await sdk.actions.notify({ type: "info", message: "Connection cancelled" });
    }
  };

  // === Загрузка трейдов ===
  useEffect(() => {
    if (!walletAddress) return;

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
    const id = setInterval(pull, 15_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [walletAddress]);

  // === Кнопки по стандартам Mini Apps ===
  const copyAddress = () => walletAddress && sdk.actions.copy(walletAddress);
  const refresh = () => window.location.reload();
  const closeApp = () => sdk.actions.close();
  const openTrade = (url?: string) => url && sdk.actions.openUrl(url);

  // === GATE SCREEN ===
  if (!walletAddress) {
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

  // === TERMINAL ===
  return (
    <main
      className={`min-h-screen w-full flex flex-col p-4 md:p-8 bg-[var(--bg)] transition-opacity duration-150 ${
        mountedFade ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="rounded-[18px] border border-[var(--line)] bg-[var(--panel)] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)] flex flex-col h-full">
          {/* Header */}
          <header className="px-4 py-4 border-b border-[var(--line)] bg-[var(--card)] flex justify-between items-start">
            <div>
              <h2 className="text-[20px] md:text-[22px] font-[var(--font-playfair)] text-[var(--ink)] tracking-wide leading-none">
                Polymarket Trade Radar
              </h2>
              <div className="mt-1 text-[11px] text-[var(--muted)]">
                {updatedAt ? `Updated: ${format(updatedAt, "HH:mm:ss")}` : "— — : — — : — —"}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={copyAddress}
                className="p-1.5 rounded border border-[var(--line)] bg-white/5 hover:bg-white/10 text-[10px] text-[var(--muted)]"
                title="Copy address"
              >
                Copy
              </button>
              <button
                onClick={refresh}
                className="p-1.5 rounded border border-[var(--line)] bg-white/5 hover:bg-white/10 text-[10px] text-[var(--muted)]"
                title="Refresh"
              >
                Refresh
              </button>
              <button
                onClick={closeApp}
                className="p-1.5 rounded border border-[var(--line)] bg-white/5 hover:bg-white/10 text-[10px] text-[var(--muted)]"
                title="Close"
              >
                Close
              </button>
            </div>
          </header>

          {/* Wallet Info */}
          <div className="px-4 py-2 text-[10px] text-[var(--muted)] border-b border-[var(--line)] bg-[var(--card)]">
            Wallet: {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
            <button
              onClick={() => setWalletAddress(null)}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              [Disconnect]
            </button>
          </div>

          {/* Trades Feed */}
          <div className="flex-1 overflow-auto bg-[var(--card)] min-h-0">
            {loading ? (
              <SkeletonRows />
            ) : trades.length === 0 ? (
              <div className="p-4 text-[12px] text-[var(--muted)]">
                Listening for ≥ 800 USD fills…
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {trades.map((t) => (
                  <Row key={t.id} t={t} onView={() => openTrade(t.url)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({ t, onView }: { t: Trade; onView: () => void }) {
  const time = format(new Date(t.ts), "HH:mm:ss");
  const isHighBuy = t.side === "BUY" && t.amountUSD > 10_000;

  const base =
    "px-4 py-2 text-[13px] font-mono transition-colors duration-150 text-emerald-200/90 cursor-pointer";
  const high = "bg-[#6f5b1a]/25 ring-1 ring-[#6f5b1a]/30";
  const hover = "hover:bg-white/3";

  return (
    <div onClick={onView} className={`${base} ${isHighBuy ? high : hover}`}>
      <span className="inline-flex items-center">
        {isHighBuy && <span className="text-yellow-300 mr-1">Star</span>}
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
        <span className="ml-2 text-cyan-300 underline decoration-dotted">
          [View]
        </span>
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