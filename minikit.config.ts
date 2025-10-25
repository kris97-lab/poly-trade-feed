const ROOT_URL =
  process.env.NEXT_PUBLIC_MINIAPP_URL ||
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const minikitConfig = {
  accountAssociation: {
    header: "",      // ← вставим после генерации в Base Build
    payload: "",     // ← вставим после генерации
    signature: ""    // ← вставим после генерации
  },
  miniapp: {
    version: "1",
    name: "Polymarket Trade Feed",
    subtitle: "Real-time onchain terminal",
    description: "Live feed of Polymarket trades > $800 for Farcaster mini app.",
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
    ogDescription: "Farcaster Mini App — real-time feed of >$800 trades on Polymarket",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`
  }
} as const;
