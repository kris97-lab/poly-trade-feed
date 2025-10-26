import { defineConfig } from "@wagmi/cli";
import { react } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "wagmi.generated.ts",
  plugins: [react()],
});