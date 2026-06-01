import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { toast, dismiss, useToasts } from "../toast";

beforeEach(() => {
  vi.useFakeTimers();
  useToasts.setState({ toasts: [] });
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
const msgs = () => useToasts.getState().toasts.map((t) => t.message);

describe("toast", () => {
  it("shows then auto-dismisses", () => {
    toast("Hi", { durationMs: 1000 });
    expect(msgs()).toEqual(["Hi"]);
    vi.advanceTimersByTime(1001);
    expect(msgs()).toEqual([]);
  });

  it("coalesces by key into one pill and resets its timer", () => {
    toast("Saved", { key: "saved", durationMs: 1000 });
    vi.advanceTimersByTime(700);
    toast("Saved", { key: "saved", durationMs: 1000 }); // resets the clock
    expect(msgs()).toEqual(["Saved"]); // still a single pill
    vi.advanceTimersByTime(700); // < 1000 since the reset → still alive
    expect(msgs()).toEqual(["Saved"]);
    vi.advanceTimersByTime(400);
    expect(msgs()).toEqual([]);
  });

  it("caps the number of visible pills", () => {
    for (let i = 0; i < 6; i++) toast(`t${i}`, { durationMs: 9999 });
    expect(msgs()).toEqual(["t2", "t3", "t4", "t5"]);
  });

  it("frees a key on manual dismiss (next same-key toast is fresh)", () => {
    const id = toast("A", { key: "k", durationMs: 9999 });
    dismiss(id);
    expect(msgs()).toEqual([]);
    toast("B", { key: "k", durationMs: 9999 });
    expect(msgs()).toEqual(["B"]);
  });
});
