import { describe, expect, it } from "vitest";
import { parseWorkspace, serializeWorkspace } from "@/vault/workspace";
import type { Workspace } from "@/workspace/model";

/** True when `ws` is structurally the default workspace (ignoring the random leaf id). */
function isEmptyWorkspace(ws: Workspace): boolean {
  return (
    ws.root.kind === "leaf" &&
    ws.root.tabs.length === 1 &&
    ws.root.tabs[0].type === "board" &&
    ws.root.tabs[0].id === "main" &&
    ws.activeLeafId === ws.root.id &&
    ws.floats.length === 0 &&
    ws.noteDefault === "panel" &&
    ws.layoutMode === "tabs"
  );
}

describe("parseWorkspace", () => {
  it("round-trips a split of two leaves + a float + simple mode", () => {
    const ws: Workspace = {
      root: {
        kind: "split",
        id: "s1",
        dir: "row",
        children: [
          { kind: "leaf", id: "L1", tabs: [{ type: "board", id: "main" }, { type: "people" }], activeIndex: 1 },
          { kind: "leaf", id: "L2", tabs: [{ type: "person", id: "sarah-chen" }], activeIndex: 0 },
        ],
        sizes: [0.6, 0.4],
      },
      floats: [{ id: "f1", view: { type: "goals" }, x: 10, y: 20, w: 300, h: 400, z: 1 }],
      activeLeafId: "L2",
      noteDefault: "tab",
      layoutMode: "simple",
    };
    expect(parseWorkspace(serializeWorkspace(ws))).toEqual(ws);
  });

  it("falls back to an empty workspace for missing/blank/garbage and the OLD pane shape", () => {
    expect(isEmptyWorkspace(parseWorkspace(""))).toBe(true);
    expect(isEmptyWorkspace(parseWorkspace("   "))).toBe(true);
    expect(isEmptyWorkspace(parseWorkspace("not json"))).toBe(true);
    expect(isEmptyWorkspace(parseWorkspace("[]"))).toBe(true);
    // pre-rework on-disk shape had {tabs, layout, activePaneId} and no `root` → one-time reset.
    const oldShape = JSON.stringify({
      tabs: [{ type: "board", id: "main" }],
      layout: { kind: "pane", id: "p", view: { type: "board", id: "main" } },
      activePaneId: "p",
    });
    expect(isEmptyWorkspace(parseWorkspace(oldShape))).toBe(true);
  });

  it("injects the home board into the first leaf when it's missing", () => {
    const ws = parseWorkspace(
      JSON.stringify({
        root: { kind: "leaf", id: "L", tabs: [{ type: "people" }], activeIndex: 0 },
        activeLeafId: "L",
      }),
    );
    expect(ws.root.kind).toBe("leaf");
    if (ws.root.kind === "leaf") {
      expect(ws.root.tabs.some((t) => t.type === "board" && t.id === "main")).toBe(true);
      expect(ws.root.tabs.some((t) => t.type === "people")).toBe(true);
    }
  });

  it("collapses a single-child split", () => {
    const ws = parseWorkspace(
      JSON.stringify({
        root: {
          kind: "split",
          id: "s",
          dir: "row",
          children: [{ kind: "leaf", id: "only", tabs: [{ type: "board", id: "main" }], activeIndex: 0 }],
          sizes: [1],
        },
        activeLeafId: "only",
      }),
    );
    expect(ws.root).toEqual({ kind: "leaf", id: "only", tabs: [{ type: "board", id: "main" }], activeIndex: 0 });
  });

  it("drops malformed views and clamps a bad activeIndex", () => {
    const ws = parseWorkspace(
      JSON.stringify({
        root: {
          kind: "leaf",
          id: "L",
          tabs: [{ type: "board", id: "main" }, { type: "bogus" }, { type: "person" }],
          activeIndex: 9,
        },
        activeLeafId: "L",
      }),
    );
    expect(ws.root.kind).toBe("leaf");
    if (ws.root.kind === "leaf") {
      expect(ws.root.tabs.map((t) => t.type)).toEqual(["board"]); // bogus + idless person dropped
      expect(ws.root.activeIndex).toBe(0); // clamped into range
    }
  });

  it("renormalizes split sizes to sum 1 and repairs a bad activeLeafId", () => {
    const ws = parseWorkspace(
      JSON.stringify({
        root: {
          kind: "split",
          id: "s",
          dir: "col",
          children: [
            { kind: "leaf", id: "a", tabs: [{ type: "board", id: "main" }], activeIndex: 0 },
            { kind: "leaf", id: "b", tabs: [{ type: "people" }], activeIndex: 0 },
          ],
          sizes: [3, 1], // not normalized
        },
        activeLeafId: "ghost", // references no leaf
      }),
    );
    const root = ws.root;
    if (root.kind !== "split") throw new Error("expected a split");
    expect(root.sizes[0] + root.sizes[1]).toBeCloseTo(1);
    expect(root.sizes).toEqual([0.75, 0.25]);
    expect(["a", "b"]).toContain(ws.activeLeafId);
  });

  it("defaults noteDefault + layoutMode and drops malformed floats", () => {
    const ws = parseWorkspace(
      JSON.stringify({
        root: { kind: "leaf", id: "L", tabs: [{ type: "board", id: "main" }], activeIndex: 0 },
        activeLeafId: "L",
        noteDefault: "nonsense",
        layoutMode: "bogus",
        floats: [
          { id: "ok", view: { type: "people" }, x: 1, y: 2, w: 3, h: 4, z: 5 },
          { id: "bad", view: { type: "people" }, x: 1 }, // missing dims -> dropped
        ],
      }),
    );
    expect(ws.noteDefault).toBe("panel");
    expect(ws.layoutMode).toBe("tabs");
    expect(ws.floats).toEqual([{ id: "ok", view: { type: "people" }, x: 1, y: 2, w: 3, h: 4, z: 5 }]);
  });
});
