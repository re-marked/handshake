// ── The workspace model ──────────────────────────────────────────────────────
// Browser-style: ONE top bar of tabs (open pages); below it, a tiling of bare panes
// (no per-pane bars). Each pane shows one view; a subset of the open tabs are shown at a
// time (the rest sit in the bar). Pure + serializable; no React/Tauri imports.

import { nanoid } from "nanoid";

/** Everything that can occupy a tab, a pane, a float, or the slide-in panel. */
export type View =
  | { type: "board"; id: string } // id distinguishes independent boards ("main" is the home)
  | { type: "people" }
  | { type: "goals" }
  | { type: "search"; query?: string }
  | { type: "settings" }
  | { type: "person"; id: string };

/** A tiled pane showing one view (no tab bar of its own). */
export interface Pane {
  kind: "pane";
  id: string;
  view: View;
}

/** Panes arranged side-by-side (row) or stacked (col). */
export interface Split {
  kind: "split";
  id: string;
  dir: "row" | "col";
  children: PaneNode[];
  sizes: number[]; // fractions in (0,1), sum ~= 1
}

export type PaneNode = Pane | Split;

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
  /** Every open page — the single top bar. */
  tabs: View[];
  /** The tiling shown below the bar; each Pane shows a view (a subset of `tabs`). */
  layout: PaneNode;
  /** The focused pane (where a clicked tab swaps in). */
  activePaneId: string;
  floats: FloatingWindow[];
  noteDefault: NoteMode;
}

/** Where openView places a View. */
export type OpenTarget = "panel" | "tab" | { split: "row" | "col" } | "float";

export function newId(): string {
  return nanoid(10);
}

/**
 * Identity of a View for dedupe + React keys. Singletons (people/goals/search/settings)
 * collapse to their type; only distinct persons + boards coexist.
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

/** The default workspace: a single board tab shown in one pane, panel notes. */
export function emptyWorkspace(noteDefault: NoteMode = "panel"): Workspace {
  const view: View = { type: "board", id: "main" };
  const pane: Pane = { kind: "pane", id: newId(), view };
  return { tabs: [view], layout: pane, activePaneId: pane.id, floats: [], noteDefault };
}
