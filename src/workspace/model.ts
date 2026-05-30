// ── The workspace model ──────────────────────────────────────────────────────
// Pure, serializable types for the Obsidian-grade workspace: everything you can
// look at is a `View`; Views live in a recursive tab/split tree, plus a floating
// layer. No React/Tauri imports here (mirrors src/vault/layout.ts). The model is
// frozen early so splits/floats/persistence are "more of the same", never a redo.

import { nanoid } from "nanoid";

/** Everything that can occupy a tab, a split pane, a float, or the slide-in panel. */
export type View =
  | { type: "board"; id: string } // id distinguishes independent boards ("main" is the home)
  | { type: "people" }
  | { type: "goals" }
  | { type: "search"; query?: string }
  | { type: "settings" }
  | { type: "person"; id: string };

/** A tabbed pane. */
export interface Leaf {
  kind: "leaf";
  id: string;
  tabs: View[];
  activeIndex: number;
}

/** Panes arranged side-by-side (row) or stacked (col). */
export interface Split {
  kind: "split";
  id: string;
  dir: "row" | "col";
  children: Node[];
  sizes: number[]; // fractions in (0,1), sum ~= 1
}

export type Node = Leaf | Split;

/** A free-floating, draggable in-app window holding a View. */
export interface FloatingWindow {
  id: string;
  view: View;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
}

/** How a person's note is shown. `panel` is the slide-in (the signature peek). */
export type NoteMode = "panel" | "float" | "tab";

export interface Workspace {
  root: Node;
  floats: FloatingWindow[];
  activeLeafId: string;
  noteDefault: NoteMode;
}

/** Where openView places a View. */
export type OpenTarget = "panel" | "tab" | "replaceActive" | { split: "row" | "col" } | "float";

export function newId(): string {
  return nanoid(10);
}

/**
 * Identity of a View for dedupe + React keys. Singletons (board/people/goals/
 * search/settings) collapse to their type — at most one app-wide; only distinct
 * persons coexist. Stable across reorder/move so editor drafts survive.
 */
export function viewKey(v: View): string {
  if (v.type === "person") return `person:${v.id}`;
  if (v.type === "board") return `board:${v.id}`;
  return v.type;
}

/** Display label for a tab. Person names come from the caller (the people map). */
export function tabLabel(v: View, nameOf: (id: string) => string | undefined): string {
  switch (v.type) {
    case "board":
      return "Board";
    case "people":
      return "People";
    case "goals":
      return "Goals";
    case "search":
      return "Search";
    case "settings":
      return "Settings";
    case "person":
      return nameOf(v.id) ?? "Person";
  }
}

/** The default workspace: a single leaf with just the board, panel notes. */
export function emptyWorkspace(noteDefault: NoteMode = "panel"): Workspace {
  const leaf: Leaf = { kind: "leaf", id: newId(), tabs: [{ type: "board", id: "main" }], activeIndex: 0 };
  return { root: leaf, floats: [], activeLeafId: leaf.id, noteDefault };
}
