// ── Pure transforms over the workspace tree ──────────────────────────────────
// No React/Tauri/store. Every function returns a new tree (immutably) so the
// store can `set({ workspace: { ...ws, root: fn(ws.root, ...) } })`.

import { viewKey, type Leaf, type Node, type View, type Workspace } from "./model";

/** All leaves in the tree, left-to-right. */
export function leaves(node: Node): Leaf[] {
  return node.kind === "leaf" ? [node] : node.children.flatMap(leaves);
}

export function findLeaf(node: Node, id: string): Leaf | undefined {
  return leaves(node).find((l) => l.id === id);
}

/** Locate a view by key anywhere in the tree (for dedupe-then-focus). */
export function findView(node: Node, key: string): { leaf: Leaf; index: number } | undefined {
  for (const leaf of leaves(node)) {
    const index = leaf.tabs.findIndex((v) => viewKey(v) === key);
    if (index >= 0) return { leaf, index };
  }
  return undefined;
}

/** Replace the leaf with the given id by `fn(leaf)`; other nodes pass through. */
export function mapLeaf(node: Node, id: string, fn: (leaf: Leaf) => Leaf): Node {
  if (node.kind === "leaf") return node.id === id ? fn(node) : node;
  return { ...node, children: node.children.map((c) => mapLeaf(c, id, fn)) };
}

/** Append a tab and activate it — or, if its key is already present, just focus it. */
export function insertTab(leaf: Leaf, view: View): Leaf {
  const key = viewKey(view);
  const existing = leaf.tabs.findIndex((v) => viewKey(v) === key);
  if (existing >= 0) return { ...leaf, activeIndex: existing };
  return { ...leaf, tabs: [...leaf.tabs, view], activeIndex: leaf.tabs.length };
}

/** Remove the tab with the given key, keeping a sane activeIndex. */
export function removeTab(leaf: Leaf, key: string): Leaf {
  const index = leaf.tabs.findIndex((v) => viewKey(v) === key);
  if (index < 0) return leaf;
  const tabs = leaf.tabs.filter((_, i) => i !== index);
  if (tabs.length === 0) return { ...leaf, tabs, activeIndex: 0 };
  const activeIndex =
    leaf.activeIndex > index ? leaf.activeIndex - 1 : Math.min(leaf.activeIndex, tabs.length - 1);
  return { ...leaf, tabs, activeIndex };
}

/** The active View of the active leaf (what the rail highlights / "current view"). */
export function activeView(ws: Workspace): View | undefined {
  const leaf = findLeaf(ws.root, ws.activeLeafId) ?? leaves(ws.root)[0];
  return leaf?.tabs[leaf.activeIndex];
}
