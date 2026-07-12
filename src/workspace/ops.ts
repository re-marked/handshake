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

/** Append a tab and activate it – or, if its key is already present, just focus it. */
export function insertTab(leaf: Leaf, view: View): Leaf {
  const key = viewKey(view);
  const existing = leaf.tabs.findIndex((v) => viewKey(v) === key);
  if (existing >= 0) return { ...leaf, activeIndex: existing };
  return { ...leaf, tabs: [...leaf.tabs, view], activeIndex: leaf.tabs.length };
}

/**
 * Insert `view` at position `index`, and make it active. If the view is already in this leaf this
 * is a reorder (it's pulled out first, and the index is adjusted for that removal). The index is
 * clamped to the valid range. Powers drag-to-reorder within a strip and precise cross-pane drops.
 */
export function insertTabAt(leaf: Leaf, view: View, index: number): Leaf {
  const key = viewKey(view);
  const existing = leaf.tabs.findIndex((v) => viewKey(v) === key);
  const base = existing >= 0 ? leaf.tabs.filter((_, i) => i !== existing) : leaf.tabs;
  const at = Math.max(0, Math.min(existing >= 0 && index > existing ? index - 1 : index, base.length));
  return { ...leaf, tabs: [...base.slice(0, at), view, ...base.slice(at)], activeIndex: at };
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

/** Wrap a leaf in a new Split alongside a new leaf (50/50). `before` puts the new leaf first
 *  (i.e. left/top of the target) instead of after it. */
export function splitNode(
  root: Node,
  leafId: string,
  dir: "row" | "col",
  newLeaf: Leaf,
  before = false,
): Node {
  const target = findNode(root, leafId);
  if (!target) return root;
  const children = before ? [newLeaf, target] : [target, newLeaf];
  const split: Split = { kind: "split", id: newId(), dir, children, sizes: [0.5, 0.5] };
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
 * Remove a view from everywhere it lives – its tab in the tree (collapsing an emptied
 * leaf) and any float – and repair `activeLeafId` if its leaf went away. The slide-in
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

/** Where a dragged tab lands on a target leaf: its body (`center` → move into the leaf) or an
 *  edge (→ split the leaf, the dragged tab taking the new pane on that side). */
export type DropSide = "left" | "right" | "top" | "bottom" | "center";

/**
 * Drag a tab (`key`, from `srcLeafId`) onto `destLeafId`. `center` moves it into that leaf – at a
 * specific `index` when dropped on a tab strip (so it reorders / lands where you point), else
 * appended; an edge splits the leaf with the tab in a new pane on that side. Removing it from the
 * source collapses an emptied leaf. No-ops that would do nothing useful return the workspace as-is.
 */
export function dropTab(
  ws: Workspace,
  srcLeafId: string,
  key: string,
  destLeafId: string,
  side: DropSide,
  index?: number,
): Workspace {
  const srcLeaf = findLeaf(ws.root, srcLeafId);
  const view = srcLeaf?.tabs.find((v) => viewKey(v) === key);
  if (!view) return ws;
  // Edge-splitting a lone tab against its own leaf would do nothing.
  if (srcLeafId === destLeafId && side !== "center" && srcLeaf!.tabs.length <= 1) return ws;

  if (side === "center") {
    if (srcLeafId === destLeafId) {
      if (index == null) return ws; // body-center on its own leaf → nothing to do
      const root = mapLeaf(ws.root, destLeafId, (l) => insertTabAt(l, view, index)); // reorder
      return { ...ws, root, activeLeafId: destLeafId };
    }
    // Cross-leaf: pull from the source, insert into the dest (at `index` on a strip, else append).
    let root = mapLeaf(ws.root, srcLeafId, (l) => removeTab(l, key));
    root = collapseEmpty(
      mapLeaf(root, destLeafId, (l) => (index == null ? insertTab(l, view) : insertTabAt(l, view, index))),
    );
    const ids = new Set(leaves(root).map((l) => l.id));
    const activeLeafId = ids.has(destLeafId) ? destLeafId : leaves(root)[0].id;
    return { ...ws, root, activeLeafId };
  }

  // Edge → split the dest leaf, the dragged tab taking the new pane on that side.
  let root = mapLeaf(ws.root, srcLeafId, (l) => removeTab(l, key));
  const dir: "row" | "col" = side === "left" || side === "right" ? "row" : "col";
  const before = side === "left" || side === "top";
  const newLeaf: Leaf = { kind: "leaf", id: newId(), tabs: [view], activeIndex: 0 };
  root = collapseEmpty(splitNode(root, destLeafId, dir, newLeaf, before));
  const ids = new Set(leaves(root).map((l) => l.id));
  const activeLeafId = ids.has(newLeaf.id) ? newLeaf.id : leaves(root)[0].id;
  return { ...ws, root, activeLeafId };
}
