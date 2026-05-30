import { describe, expect, it } from "vitest";
import { emptyWorkspace, viewKey, type Leaf, type View } from "@/workspace/model";
import { activeView, findView, insertTab, mapLeaf, removeTab } from "@/workspace/ops";

function leaf(tabs: View[], activeIndex = 0): Leaf {
  return { kind: "leaf", id: "L", tabs, activeIndex };
}

describe("workspace ops", () => {
  it("insertTab appends + activates a new view", () => {
    const l = insertTab(leaf([{ type: "board" }]), { type: "people" });
    expect(l.tabs.map(viewKey)).toEqual(["board", "people"]);
    expect(l.activeIndex).toBe(1);
  });

  it("insertTab focuses an existing view instead of duplicating", () => {
    const l = insertTab(leaf([{ type: "board" }, { type: "people" }], 0), { type: "people" });
    expect(l.tabs).toHaveLength(2);
    expect(l.activeIndex).toBe(1);
  });

  it("dedupes a person by id, not by type", () => {
    const start = leaf([{ type: "person", id: "sarah" }], 0);
    expect(insertTab(start, { type: "person", id: "sarah" }).tabs).toHaveLength(1);
    expect(insertTab(start, { type: "person", id: "bob" }).tabs).toHaveLength(2);
  });

  it("removeTab shifts activeIndex when removing before the active tab", () => {
    const l = removeTab(leaf([{ type: "board" }, { type: "people" }, { type: "goals" }], 2), "people");
    expect(l.tabs.map(viewKey)).toEqual(["board", "goals"]);
    expect(l.activeIndex).toBe(1);
  });

  it("removeTab clamps activeIndex when removing the active last tab", () => {
    const l = removeTab(leaf([{ type: "board" }, { type: "people" }], 1), "people");
    expect(l.tabs.map(viewKey)).toEqual(["board"]);
    expect(l.activeIndex).toBe(0);
  });

  it("findView locates a view across the tree", () => {
    const ws = emptyWorkspace();
    const root = mapLeaf(ws.root, (ws.root as Leaf).id, (l) => insertTab(l, { type: "people" }));
    expect(findView(root, "people")?.index).toBe(1);
    expect(findView(root, "goals")).toBeUndefined();
  });

  it("activeView returns the active leaf's active tab", () => {
    const ws = emptyWorkspace();
    const root = mapLeaf(ws.root, (ws.root as Leaf).id, (l) => insertTab(l, { type: "people" }));
    expect(activeView({ ...ws, root })?.type).toBe("people");
  });
});
