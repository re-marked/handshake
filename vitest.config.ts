import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// The Switchboard engine is pure TS — node environment, no React/Tailwind plugins. A couple of
// .tsx tests render markdown via react-dom/server (no DOM needed) to smoke-test the render path.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
