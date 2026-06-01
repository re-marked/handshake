/** Human-readable byte size, e.g. 0 B / 14 KB / 2.1 MB. */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 1) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const n = bytes / 1024 ** i;
  return `${i === 0 ? Math.round(n) : n.toFixed(1)} ${units[i]}`;
}

/** A snapshot interval in minutes as a friendly phrase, e.g. 5 → "5 min", 120 → "2 hours". */
export function formatCadence(min: number): string {
  if (min < 60) return `${min} min`;
  if (min < 1440) {
    const h = min / 60;
    return h === 1 ? "1 hour" : `${Number.isInteger(h) ? h : h.toFixed(1)} hours`;
  }
  const d = min / 1440;
  return d === 1 ? "1 day" : `${d} days`;
}

/** Coarse "time ago" for snapshot timestamps (unix seconds). `nowMs` is injectable for tests. */
export function relativeTime(unixSeconds: number, nowMs = Date.now()): string {
  const diff = Math.max(0, nowMs - unixSeconds * 1000);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}
