// ── Pure transforms over the workspace tree ──────────────────────────────────
// No React/Tauri/store. Every function returns a new tree (immutably) so the
// store can `set({ workspace: { ...ws, root: fn(ws.root, ...) } })`.

import { newId, viewKey, type Leaf, type Node, type Split, type View, type Workspace } from "./model";

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

/** The leaf currently holding a view (by key), anywhere in the tree. */
export function leafOf(node: Node, key: string): Leaf | undefined {
  return findView(node, key)?.leaf;
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

/** Find any node (leaf or split) by id. */
export function findNode(node: Node, id: string): Node | undefined {
  if (node.id === id) return node;
  if (node.kind === "split") {
    for (const c of node.children) {
      const found = findNode(c, id);
      if (found) return found;
    }
  }
  return undefined;
}

/** Replace any node (by id) with a replacement subtree. */
export function replaceNode(node: Node, id: string, replacement: Node): Node {
  if (node.id === id) return replacement;
  if (node.kind === "split") {
    return { ...node, children: node.children.map((c) => replaceNode(c, id, replacement)) };
  }
  return node;
}

/** Wrap a leaf in a new Split alongside a new leaf (50/50). */
export function splitNode(root: Node, leafId: string, dir: "row" | "col", newLeaf: Leaf): Node {
  const target = findNode(root, leafId);
  if (!target) return root;
  const split: Split = { kind: "split", id: newId(), dir, children: [target, newLeaf], sizes: [0.5, 0.5] };
  return replaceNode(root, leafId, split);
}

/** Set a split's sizes (fractions). */
export function setSizes(node: Node, splitId: string, sizes: number[]): Node {
  if (node.kind !== "split") return node;
  if (node.id === splitId) return { ...node, sizes };
  return { ...node, children: node.children.map((c) => setSizes(c, splitId, sizes)) };
}

/** Normalize sizes to length n summing to 1 (equal split if the shape changed). */
export function normalizeSizes(sizes: number[], n: number): number[] {
  if (sizes.length === n) {
    const sum = sizes.reduce((a, b) => a + b, 0);
    if (sum > 0) return sizes.map((s) => s / sum);
  }
  return Array.from({ length: n }, () => 1 / n);
}

/** Drop empty leaves and unwrap single-child splits; renormalize sizes. */
export function collapseEmpty(node: Node): Node {
  if (node.kind === "leaf") return node;
  const children = node.children
    .map(collapseEmpty)
    .filter((c) => !(c.kind === "leaf" && c.tabs.length === 0));
  if (children.length === 1) return children[0];
  if (children.length === 0) return node.children[0]; // unreachable: the board pins a leaf
  return { ...node, children, sizes: normalizeSizes(node.sizes, children.length) };
}

/**
 * Remove a view from everywhere it lives — its tab in the tree (collapsing an emptied
 * leaf) and any float — and repair `activeLeafId` if its leaf went away. The slide-in
 * panel (openPersonId) lives outside Workspace, so the store clears that separately.
 */
export function detachView(ws: Workspace, key: string): Workspace {
  const hit = findView(ws.root, key);
  const root = hit ? collapseEmpty(mapLeaf(ws.root, hit.leaf.id, (l) => removeTab(l, key))) : ws.root;
  const floats = ws.floats.filter((f) => viewKey(f.view) !== key);
  const ids = new Set(leaves(root).map((l) => l.id));
  const activeLeafId = ids.has(ws.activeLeafId) ? ws.activeLeafId : leaves(root)[0].id;
  return { ...ws, root, floats, activeLeafId };
}
