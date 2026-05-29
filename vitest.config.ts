import { defineConfig } from "vitest/config";

// The Switchboard engine is pure TS — node environment, no React/Tailwind plugins.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
