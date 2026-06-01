import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { notify, dismiss, useToasts } from "../toast";

beforeEach(() => {
  vi.useFakeTimers();
  useToasts.setState({ toasts: [] });
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
const titles = () => useToasts.getState().toasts.map((t) => t.title);

describe("notify", () => {
  it("shows then auto-dismisses", () => {
    notify("Hi", { durationMs: 1000 });
    expect(titles()).toEqual(["Hi"]);
    vi.advanceTimersByTime(1001);
    expect(titles()).toEqual([]);
  });

  it("coalesces by key into one card and resets its timer", () => {
    notify("Saved", { key: "saved", durationMs: 1000 });
    vi.advanceTimersByTime(700);
    notify("Saved", { key: "saved", durationMs: 1000 }); // resets the clock
    expect(titles()).toEqual(["Saved"]); // still a single card
    vi.advanceTimersByTime(700); // < 1000 since the reset → still alive
    expect(titles()).toEqual(["Saved"]);
    vi.advanceTimersByTime(400);
    expect(titles()).toEqual([]);
  });

  it("caps the number of visible cards", () => {
    for (let i = 0; i < 6; i++) notify(`t${i}`, { durationMs: 9999 });
    expect(titles()).toEqual(["t2", "t3", "t4", "t5"]);
  });

  it("frees a key on manual dismiss (next same-key notify is fresh)", () => {
    const id = notify("A", { key: "k", durationMs: 9999 });
    dismiss(id);
    expect(titles()).toEqual([]);
    notify("B", { key: "k", durationMs: 9999 });
    expect(titles()).toEqual(["B"]);
  });
});
