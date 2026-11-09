# Polymarket Trade Feed

A live feed of large Polymarket trades (over $800), built as a Farcaster / Base mini app.

**Live:** https://poly-trade-feed.vercel.app (the feed opens inside a Farcaster client such as Warpcast; in a regular browser you see the entry screen). The raw feed works anywhere: https://poly-trade-feed.vercel.app/api/trades

## What it does

- Pulls the latest taker trades from the public Polymarket Data API v2, filtered server-side to $800+ in cash value.
- Shows side, size in USD, price, outcome and market, newest first, with a link to each market on Polymarket.
- Refreshes every 15 seconds.
- Inside a Farcaster client it uses the Mini App SDK: connects the user's wallet and can send notifications.

## How it works

- `app/api/trades/route.ts` — server route that calls `data-api.polymarket.com/v2/trades` (`takerOnly`, `filterType=CASH`, `filterAmount=800`), maps the snake_case response to a compact trade shape, and returns JSON. API errors come back as a readable message instead of an empty list.
- `app/page.tsx` — the feed UI and the mini-app integration.
- `minikit.config.ts`, `app/.well-known/farcaster.json` — mini-app manifest and domain association.

Next.js 15, React 19, OnchainKit, Farcaster Mini App SDK, wagmi/viem. Deployed on Vercel.

## Run locally

```bash
npm install
cp .example.env .env.local   # NEXT_PUBLIC_URL=http://localhost:3000
npm run dev
```

## Changelog

- **Nov 2026:** Polymarket retired Data API v1 (it now returns HTTP 410). Migrated the feed to v2: new endpoint, `{ data, pagination }` envelope and snake_case fields.

Built by [Denis Bobrik](https://www.linkedin.com/in/denis-bobrik/).
