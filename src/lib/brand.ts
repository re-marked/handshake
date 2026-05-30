/**
 * Brand identity — the ONE place to change the app's name and logo.
 *
 * To rebrand everywhere, either:
 *   1. drop a new image at `public/handshake-logo.png` (the favicon + UI share that file), or
 *   2. repoint `BRAND.logo` below to any other path under `public/`.
 *
 * `BRAND.logo` is a public-dir URL (served from the web root), so it's the exact same
 * reference the `<link rel="icon">` in index.html uses. Native window/installer icons in
 * `src-tauri/icons/` are baked at build time — regenerate them from the same source with
 * `pnpm tauri icon public/handshake-logo.png`.
 */
export const BRAND = {
  name: "Handshake",
  /** Logo asset, served from /public. Same file the favicon points at. */
  logo: "/handshake-logo.png",
} as const;
