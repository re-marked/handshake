import { describe, it, expect } from "vitest";
import {
  findHighlightAt,
  normalizeHlColor,
  recolorSpan,
  remarkHighlight,
  rewriteHighlight,
} from "./remarkHighlight";

/** Run the plugin over a single-paragraph mdast text node and return the produced children. */
function transform(text: string) {
  const node: any = {
    type: "text",
    value: text,
    position: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: text.length + 1, offset: text.length } },
  };
  const parent: any = { type: "paragraph", children: [node] };
  const tree: any = { type: "root", children: [parent] };
  remarkHighlight()(tree);
  return parent.children;
}

describe("normalizeHlColor", () => {
  it("keeps palette colors and falls back to yellow (the default)", () => {
    expect(normalizeHlColor("green")).toBe("green");
    expect(normalizeHlColor("purple")).toBe("purple");
    expect(normalizeHlColor("chartreuse")).toBe("yellow");
    expect(normalizeHlColor(undefined)).toBe("yellow");
  });
});

describe("remarkHighlight parsing", () => {
  it("turns ==text== into a default (yellow) mark element", () => {
    const kids = transform("a ==hi== b");
    expect(kids).toHaveLength(3);
    expect(kids[0]).toMatchObject({ type: "text", value: "a " });
    expect(kids[1].data.hName).toBe("mark");
    expect(kids[1].data.hProperties.className).toEqual(["hl", "hl-yellow"]);
    expect(kids[1].children[0].value).toBe("hi");
    expect(kids[2]).toMatchObject({ type: "text", value: " b" });
  });

  it("parses a {color} suffix", () => {
    const kids = transform("==note=={green}");
    expect(kids[0].data.hProperties.className).toEqual(["hl", "hl-green"]);
    expect(kids[0].data.hProperties["data-hl"]).toBe("green");
  });

  it("gives each highlight a source position covering the full ==...== span", () => {
    const src = "x ==hey=={blue} y";
    const kids = transform(src);
    const mark = kids.find((k: any) => k.type === "highlight");
    const { offset: s } = mark.position.start;
    const { offset: e } = mark.position.end;
    // The recorded span must be exactly the highlight token, so recolor can splice it.
    expect(src.slice(s, e)).toBe("==hey=={blue}");
  });

  it("handles two highlights in one line with correct, non-overlapping offsets", () => {
    const src = "==one== and ==two=={pink}";
    const kids = transform(src);
    const marks = kids.filter((k: any) => k.type === "highlight");
    expect(marks).toHaveLength(2);
    expect(src.slice(marks[0].position.start.offset, marks[0].position.end.offset)).toBe("==one==");
    expect(src.slice(marks[1].position.start.offset, marks[1].position.end.offset)).toBe("==two=={pink}");
  });

  it("leaves plain text untouched", () => {
    const kids = transform("just words, no marks");
    expect(kids).toHaveLength(1);
    expect(kids[0].type).toBe("text");
  });
});

describe("rewriteHighlight", () => {
  const src = "x ==hey=={blue} y";
  // span [2,15) == "==hey=={blue}"
  const start = src.indexOf("==");
  const end = start + "==hey=={blue}".length;

  it("recolors to another palette color", () => {
    expect(rewriteHighlight(src, start, end, "green")).toBe("x ==hey=={green} y");
  });

  it("yellow (the default) drops the {color} suffix", () => {
    expect(rewriteHighlight(src, start, end, "yellow")).toBe("x ==hey== y");
  });

  it("remove unwraps to plain text", () => {
    expect(rewriteHighlight(src, start, end, "remove")).toBe("x hey y");
  });

  it("adds a suffix to a previously-default highlight", () => {
    const d = "a ==plain== b";
    const s = d.indexOf("==");
    const e = s + "==plain==".length;
    expect(rewriteHighlight(d, s, e, "purple")).toBe("a ==plain=={purple} b");
  });
});

describe("recolorSpan", () => {
  it("rewrites a single token without touching surrounding text", () => {
    expect(recolorSpan("==hi=={blue}", "green")).toBe("==hi=={green}");
    expect(recolorSpan("==hi=={blue}", "yellow")).toBe("==hi==");
    expect(recolorSpan("==hi==", "pink")).toBe("==hi=={pink}");
    expect(recolorSpan("==hi=={blue}", "remove")).toBe("hi");
  });
});

describe("findHighlightAt", () => {
  const src = "x ==hey=={blue} and ==yo== z";
  const a = src.indexOf("==hey");
  const aEnd = a + "==hey=={blue}".length;
  const b = src.indexOf("==yo");
  const bEnd = b + "==yo==".length;

  it("returns the token + color at a position inside it", () => {
    expect(findHighlightAt(src, a + 3)).toEqual({ from: a, to: aEnd, color: "blue" });
    expect(findHighlightAt(src, b + 2)).toEqual({ from: b, to: bEnd, color: "yellow" });
  });

  it("returns null outside any highlight", () => {
    expect(findHighlightAt(src, 0)).toBeNull(); // the leading "x "
    expect(findHighlightAt(src, src.length - 1)).toBeNull(); // the trailing " z"
  });

  it("is robust to being called repeatedly (fresh regex, no lastIndex carryover)", () => {
    expect(findHighlightAt(src, a + 1)).not.toBeNull();
    expect(findHighlightAt(src, a + 1)).not.toBeNull();
  });
});
