import { describe, expect, it } from "vitest";
import { emptyWorkspace, viewKey, type Leaf, type View, type Workspace } from "@/workspace/model";
import {
  activeView,
  collapseEmpty,
  detachView,
  dropTab,
  findView,
  insertTab,
  leafOf,
  mapLeaf,
  normalizeSizes,
  removeTab,
  setSizes,
  splitNode,
} from "@/workspace/ops";
import type { Leaf as LeafNode, Split } from "@/workspace/model";

function leaf(tabs: View[], activeIndex = 0): Leaf {
  return { kind: "leaf", id: "L", tabs, activeIndex };
}

describe("workspace ops", () => {
  it("insertTab appends + activates a new view", () => {
    const l = insertTab(leaf([{ type: "board", id: "main" }]), { type: "people" });
    expect(l.tabs.map(viewKey)).toEqual(["board:main", "people"]);
    expect(l.activeIndex).toBe(1);
  });

  it("insertTab focuses an existing view instead of duplicating", () => {
    const l = insertTab(leaf([{ type: "board", id: "main" }, { type: "people" }], 0), { type: "people" });
    expect(l.tabs).toHaveLength(2);
    expect(l.activeIndex).toBe(1);
  });

  it("dedupes a person by id, not by type", () => {
    const start = leaf([{ type: "person", id: "sarah" }], 0);
    expect(insertTab(start, { type: "person", id: "sarah" }).tabs).toHaveLength(1);
    expect(insertTab(start, { type: "person", id: "bob" }).tabs).toHaveLength(2);
  });

  it("removeTab shifts activeIndex when removing before the active tab", () => {
    const l = removeTab(leaf([{ type: "board", id: "main" }, { type: "people" }, { type: "goals" }], 2), "people");
    expect(l.tabs.map(viewKey)).toEqual(["board:main", "goals"]);
    expect(l.activeIndex).toBe(1);
  });

  it("removeTab clamps activeIndex when removing the active last tab", () => {
    const l = removeTab(leaf([{ type: "board", id: "main" }, { type: "people" }], 1), "people");
    expect(l.tabs.map(viewKey)).toEqual(["board:main"]);
    expect(l.activeIndex).toBe(0);
  });

  it("findView locates a view across the tree", () => {
    const ws = emptyWorkspace();
    const root = mapLeaf(ws.root, (ws.root as Leaf).id, (l) => insertTab(l, { type: "people" }));
    expect(findView(root, "people")?.index).toBe(1);
    expect(findView(root, "goals")).toBeUndefined();
  });

  it("leafOf returns the leaf holding a view key", () => {
    const ws = emptyWorkspace();
    const root = mapLeaf(ws.root, (ws.root as Leaf).id, (l) => insertTab(l, { type: "people" }));
    expect(leafOf(root, "people")?.id).toBe((ws.root as Leaf).id);
    expect(leafOf(root, "goals")).toBeUndefined();
  });

  it("activeView returns the active leaf's active tab", () => {
    const ws = emptyWorkspace();
    const root = mapLeaf(ws.root, (ws.root as Leaf).id, (l) => insertTab(l, { type: "people" }));
    expect(activeView({ ...ws, root })?.type).toBe("people");
  });

  it("splitNode wraps a leaf in a 50/50 split", () => {
    const ws = emptyWorkspace();
    const newLeaf: LeafNode = { kind: "leaf", id: "N", tabs: [{ type: "people" }], activeIndex: 0 };
    const root = splitNode(ws.root, (ws.root as Leaf).id, "row", newLeaf) as Split;
    expect(root.kind).toBe("split");
    expect(root.dir).toBe("row");
    expect(root.children).toHaveLength(2);
    expect(root.sizes).toEqual([0.5, 0.5]);
  });

  it("setSizes updates a split's sizes", () => {
    const split: Split = {
      kind: "split",
      id: "S",
      dir: "row",
      children: [
        { kind: "leaf", id: "A", tabs: [{ type: "board", id: "main" }], activeIndex: 0 },
        { kind: "leaf", id: "B", tabs: [{ type: "people" }], activeIndex: 0 },
      ],
      sizes: [0.5, 0.5],
    };
    expect((setSizes(split, "S", [0.7, 0.3]) as Split).sizes).toEqual([0.7, 0.3]);
  });

  it("collapseEmpty unwraps a split when a pane empties", () => {
    const split: Split = {
      kind: "split",
      id: "S",
      dir: "row",
      children: [
        { kind: "leaf", id: "A", tabs: [{ type: "board", id: "main" }], activeIndex: 0 },
        { kind: "leaf", id: "B", tabs: [], activeIndex: 0 },
      ],
      sizes: [0.5, 0.5],
    };
    const root = collapseEmpty(split);
    expect(root.kind).toBe("leaf");
    expect((root as Leaf).id).toBe("A");
  });

  it("collapseEmpty unwraps a nested split when a deep leaf empties", () => {
    const split: Split = {
      kind: "split",
      id: "outer",
      dir: "row",
      children: [
        { kind: "leaf", id: "A", tabs: [{ type: "board", id: "main" }], activeIndex: 0 },
        {
          kind: "split",
          id: "inner",
          dir: "col",
          children: [
            { kind: "leaf", id: "B", tabs: [{ type: "people" }], activeIndex: 0 },
            { kind: "leaf", id: "C", tabs: [], activeIndex: 0 },
          ],
          sizes: [0.5, 0.5],
        },
      ],
      sizes: [0.5, 0.5],
    };
    const root = collapseEmpty(split) as Split;
    // inner split collapses to leaf B; outer stays a split of [A, B]
    expect(root.kind).toBe("split");
    expect(root.children.map((c) => (c as Leaf).id)).toEqual(["A", "B"]);
  });

  it("detachView removes a view from the tree + floats and repairs activeLeafId", () => {
    const ws = emptyWorkspace();
    const newLeaf: Leaf = { kind: "leaf", id: "N", tabs: [{ type: "people" }], activeIndex: 0 };
    const root = splitNode(ws.root, (ws.root as Leaf).id, "row", newLeaf);
    const w2: Workspace = { ...ws, root, activeLeafId: "N" };
    const out = detachView(w2, "people");
    expect(findView(out.root, "people")).toBeUndefined();
    expect(out.root.kind).toBe("leaf"); // split collapsed back to the board leaf
    expect(out.activeLeafId).toBe((ws.root as Leaf).id); // repaired away from removed leaf "N"
  });

  it("normalizeSizes equal-splits when the count changes, renormalizes otherwise", () => {
    expect(normalizeSizes([0.5, 0.5], 3)).toEqual([1 / 3, 1 / 3, 1 / 3]);
    expect(normalizeSizes([2, 2], 2)).toEqual([0.5, 0.5]);
  });

  it("dropTab center moves a tab into another leaf and collapses the emptied source", () => {
    // split: A=[board] | B=[people]; drag people from B into A
    const ws = emptyWorkspace();
    const root = splitNode(ws.root, (ws.root as Leaf).id, "row", {
      kind: "leaf",
      id: "B",
      tabs: [{ type: "people" }],
      activeIndex: 0,
    });
    const aId = (ws.root as Leaf).id;
    const out = dropTab({ ...ws, root, activeLeafId: "B" }, "B", "people", aId, "center");
    expect(out.root.kind).toBe("leaf"); // B emptied → split collapsed to A
    expect(out.activeLeafId).toBe(aId);
    if (out.root.kind === "leaf") expect(out.root.tabs.map(viewKey)).toEqual(["board:main", "people"]);
  });

  it("dropTab edge splits a leaf with the dragged tab in a new pane on that side", () => {
    // one leaf [board, people]; drag people to the right edge → row split [rest | people]
    const ws = emptyWorkspace();
    const root = mapLeaf(ws.root, (ws.root as Leaf).id, (l) => insertTab(l, { type: "people" }));
    const leafId = (ws.root as Leaf).id;
    const out = dropTab({ ...ws, root }, leafId, "people", leafId, "right");
    expect(out.root.kind).toBe("split");
    if (out.root.kind === "split") {
      expect(out.root.dir).toBe("row");
      const [left, right] = out.root.children;
      expect((left as Leaf).tabs.map(viewKey)).toEqual(["board:main"]);
      expect((right as Leaf).tabs.map(viewKey)).toEqual(["people"]);
      expect(out.activeLeafId).toBe((right as Leaf).id);
    }
  });

  it("dropTab left puts the new pane before the target", () => {
    const ws = emptyWorkspace();
    const root = mapLeaf(ws.root, (ws.root as Leaf).id, (l) => insertTab(l, { type: "people" }));
    const leafId = (ws.root as Leaf).id;
    const out = dropTab({ ...ws, root }, leafId, "people", leafId, "left");
    if (out.root.kind === "split") {
      expect((out.root.children[0] as Leaf).tabs.map(viewKey)).toEqual(["people"]);
      expect((out.root.children[1] as Leaf).tabs.map(viewKey)).toEqual(["board:main"]);
    }
  });

  it("dropTab is a no-op for center-onto-self and for edge-splitting a lone tab", () => {
    const ws = emptyWorkspace();
    const leafId = (ws.root as Leaf).id;
    expect(dropTab(ws, leafId, "board:main", leafId, "center")).toBe(ws);
    expect(dropTab(ws, leafId, "board:main", leafId, "right")).toBe(ws); // only one tab
  });
});
