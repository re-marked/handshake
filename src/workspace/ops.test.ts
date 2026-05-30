import { describe, expect, it } from "vitest";
import { emptyWorkspace, viewKey, type Pane, type Split, type View } from "@/workspace/model";
import {
  activeView,
  findPane,
  normalizeSizes,
  paneShowing,
  panes,
  removePane,
  setPaneView,
  setSizes,
  splitPane,
} from "@/workspace/ops";

const board: View = { type: "board", id: "main" };
const people: View = { type: "people" };
const sarah: View = { type: "person", id: "sarah" };

function pane(id: string, view: View): Pane {
  return { kind: "pane", id, view };
}

describe("workspace ops", () => {
  it("emptyWorkspace: one board tab shown in one pane", () => {
    const ws = emptyWorkspace();
    expect(ws.tabs.map(viewKey)).toEqual(["board:main"]);
    expect(panes(ws.layout)).toHaveLength(1);
    expect(activeView(ws)?.type).toBe("board");
  });

  it("setPaneView swaps a pane's view", () => {
    const ws = emptyWorkspace();
    const layout = setPaneView(ws.layout, ws.activePaneId, people);
    expect((layout as Pane).view).toEqual(people);
    expect(paneShowing(layout, "people")).toBeDefined();
  });

  it("splitPane wraps a pane in a 50/50 split", () => {
    const ws = emptyWorkspace();
    const layout = splitPane(ws.layout, ws.activePaneId, "row", pane("N", sarah)) as Split;
    expect(layout.kind).toBe("split");
    expect(layout.children).toHaveLength(2);
    expect(layout.sizes).toEqual([0.5, 0.5]);
    expect(panes(layout).map((p) => viewKey(p.view))).toEqual(["board:main", "person:sarah"]);
  });

  it("removePane collapses a split back to the surviving pane", () => {
    const split: Split = {
      kind: "split",
      id: "S",
      dir: "row",
      children: [pane("A", board), pane("B", people)],
      sizes: [0.5, 0.5],
    };
    const layout = removePane(split, "B");
    expect(layout.kind).toBe("pane");
    expect((layout as Pane).id).toBe("A");
  });

  it("findPane / paneShowing locate panes", () => {
    const split: Split = {
      kind: "split",
      id: "S",
      dir: "row",
      children: [pane("A", board), pane("B", sarah)],
      sizes: [0.5, 0.5],
    };
    expect(findPane(split, "B")?.view).toEqual(sarah);
    expect(paneShowing(split, "person:sarah")?.id).toBe("B");
    expect(paneShowing(split, "goals")).toBeUndefined();
  });

  it("setSizes updates a split's sizes", () => {
    const split: Split = {
      kind: "split",
      id: "S",
      dir: "row",
      children: [pane("A", board), pane("B", people)],
      sizes: [0.5, 0.5],
    };
    expect((setSizes(split, "S", [0.7, 0.3]) as Split).sizes).toEqual([0.7, 0.3]);
  });

  it("normalizeSizes equal-splits when the count changes, renormalizes otherwise", () => {
    expect(normalizeSizes([0.5, 0.5], 3)).toEqual([1 / 3, 1 / 3, 1 / 3]);
    expect(normalizeSizes([2, 2], 2)).toEqual([0.5, 0.5]);
  });
});
