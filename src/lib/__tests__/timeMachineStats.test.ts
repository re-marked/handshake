import { describe, it, expect } from "vitest";
import { estimateGrowth } from "../timeMachineStats";
import type { TmStats } from "@/vault/io";

const DAY = 86_400;
const base: TmStats = {
  snapshots: 40,
  firstTime: 1_000_000,
  lastTime: 1_000_000 + 10 * DAY, // 10-day span
  activeDays: 8,
  addedBytes: 80_000, // 10 KB / active day
  dataBytes: 50_000,
  gitBytes: 200_000,
};

describe("estimateGrowth", () => {
  it("reports content written per active day", () => {
    const e = estimateGrowth(base, 60);
    expect(e.writtenPerActiveDay).toBe(80_000 / 8); // 10 KB
    expect(e.ready).toBe(true);
  });

  it("projects more monthly growth at a finer cadence", () => {
    const often = estimateGrowth(base, 5); // every 5 min
    const rare = estimateGrowth(base, 1440); // once a day
    expect(often.perMonth).toBeGreaterThan(rare.perMonth);
  });

  it("is not ready with too little history", () => {
    expect(estimateGrowth({ ...base, snapshots: 1, addedBytes: 100 }, 5).ready).toBe(false);
    expect(estimateGrowth({ ...base, addedBytes: 0 }, 5).ready).toBe(false);
  });

  it("never divides by zero on an empty repo", () => {
    const empty: TmStats = { snapshots: 0, firstTime: 0, lastTime: 0, activeDays: 0, addedBytes: 0, dataBytes: 0, gitBytes: 0 };
    const e = estimateGrowth(empty, 5);
    expect(Number.isFinite(e.perMonth)).toBe(true);
    expect(e.ready).toBe(false);
  });
});
