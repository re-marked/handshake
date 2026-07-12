// Defensive (de)serialization of the workspace for `.handshake/workspace.json`. Mirrors
// vault/layout.ts: any malformed shape falls back gracefully rather than throwing. The
// types live in @/workspace/model; this file owns only the disk encoding.

import { emptyWorkspace, type FloatingWindow, type Node, type View, type Workspace } from "@/workspace/model";
import { findView, leaves, mapLeaf } from "@/workspace/ops";

export function serializeWorkspace(ws: Workspace): string {
  return JSON.stringify(ws, null, 2);
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function validView(v: unknown): View | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  switch (o.type) {
    case "board": {
      const id = str(o.id);
      return id ? { type: "board", id } : undefined;
    }
    case "people":
      return { type: "people" };
    case "goals":
      return { type: "goals" };
    case "settings":
      return { type: "settings" };
    case "search":
      return { type: "search", query: str(o.query) };
    case "person": {
      const id = str(o.id);
      return id ? { type: "person", id } : undefined;
    }
    default:
      return undefined;
  }
}

function normalizeSizes(raw: unknown, n: number): number[] {
  const arr = Array.isArray(raw) ? raw.map(num).filter((x): x is number => x !== undefined) : [];
  if (arr.length === n) {
    const sum = arr.reduce((a, b) => a + b, 0);
    if (sum > 0) return arr.map((x) => x / sum);
  }
  return Array.from({ length: n }, () => 1 / n);
}

function validNode(v: unknown): Node | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  if (o.kind === "leaf") {
    const id = str(o.id);
    const tabs = (Array.isArray(o.tabs) ? o.tabs.map(validView) : []).filter(
      (t): t is View => t !== undefined,
    );
    if (!id || tabs.length === 0) return undefined; // drop empty/idless leaves
    const ai = num(o.activeIndex);
    const activeIndex = ai !== undefined ? Math.min(Math.max(0, Math.floor(ai)), tabs.length - 1) : 0;
    return { kind: "leaf", id, tabs, activeIndex };
  }
  if (o.kind === "split") {
    const id = str(o.id);
    const dir = o.dir === "col" ? "col" : "row";
    const children = (Array.isArray(o.children) ? o.children : [])
      .map(validNode)
      .filter((c): c is Node => c !== undefined);
    if (!id || children.length === 0) return undefined;
    if (children.length === 1) return children[0]; // collapse a 1-child split
    return { kind: "split", id, dir, children, sizes: normalizeSizes(o.sizes, children.length) };
  }
  return undefined;
}

function validFloat(v: unknown): FloatingWindow | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const id = str(o.id);
  const view = validView(o.view);
  const x = num(o.x);
  const y = num(o.y);
  const w = num(o.w);
  const h = num(o.h);
  if (!id || !view || x === undefined || y === undefined || w === undefined || h === undefined) {
    return undefined;
  }
  return { id, view, x, y, w, h, z: num(o.z) ?? 0 };
}

export function parseWorkspace(json: string): Workspace {
  if (!json.trim()) return emptyWorkspace();
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return emptyWorkspace();
  }
  if (!data || typeof data !== "object") return emptyWorkspace();
  const o = data as Record<string, unknown>;

  // The root tree. (Pre-rework files used a {tabs,layout,activePaneId} shape with no `root`;
  // they fail validation here and fall back to a fresh workspace – a one-time reset.)
  let root = validNode(o.root);
  if (!root) return emptyWorkspace();

  // Always keep the home board reachable – inject it into the first leaf if it went missing.
  if (!findView(root, "board:main")) {
    const firstLeafId = leaves(root)[0].id;
    root = mapLeaf(root, firstLeafId, (l) => ({ ...l, tabs: [{ type: "board", id: "main" }, ...l.tabs] }));
  }

  const ids = new Set(leaves(root).map((l) => l.id));
  const wantActive = str(o.activeLeafId);
  const activeLeafId = wantActive && ids.has(wantActive) ? wantActive : leaves(root)[0].id;

  const floats = (Array.isArray(o.floats) ? o.floats.map(validFloat) : []).filter(
    (f): f is FloatingWindow => f !== undefined,
  );
  return { root, floats, activeLeafId };
}
