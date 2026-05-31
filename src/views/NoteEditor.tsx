import { Component, useMemo, useRef, useState, type ReactNode } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import {
  findHighlightAt,
  highlightRegex,
  normalizeHlColor,
  recolorSpan,
  type HlColor,
} from "@/views/remarkHighlight";
import { HighlightPalette } from "@/views/HighlightPalette";

const MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

// "Live-preview"-ish source styling: headings grow, bold/italic read as such, links + code stand
// out, and the markdown markers (#, **, -) dim back. Colors are CSS vars so it tracks every theme.
const mdHighlightStyle = HighlightStyle.define([
  { tag: t.heading1, fontSize: "1.5em", fontWeight: "700", lineHeight: "1.4", color: "var(--color-foreground)" },
  { tag: t.heading2, fontSize: "1.3em", fontWeight: "700", lineHeight: "1.4", color: "var(--color-foreground)" },
  { tag: t.heading3, fontSize: "1.15em", fontWeight: "600", color: "var(--color-foreground)" },
  { tag: [t.heading4, t.heading5, t.heading6], fontWeight: "600", color: "var(--color-foreground)" },
  { tag: t.strong, fontWeight: "700", color: "var(--color-foreground)" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: "var(--color-primary)", textDecoration: "underline" },
  { tag: t.url, color: "var(--color-primary)" },
  { tag: t.monospace, fontFamily: MONO, fontSize: "0.9em", color: "var(--color-foreground)" },
  { tag: t.quote, color: "var(--color-muted-foreground)", fontStyle: "italic" },
  { tag: t.list, color: "var(--color-muted-foreground)" },
  // The literal markdown syntax markers — dim them so the prose leads.
  { tag: [t.processingInstruction, t.meta], color: "var(--color-muted-foreground)", opacity: "0.6" },
]);

/** Decorate `==text==` / `==text=={color}` spans with the same pastel washes used in preview. */
function buildHighlightDecos(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.sliceDoc(from, to);
    const re = highlightRegex();
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const color = normalizeHlColor(m[2]);
      builder.add(from + m.index, from + m.index + m[0].length, Decoration.mark({ class: `cm-hl cm-hl-${color}` }));
    }
  }
  return builder.finish();
}

const highlightDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildHighlightDecos(view);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) this.decorations = buildHighlightDecos(u.view);
    }
  },
  { decorations: (v) => v.decorations },
);

// Borderless, transparent, prose-feeling editor that inherits the note's font / weight / size and
// the rose caret + selection. No per-theme config — everything reads from the app's CSS vars.
const editorTheme = EditorView.theme({
  "&": { backgroundColor: "transparent", color: "inherit", fontSize: "15px", height: "auto" },
  "&.cm-focused": { outline: "none" },
  ".cm-content": {
    padding: "0",
    fontFamily: "var(--app-font)",
    fontWeight: "var(--app-weight)",
    lineHeight: "1.65",
    caretColor: "var(--color-primary)",
    minHeight: "6rem",
  },
  ".cm-line": { padding: "0" },
  // Compact, dim line-number gutter — blends in, doesn't shout "code editor".
  ".cm-gutters": { backgroundColor: "transparent", border: "none", color: "var(--color-muted-foreground)" },
  ".cm-lineNumbers .cm-gutterElement": {
    fontFamily: MONO,
    fontSize: "10.5px",
    minWidth: "1.6em",
    padding: "0 0.55em 0 0",
    opacity: "0.4",
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--color-primary)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "color-mix(in srgb, var(--color-primary) 22%, transparent)",
  },
  ".cm-scroller": { fontFamily: "inherit", lineHeight: "inherit" },
  ".cm-placeholder": { color: "var(--color-muted-foreground)", opacity: "0.55" },
});

// Trim the "code editor" chrome — no gutters / line numbers / active-line — so it reads as prose.
// Keep history (undo/redo), the default keymap, and drawn selection.
const BASIC_SETUP = {
  lineNumbers: true, // compact + dimmed via the gutter styles in editorTheme
  foldGutter: false,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
  highlightSelectionMatches: false,
  bracketMatching: false,
  closeBrackets: false,
  autocompletion: false,
  rectangularSelection: false,
  crosshairCursor: false,
  indentOnInput: false,
  searchKeymap: false,
  syntaxHighlighting: false, // we supply our own markdown HighlightStyle below
  allowMultipleSelections: false,
} as const;

type EditorRecolor = { from: number; to: number; current: HlColor; x: number; y: number };

/** CodeMirror-backed note editor: live markdown highlighting + right-click recolor of highlights. */
function NoteEditor({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const [recolor, setRecolor] = useState<EditorRecolor | null>(null);

  const extensions = useMemo(
    () => [
      markdown({ base: markdownLanguage }),
      syntaxHighlighting(mdHighlightStyle),
      EditorView.lineWrapping,
      highlightDecorations,
      // Right-click a highlight → recolor palette. Off a highlight, return false so the native
      // copy/paste menu still shows (and the app-wide palette skips contenteditable targets).
      EditorView.domEventHandlers({
        contextmenu(event, view) {
          const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
          if (pos == null) return false;
          const hit = findHighlightAt(view.state.doc.toString(), pos);
          if (!hit) return false;
          event.preventDefault();
          const coords = view.coordsAtPos(hit.from);
          setRecolor({
            from: hit.from,
            to: hit.to,
            current: hit.color,
            x: coords?.left ?? event.clientX,
            y: coords?.bottom ?? event.clientY,
          });
          return true;
        },
      }),
    ],
    [],
  );

  function pick(color: HlColor | "remove") {
    const view = cmRef.current?.view;
    if (view && recolor) {
      const span = view.state.sliceDoc(recolor.from, recolor.to);
      // A minimal change on just the token — preserves the cursor and the undo history.
      view.dispatch({ changes: { from: recolor.from, to: recolor.to, insert: recolorSpan(span, color) } });
    }
    setRecolor(null);
  }

  return (
    <>
      <CodeMirror
        ref={cmRef}
        value={value}
        onChange={onChange}
        theme={editorTheme}
        extensions={extensions}
        basicSetup={BASIC_SETUP}
        autoFocus
        placeholder="Notes… (markdown supported — **bold**, - lists, ==highlights==)"
      />
      <HighlightPalette target={recolor} onPick={pick} onClose={() => setRecolor(null)} />
    </>
  );
}

/** Plain-textarea fallback used if the editor ever fails to mount, so notes stay editable. */
function FallbackTextarea({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <textarea
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Notes… (markdown supported)"
      className="min-h-24 w-full min-w-0 resize-none border-0 bg-transparent px-0 text-[15px] leading-relaxed text-foreground/90 outline-none [overflow-wrap:anywhere]"
    />
  );
}

class EditorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("NoteEditor failed; falling back to a plain textarea:", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** The note body editor with a safety net: CodeMirror, falling back to a textarea if it throws. */
export function SafeNoteEditor({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <EditorBoundary fallback={<FallbackTextarea value={value} onChange={onChange} />}>
      <NoteEditor value={value} onChange={onChange} />
    </EditorBoundary>
  );
}
