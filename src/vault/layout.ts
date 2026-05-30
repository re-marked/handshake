// The board layout sidecar (.handshake/layout.json): volatile UI state kept out of the
// markdown files. App-owned; parsed defensively so a corrupt/old file never crashes load.

export interface LayoutPos {
  x: number;
  y: number;
}

export interface Layout {
  /** person id -> board position */
  positions: Record<string, LayoutPos>;
  /** pan + zoom of the board */
  viewport?: { pan: LayoutPos; zoom: number };
  /** person id -> manual parent override (reserved for the re-parent gesture) */
  parentOverrides?: Record<string, string>;
}

export function emptyLayout(): Layout {
  return { positions: {} };
}

export function serializeLayout(layout: Layout): string {
  return JSON.stringify(layout, null, 2);
}

export function parseLayout(json: string): Layout {
  if (!json.trim()) return emptyLayout();
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return emptyLayout();
  }
  if (!data || typeof data !== "object") return emptyLayout();
  const obj = data as Record<string, unknown>;
  return {
    positions: validPositions(obj.positions),
    viewport: validViewport(obj.viewport),
    parentOverrides: validOverrides(obj.parentOverrides),
  };
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function pos(v: unknown): LayoutPos | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const x = num(o.x);
  const y = num(o.y);
  return x !== undefined && y !== undefined ? { x, y } : undefined;
}

function validPositions(v: unknown): Record<string, LayoutPos> {
  const out: Record<string, LayoutPos> = {};
  if (v && typeof v === "object") {
    for (const [id, p] of Object.entries(v as Record<string, unknown>)) {
      const parsed = pos(p);
      if (parsed) out[id] = parsed;
    }
  }
  return out;
}

function validViewport(v: unknown): { pan: LayoutPos; zoom: number } | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const pan = pos(o.pan);
  const zoom = num(o.zoom);
  return pan && zoom !== undefined ? { pan, zoom } : undefined;
}

function validOverrides(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (v && typeof v === "object") {
    for (const [id, parent] of Object.entries(v as Record<string, unknown>)) {
      if (typeof parent === "string") out[id] = parent;
    }
  }
  return out;
}
