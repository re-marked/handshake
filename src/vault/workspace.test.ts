import { describe, expect, it } from "vitest";
import { parseWorkspace, serializeWorkspace } from "@/vault/workspace";
import type { Workspace } from "@/workspace/model";

/** True when `ws` is structurally the default workspace (ignoring the random pane id). */
function isEmptyWorkspace(ws: Workspace): boolean {
  return (
    ws.layout.kind === "pane" &&
    ws.layout.view.type === "board" &&
    ws.layout.view.id === "main" &&
    ws.activePaneId === ws.layout.id &&
    ws.tabs.length === 1 &&
    ws.tabs[0].type === "board" &&
    ws.floats.length === 0 &&
    ws.noteDefault === "panel"
  );
}

describe("parseWorkspace", () => {
  it("round-trips a workspace with a split and a person tab", () => {
    const ws: Workspace = {
      tabs: [
        { type: "board", id: "main" },
        { type: "people" },
        { type: "person", id: "sarah-chen" },
      ],
      layout: {
        kind: "split",
        id: "s1",
        dir: "row",
        children: [
          { kind: "pane", id: "p1", view: { type: "board", id: "main" } },
          { kind: "pane", id: "p2", view: { type: "person", id: "sarah-chen" } },
        ],
        sizes: [0.6, 0.4],
      },
      activePaneId: "p2",
      floats: [{ id: "f1", view: { type: "people" }, x: 10, y: 20, w: 300, h: 400, z: 1 }],
      noteDefault: "tab",
    };
    expect(parseWorkspace(serializeWorkspace(ws))).toEqual(ws);
  });

  it("falls back to an empty workspace for missing/blank/garbage input", () => {
    expect(isEmptyWorkspace(parseWorkspace(""))).toBe(true);
    expect(isEmptyWorkspace(parseWorkspace("   "))).toBe(true);
    expect(isEmptyWorkspace(parseWorkspace("not json"))).toBe(true);
    expect(isEmptyWorkspace(parseWorkspace("[]"))).toBe(true);
    expect(isEmptyWorkspace(parseWorkspace(JSON.stringify({ tabs: [] })))).toBe(true); // no layout
  });

  it("always keeps a board:main tab and includes every shown view", () => {
    const ws = parseWorkspace(
      JSON.stringify({
        tabs: [{ type: "people" }],
        layout: { kind: "pane", id: "p1", view: { type: "goals" } },
        activePaneId: "p1",
      }),
    );
    const keys = ws.tabs.map((t) => (t.type === "board" ? `board:${t.id}` : t.type));
    expect(keys).toContain("board:main"); // home board is always present
    expect(keys).toContain("goals"); // the shown view is promoted into the bar
    expect(keys).toContain("people");
  });

  it("collapses a single-child split and drops malformed views", () => {
    const ws = parseWorkspace(
      JSON.stringify({
        tabs: [{ type: "board", id: "main" }, { type: "person" }, { type: "bogus" }],
        layout: {
          kind: "split",
          id: "s1",
          dir: "row",
          children: [{ kind: "pane", id: "only", view: { type: "board", id: "main" } }],
          sizes: [1],
        },
        activePaneId: "only",
      }),
    );
    expect(ws.layout).toEqual({ kind: "pane", id: "only", view: { type: "board", id: "main" } });
    // person with no id + unknown type are dropped; only board:main survives
    expect(ws.tabs).toEqual([{ type: "board", id: "main" }]);
  });

  it("renormalizes split sizes to sum 1 and repairs a bad activePaneId", () => {
    const ws = parseWorkspace(
      JSON.stringify({
        tabs: [{ type: "board", id: "main" }],
        layout: {
          kind: "split",
          id: "s1",
          dir: "col",
          children: [
            { kind: "pane", id: "a", view: { type: "board", id: "main" } },
            { kind: "pane", id: "b", view: { type: "people" } },
          ],
          sizes: [3, 1], // not normalized
        },
        activePaneId: "ghost", // references no pane
      }),
    );
    const split = ws.layout;
    if (split.kind !== "split") throw new Error("expected a split");
    expect(split.sizes[0] + split.sizes[1]).toBeCloseTo(1);
    expect(split.sizes).toEqual([0.75, 0.25]);
    expect(["a", "b"]).toContain(ws.activePaneId);
  });

  it("defaults noteDefault and drops malformed floats", () => {
    const ws = parseWorkspace(
      JSON.stringify({
        tabs: [{ type: "board", id: "main" }],
        layout: { kind: "pane", id: "p1", view: { type: "board", id: "main" } },
        activePaneId: "p1",
        noteDefault: "nonsense",
        floats: [
          { id: "ok", view: { type: "people" }, x: 1, y: 2, w: 3, h: 4, z: 5 },
          { id: "bad", view: { type: "people" }, x: 1 }, // missing dims -> dropped
        ],
      }),
    );
    expect(ws.noteDefault).toBe("panel");
    expect(ws.floats).toEqual([{ id: "ok", view: { type: "people" }, x: 1, y: 2, w: 3, h: 4, z: 5 }]);
  });
});
