import { visit } from "unist-util-visit";

/** The curated highlight palette. Yellow is the implicit default (plain `==x==`, no suffix). */
export const HL_COLORS = ["yellow", "green", "blue", "pink", "purple"] as const;
export type HlColor = (typeof HL_COLORS)[number];

const PALETTE = new Set<string>(HL_COLORS);

// ==text== (default) or ==text=={green} (colored). Non-greedy, single-line; the optional {color}
// must sit flush against the closing ==. Unknown color names fall back to the default style.
// A factory (not a shared const) so each scanner gets its own lastIndex — no cross-call races.
export const highlightRegex = (): RegExp => /==(?!=)([^\n]+?)==(?:\{([a-z]+)\})?/g;

/** Resolve a raw `{color}` capture to a palette color (yellow — the default — when absent/unknown). */
export function normalizeHlColor(raw: string | undefined): HlColor {
  return raw && PALETTE.has(raw) ? (raw as HlColor) : "yellow";
}

/** Rewrite a single highlight token (e.g. `==hi=={blue}`) to a new color, or unwrap it ("remove"). */
export function recolorSpan(span: string, color: HlColor | "remove"): string {
  const m = span.match(/^==([\s\S]*?)==(?:\{[a-z]+\})?$/);
  const inner = m ? m[1] : span.replace(/^==/, "").replace(/==(?:\{[a-z]+\})?$/, "");
  // Yellow is the default form (no suffix); other colors get an explicit {color}; remove unwraps.
  return color === "remove" ? inner : color === "yellow" ? `==${inner}==` : `==${inner}=={${color}}`;
}

/**
 * Rewrite one highlight span `[start,end)` of `source` to a new color (or unwrap it with "remove").
 * The inner text is preserved. Used by the rendered preview (offsets come from mdast positions).
 */
export function rewriteHighlight(
  source: string,
  start: number,
  end: number,
  color: HlColor | "remove",
): string {
  return source.slice(0, start) + recolorSpan(source.slice(start, end), color) + source.slice(end);
}

/**
 * Find the highlight token containing position `pos` in `text`, if any. Used by the editor's
 * right-click recolor (CodeMirror gives a document position; we map it back to a token range).
 */
export function findHighlightAt(text: string, pos: number): { from: number; to: number; color: HlColor } | null {
  const re = highlightRegex();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const from = m.index;
    const to = m.index + m[0].length;
    if (pos >= from && pos <= to) return { from, to, color: normalizeHlColor(m[2]) };
  }
  return null;
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
      const re = highlightRegex();
      while ((m = re.exec(value))) {
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
