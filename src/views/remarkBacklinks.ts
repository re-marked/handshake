import { visit } from "unist-util-visit";
import { backlinkRegex } from "@/switchboard/backlinks";

/** Resolve a `[[ref]]`'s inner text to a person id, or null when it matches nobody. */
export type BacklinkResolver = (text: string) => string | null;

/**
 * remark plugin: turns `[[Person Name]]` into a link. Resolved refs become an `<a>` whose href
 * carries the person id (`#backlink:<id>`), so the existing `a` component navigates instead of
 * opening a URL; unresolved refs render as a muted `<span class="backlink-unresolved">`. Mirrors
 * remarkHighlight; runs AFTER it so a `[[ ]]` inside a `==highlight==` is left alone.
 */
export function remarkBacklinks(resolve: BacklinkResolver) {
  return (tree: unknown) => {
    visit(tree as never, "text", (node: any, index: number | undefined, parent: any) => {
      if (!parent || index == null || typeof node.value !== "string" || !node.value.includes("[[")) return;
      if (parent.type === "highlight" || parent.type === "backlink") return; // don't tokenize inside those

      const value: string = node.value;
      const out: any[] = [];
      let last = 0;
      let m: RegExpExecArray | null;
      const re = backlinkRegex();
      while ((m = re.exec(value))) {
        if (m.index > last) out.push({ type: "text", value: value.slice(last, m.index) });
        const text = m[1].trim();
        const id = resolve(text);
        out.push({
          type: "backlink",
          children: [{ type: "text", value: text }],
          data: {
            hName: id ? "a" : "span",
            hProperties: id
              ? { href: `#backlink:${id}`, className: ["backlink"] }
              : { className: ["backlink-unresolved"] },
          },
        });
        last = m.index + m[0].length;
      }

      if (!out.length) return;
      if (last < value.length) out.push({ type: "text", value: value.slice(last) });
      parent.children.splice(index, 1, ...out);
      return index + out.length;
    });
  };
}
