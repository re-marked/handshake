// Defensive (de)serialization of the workspace for `.handshake/workspace.json`. Mirrors
// vault/layout.ts: any malformed shape falls back gracefully rather than throwing. The
// types live in @/workspace/model; this file owns only the disk encoding.

import {
  emptyWorkspace,
  viewKey,
  type FloatingWindow,
  type NoteMode,
  type PaneNode,
  type View,
  type Workspace,
} from "@/workspace/model";

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

function validPane(v: unknown): PaneNode | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  if (o.kind === "pane") {
    const id = str(o.id);
    const view = validView(o.view);
    return id && view ? { kind: "pane", id, view } : undefined;
  }
  if (o.kind === "split") {
    const id = str(o.id);
    const dir = o.dir === "col" ? "col" : "row";
    const children = (Array.isArray(o.children) ? o.children : [])
      .map(validPane)
      .filter((c): c is PaneNode => c !== undefined);
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

function paneViews(node: PaneNode, out: View[] = []): View[] {
  if (node.kind === "pane") out.push(node.view);
  else node.children.forEach((c) => paneViews(c, out));
  return out;
}

function paneIds(node: PaneNode, out: Set<string> = new Set()): Set<string> {
  if (node.kind === "pane") out.add(node.id);
  else node.children.forEach((c) => paneIds(c, out));
  return out;
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

  const layout = validPane(o.layout);
  if (!layout) return emptyWorkspace();

  // tabs ⊇ every shown view, always include the home board, deduped by key.
  const byKey = new Map<string, View>();
  for (const v of Array.isArray(o.tabs) ? o.tabs.map(validView) : []) if (v) byKey.set(viewKey(v), v);
  for (const v of paneViews(layout)) byKey.set(viewKey(v), v);
  if (!byKey.has("board:main")) byKey.set("board:main", { type: "board", id: "main" });

  const ids = paneIds(layout);
  const wantActive = str(o.activePaneId);
  const activePaneId = wantActive && ids.has(wantActive) ? wantActive : [...ids][0];

  const floats = (Array.isArray(o.floats) ? o.floats.map(validFloat) : []).filter(
    (f): f is FloatingWindow => f !== undefined,
  );
  const noteDefault: NoteMode = o.noteDefault === "float" || o.noteDefault === "tab" ? o.noteDefault : "panel";

  return { tabs: [...byKey.values()], layout, activePaneId, floats, noteDefault };
}
