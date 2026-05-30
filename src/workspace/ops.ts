// ── Pure transforms over the pane tiling ─────────────────────────────────────
// No React/Tauri/store. Every function returns a new tree (immutably).

import { newId, viewKey, type Pane, type PaneNode, type Split, type View, type Workspace } from "./model";

/** All panes in the tiling, left-to-right. */
export function panes(node: PaneNode): Pane[] {
  return node.kind === "pane" ? [node] : node.children.flatMap(panes);
}

export function findPane(node: PaneNode, id: string): Pane | undefined {
  return panes(node).find((p) => p.id === id);
}

/** The pane currently showing the view with the given key (if any). */
export function paneShowing(node: PaneNode, key: string): Pane | undefined {
  return panes(node).find((p) => viewKey(p.view) === key);
}

/** The view of the active pane (what the top bar highlights / "current page"). */
export function activeView(ws: Workspace): View | undefined {
  return (findPane(ws.layout, ws.activePaneId) ?? panes(ws.layout)[0])?.view;
}

/** Swap which view a pane shows. */
export function setPaneView(node: PaneNode, paneId: string, view: View): PaneNode {
  if (node.kind === "pane") return node.id === paneId ? { ...node, view } : node;
  return { ...node, children: node.children.map((c) => setPaneView(c, paneId, view)) };
}

/** Wrap a pane in a new split alongside a new pane (50/50). */
export function splitPane(node: PaneNode, paneId: string, dir: "row" | "col", newPane: Pane): PaneNode {
  if (node.kind === "pane") {
    if (node.id !== paneId) return node;
    return { kind: "split", id: newId(), dir, children: [node, newPane], sizes: [0.5, 0.5] };
  }
  return { ...node, children: node.children.map((c) => splitPane(c, paneId, dir, newPane)) };
}

/** Remove a pane (by id), collapsing single-child splits + renormalizing sizes. */
export function removePane(node: PaneNode, paneId: string): PaneNode {
  if (node.kind === "pane") return node; // a lone root pane can't be removed (caller guards)
  const children = node.children
    .filter((c) => !(c.kind === "pane" && c.id === paneId))
    .map((c) => removePane(c, paneId));
  if (children.length === 1) return children[0];
  return { ...node, children, sizes: normalizeSizes(node.sizes, children.length) };
}

/** Set a split's sizes (fractions). */
export function setSizes(node: PaneNode, splitId: string, sizes: number[]): PaneNode {
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

/** Helper used by store guards. */
export function asSplit(node: PaneNode): Split | undefined {
  return node.kind === "split" ? node : undefined;
}
