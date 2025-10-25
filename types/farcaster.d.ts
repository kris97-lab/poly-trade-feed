// types/farcaster.d.ts
import "@farcaster/miniapp-sdk";

declare module "@farcaster/miniapp-sdk" {
  interface MiniAppSDK {
    user?: {
      get?: () => Promise<{
        fid: number;
        username: string;
        displayName?: string;
        pfp?: { url?: string };
      } | undefined>;
    };
  }

  interface MiniAppActions {
    requestWallet: () => Promise<void>;
  }
}