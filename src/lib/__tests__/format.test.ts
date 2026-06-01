import { describe, it, expect } from "vitest";
import { formatBytes, formatCadence, relativeTime } from "../format";

describe("formatBytes", () => {
  it("scales through the units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatBytes(3 * 1024 ** 3)).toBe("3.0 GB");
  });
});

describe("formatCadence", () => {
  it("reads as a friendly interval", () => {
    expect(formatCadence(1)).toBe("1 min");
    expect(formatCadence(5)).toBe("5 min");
    expect(formatCadence(60)).toBe("1 hour");
    expect(formatCadence(120)).toBe("2 hours");
    expect(formatCadence(1440)).toBe("1 day");
  });
});

describe("relativeTime", () => {
  const now = 1_000_000_000_000;
  const ago = (ms: number) => relativeTime((now - ms) / 1000, now);
  it("buckets durations", () => {
    expect(ago(10_000)).toBe("just now");
    expect(ago(5 * 60_000)).toBe("5m ago");
    expect(ago(3 * 3_600_000)).toBe("3h ago");
    expect(ago(2 * 86_400_000)).toBe("2d ago");
    expect(ago(3 * 7 * 86_400_000)).toBe("3w ago");
  });
});
