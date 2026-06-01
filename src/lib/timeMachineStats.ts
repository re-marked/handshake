import type { TmStats } from "@/vault/io";

/** A projection of how your network's git history will grow, derived from your actual activity. */
export interface GrowthEstimate {
  /** Enough history to project from. */
  ready: boolean;
  spanDays: number;
  activeDays: number;
  /** Bytes of content (added lines) you write on a typical active day. */
  writtenPerActiveDay: number;
  /** Projected `.git` growth per month at the chosen cadence. */
  perMonth: number;
}

const DAY = 86_400;
// A typical active day involves a bounded editing window; a finer cadence captures more of it as
// distinct restore points (1 day → ~1 snapshot; 1 min → the whole window). Deliberately a model.
const ACTIVE_WINDOW_MIN = 90;

/**
 * Estimate monthly history growth from the aggregated past: how much you write per active day, how
 * often you're active, and how many snapshots a given cadence would capture. An estimate, not a
 * guarantee — git de-duplicates, so real growth is usually lower.
 */
export function estimateGrowth(stats: TmStats, cadenceMin: number): GrowthEstimate {
  const spanDays = Math.max(1, (stats.lastTime - stats.firstTime) / DAY);
  const activeDays = Math.max(1, stats.activeDays);
  const writtenPerActiveDay = stats.addedBytes / activeDays;
  const ready = stats.snapshots >= 3 && stats.addedBytes > 0;

  // Empirical compressed storage per snapshot, floored at git's per-commit object overhead.
  const perSnapshot = stats.snapshots > 0 ? Math.max(300, stats.gitBytes / stats.snapshots) : 0;
  // Active days you'd have in a month, from how often you've actually been active.
  const activeDaysPerMonth = Math.min(30, Math.max(1, Math.round(activeDays / (spanDays / 30))));
  // Snapshots captured on an active day at this interval.
  const cadence = Math.max(1, cadenceMin);
  const snapsPerActiveDay = Math.min(ACTIVE_WINDOW_MIN, Math.max(1, ACTIVE_WINDOW_MIN / cadence));
  const perMonth = perSnapshot * snapsPerActiveDay * activeDaysPerMonth;

  return { ready, spanDays, activeDays, writtenPerActiveDay, perMonth };
}
