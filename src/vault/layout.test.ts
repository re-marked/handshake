import { describe, expect, it } from "vitest";
import { emptyLayout, parseLayout, serializeLayout } from "@/vault/layout";

describe("parseLayout", () => {
  it("round-trips a layout", () => {
    const layout = {
      positions: { self: { x: 1, y: 2 }, "sarah-chen": { x: -3, y: 4 } },
      viewport: { pan: { x: 10, y: 20 }, zoom: 1.5 },
      parentOverrides: { "james-liu": "self" },
    };
    expect(parseLayout(serializeLayout(layout))).toEqual(layout);
  });

  it("returns an empty layout for missing/blank/garbage input", () => {
    expect(parseLayout("")).toEqual(emptyLayout());
    expect(parseLayout("   ")).toEqual(emptyLayout());
    expect(parseLayout("not json")).toEqual(emptyLayout());
    expect(parseLayout("[]")).toEqual({ positions: {}, viewport: undefined, parentOverrides: {} });
  });

  it("drops malformed entries instead of crashing", () => {
    const json = JSON.stringify({
      positions: { ok: { x: 1, y: 2 }, bad: { x: "nope" }, nope: 5 },
      viewport: { pan: { x: 1 }, zoom: 2 }, // missing pan.y -> dropped
      parentOverrides: { a: "b", c: 5 },
    });
    const layout = parseLayout(json);
    expect(layout.positions).toEqual({ ok: { x: 1, y: 2 } });
    expect(layout.viewport).toBeUndefined();
    expect(layout.parentOverrides).toEqual({ a: "b" });
  });
});
