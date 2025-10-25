const ROOT_URL =
  process.env.NEXT_PUBLIC_MINIAPP_URL ||
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjMwNTE1MiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweEQxMGQzYTJFODc1YkQ0NGViMUZjRTQzN0U2YzBjODlkNmIxRUUyZjMifQ",
    payload: "eyJkb21haW4iOiJwb2x5LXRyYWRlLWZlZWQudmVyY2VsLmFwcCJ9",
    signature: "FU0nQ6iNFnH9GbdktV5l73joBY+E7wUg+HGsR9B92rF4dbV/ipZyK52QPC8khVGaa99Pwwpm/Aqm922ZnriAQBs="
  },
  miniapp: {
    version: "1",
    name: "Polymarket Trade Feed",
    subtitle: "Real-time onchain terminal",
    description: "Live feed of Polymarket trades over 800 USD for Farcaster mini app.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    primaryCategory: "finance",
    tags: ["polymarket", "trading", "terminal", "onchain", "realtime"],

    baseBuilder: {
      ownerAddress: "0xcDB9F067149CA2c8bAe31fD7F5fDCF417deeC7eB"
    },

    ogTitle: "Polymarket Trade Feed",
    ogDescription: "Real-time Polymarket trade feed over 800 USD for Farcaster Mini App",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`
  }
} as const;
