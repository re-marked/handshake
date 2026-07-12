// Build metadata, baked in by vite.config.ts (__BUILD_INFO__). Shared by Settings → About and
// the rail's info popover so the two never drift.

export function appVersion(): string {
  return __BUILD_INFO__.version;
}

/** "v0.7.1 · a1b2c3d · built Jun 1, 2026, 5:27 PM" – exact tag if HEAD is on one, else the version. */
export function buildLine(): string {
  const b = __BUILD_INFO__;
  let built = b.time;
  try {
    built = new Date(b.time).toLocaleString();
  } catch {
    /* keep the raw ISO string */
  }
  return [b.tag || `v${b.version}`, b.sha, `built ${built}`].filter(Boolean).join(" · ");
}
