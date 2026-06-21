import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { remarkHighlight, remarkKeywords } from "@/views/remarkHighlight";
import { remarkBacklinks } from "@/views/remarkBacklinks";

// Renders markdown through the SAME plugin pipeline MarkdownView uses. Parametrized plugins MUST be
// passed as [plugin, options] tuples; pre-calling them (remarkBacklinks(...)) passes a transformer
// where unified expects an attacher, so unified runs it with no tree → visit(undefined) crash. This
// caught the 0.9.0 note-render regression; keep it as the render-path smoke test.
function render(source: string, resolve: (t: string) => string | null = () => null, keywords: { text: string; color: "yellow" }[] = []) {
  return renderToStaticMarkup(
    <Markdown remarkPlugins={[remarkGfm, remarkHighlight, [remarkBacklinks, resolve], [remarkKeywords, keywords]]}>
      {source}
    </Markdown>,
  );
}

describe("markdown plugin wiring (render path)", () => {
  it("renders a plain note without throwing (the freeze-time bug)", () => {
    expect(() => render("Just a plain note, no links.")).not.toThrow();
  });

  it("renders a resolved [[backlink]] as an in-app anchor", () => {
    const html = render("Met [[Elena Hart]] today.", (t) => (t === "Elena Hart" ? "elena-hart" : null));
    expect(html).toContain("#backlink:elena-hart");
    expect(html).toContain("backlink");
  });

  it("renders an unresolved [[backlink]] as a muted span", () => {
    const html = render("Met [[Nobody At All]] today.");
    expect(html).toContain("backlink-unresolved");
    expect(html).not.toContain("#backlink:");
  });

  it("co-renders highlights, backlinks and keywords together", () => {
    const html = render(
      "Building ==Cadence== with [[Elena Hart]]. ping soon.",
      (t) => (t === "Elena Hart" ? "elena-hart" : null),
      [{ text: "ping", color: "yellow" }],
    );
    expect(html).toContain("hl-yellow"); // highlight + keyword styling
    expect(html).toContain("#backlink:elena-hart");
  });
});
