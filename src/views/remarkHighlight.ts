import { visit } from "unist-util-visit";

/** The curated highlight palette. Yellow is the implicit default (plain `==x==`, no suffix). */
export const HL_COLORS = ["yellow", "green", "blue", "pink", "purple"] as const;
export type HlColor = (typeof HL_COLORS)[number];

const PALETTE = new Set<string>(HL_COLORS);

// ==text== (default) or ==text=={green} (colored). Non-greedy, single-line; the optional {color}
// must sit flush against the closing ==. Unknown color names fall back to the default style.
const HIGHLIGHT = /==(?!=)([^\n]+?)==(?:\{([a-z]+)\})?/g;

/** Resolve a raw `{color}` capture to a palette color (yellow — the default — when absent/unknown). */
export function normalizeHlColor(raw: string | undefined): HlColor {
  return raw && PALETTE.has(raw) ? (raw as HlColor) : "yellow";
}

/**
 * Rewrite one highlight span `[start,end)` of `source` to a new color (or unwrap it with "remove").
 * `default` drops the `{color}` suffix; a named color adds/replaces it. The inner text is preserved.
 */
export function rewriteHighlight(
  source: string,
  start: number,
  end: number,
  color: HlColor | "remove",
): string {
  const span = source.slice(start, end);
  const m = span.match(/^==([\s\S]*?)==(?:\{[a-z]+\})?$/);
  const inner = m ? m[1] : span.replace(/^==/, "").replace(/==(?:\{[a-z]+\})?$/, "");
  // Yellow is the default form (no suffix); other colors get an explicit {color}; remove unwraps.
  const next = color === "remove" ? inner : color === "yellow" ? `==${inner}==` : `==${inner}=={${color}}`;
  return source.slice(0, start) + next + source.slice(end);
}

/**
 * remark plugin: turns `==text==` / `==text=={color}` into a `<mark class="hl hl-<color>">` element.
 * Every highlight node is given a source `position` (start/end offsets into the original markdown)
 * so the renderer can map a clicked highlight back to its exact span and rewrite the color in place.
 */
export function remarkHighlight() {
  return (tree: unknown) => {
    visit(tree as never, "text", (node: any, index: number | undefined, parent: any) => {
      if (!parent || index == null || typeof node.value !== "string" || !node.value.includes("==")) return;

      const value: string = node.value;
      const base = node.position?.start?.offset ?? 0;
      const line = node.position?.start?.line ?? 1;
      const col = node.position?.start?.column ?? 1;

      const out: any[] = [];
      let last = 0;
      let m: RegExpExecArray | null;
      HIGHLIGHT.lastIndex = 0;
      while ((m = HIGHLIGHT.exec(value))) {
        if (m.index > last) out.push({ type: "text", value: value.slice(last, m.index) });
        const color = normalizeHlColor(m[2]);
        const start = base + m.index;
        const end = start + m[0].length;
        out.push({
          type: "highlight",
          children: [{ type: "text", value: m[1] }],
          data: {
            hName: "mark",
            hProperties: { className: ["hl", `hl-${color}`], "data-hl": color },
          },
          position: {
            start: { line, column: col + m.index, offset: start },
            end: { line, column: col + (end - base), offset: end },
          },
        });
        last = m.index + m[0].length;
      }

      if (!out.length) return;
      if (last < value.length) out.push({ type: "text", value: value.slice(last) });
      parent.children.splice(index, 1, ...out);
      return index + out.length; // continue past the freshly inserted nodes
    });
  };
}
