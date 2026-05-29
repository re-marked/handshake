import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// The Switchboard engine is pure TS — node environment, no React/Tailwind plugins.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
