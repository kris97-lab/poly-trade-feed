"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { sdk } from "@farcaster/miniapp-sdk";
import Image from "next/image";
import Link from "next/link";

/* -------------------------------------------------
 *  Типы
 * ------------------------------------------------- */
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

type FarcasterUser = {
  fid: number;
  username: string;
  displayName?: string;
  pfp?: { url?: string };
};

const USD = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/* -------------------------------------------------
 *  Главная страница
 * ------------------------------------------------- */
export default function MiniPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [mountedFade, setMountedFade] = useState(false);
  const [user, setUser] = useState<{
    fid: number;
    username: string;
    displayName: string;
    pfpUrl?: string;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  /* -------------------------------------------------
   *  1. SDK ready + пользователь
   * ------------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        await sdk.actions.ready();

        const userData: FarcasterUser | undefined = await (
          sdk as unknown as { user?: { get?: () => Promise<FarcasterUser | undefined> } }
        ).user?.get?.();

        if (userData) {
          setUser({
            fid: userData.fid,
            username: userData.username,
            displayName: userData.displayName ?? userData.username,
            pfpUrl: userData.pfp?.url,
          });
          setWalletConnected(true);
        }
      } catch (err) {
        console.warn("User not connected", err);
      } finally {
        setTimeout(() => setMountedFade(true), 20);
      }
    })();
  }, []);

  /* -------------------------------------------------
   *  2. Подключение кошелька
   * ------------------------------------------------- */
  const connectWallet = async () => {
    try {
      await (sdk.actions as any).requestWallet();

      // Получаем пользователя после подключения
      const userData: FarcasterUser | undefined = await (sdk as any).user?.get?.();

      if (userData) {
        setUser({
          fid: userData.fid,
          username: userData.username,
          displayName: userData.displayName ?? userData.username,
          pfpUrl: userData.pfp?.url,
        });
        setWalletConnected(true);
      }
    } catch (err) {
      console.warn("Wallet connection failed or cancelled", err);
    }
  };

  /* -------------------------------------------------
   *  3. Загрузка трейдов
   * ------------------------------------------------- */
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
          {/* ==================== HEADER ==================== */}
          <header className="px-4 py-4 border-b border-[var(--line)] bg-[var(--card)] flex items-center justify-between relative">
            <div>
              <h1 className="text-[20px] md:text-[22px] font-[var(--font-playfair)] text-[var(--ink)] tracking-wide leading-none">
                Polymarket Trade Radar
              </h1>
              <div className="mt-1 text-[11px] text-[var(--muted)]">
                {updatedAt
                  ? `Updated: ${format(updatedAt, "HH:mm:ss")}`
                  : "— — : — — : — —"}
              </div>
            </div>

            {/* ---- Аватар или Connect Wallet ---- */}
            <div className="relative">
              {walletConnected && user ? (
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="hover:opacity-80 transition-opacity"
                >
                  {user.pfpUrl ? (
                    <Image
                      src={user.pfpUrl}
                      alt={user.displayName}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover border border-[var(--line)]"
                      unoptimized
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                      {user.displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </button>
              ) : (
                <button
                  onClick={connectWallet}
                  className="px-3 py-1.5 text-[12px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-full border border-cyan-500/50 transition-colors"
                >
                  Connect Wallet
                </button>
              )}

              {/* Выдвигающееся меню */}
              {menuOpen && walletConnected && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--card)]/80 backdrop-blur-md border border-[var(--line)] rounded-lg shadow-lg py-2 z-50">
                  <Link
                    href="/degen-ideas"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-[13px] text-[var(--ink)] hover:bg-white/10 transition-colors"
                  >
                    Degen Ideas
                  </Link>
                </div>
              )}
            </div>
          </header>

          {/* ==================== FEED ==================== */}
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

/* -------------------------------------------------
 *  Строка сделки
 * ------------------------------------------------- */
function Row({ t }: { t: Trade }) {
  const time = format(new Date(t.ts), "HH:mm:ss");
  const sideColor = t.side === "BUY" ? "text-emerald-300" : "text-red-300";
  const isLargeTrade = t.amountUSD > 10_000;

  const rowStyle = isLargeTrade
    ? {
        backgroundColor: "rgba(255, 235, 59, 0.2)",
        borderLeft: "4px solid #ffeb3b",
        transition: "background-color 0.1s ease",
      }
    : { transition: "background-color 0.1s ease" };

  const hoverStyle = isLargeTrade
    ? { backgroundColor: "rgba(255, 235, 59, 0.3)" }
    : { backgroundColor: "rgba(255, 255, 255, 0.05)" };

  return (
    <div
      className="px-4 py-2 text-[13px] font-mono text-emerald-200/90"
      style={rowStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = rowStyle.backgroundColor ?? "";
      }}
    >
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

/* -------------------------------------------------
 *  Скелетон
 * ------------------------------------------------- */
function SkeletonRows() {
  return (
    <div className="p-4 space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-5 bg-[var(--line)]/50 animate-pulse rounded"
        />
      ))}
    </div>
  );
}