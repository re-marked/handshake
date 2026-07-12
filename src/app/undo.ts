// One chronological undo/redo timeline spanning two kinds of action:
//   • data   – any commit() to the switchboard; we keep the inverse Diff (already computed by
//               applyDiff) to undo, and the forward Diff to redo.
//   • board   – a card repositioning on the board; we keep before/after position maps.
// In-memory + per-network (cleared on vault switch); git snapshots are the durable history.
// Ctrl-Z is gated (see isEditableTarget) so it never steals undo from the note editor / inputs.

import { create } from "zustand";
import { Redo2, Undo2 } from "lucide-react";
import type { Diff } from "@/switchboard";
import { useApp } from "@/app/store";
import { notify } from "@/app/toast";
import { logEvent } from "@/app/debug";

export type Pos = { x: number; y: number };
export type BoardPatch = Record<string, Pos>;

type Entry =
  | { kind: "data"; undo: Diff; redo: Diff }
  | { kind: "board"; boardId: string; before: BoardPatch; after: BoardPatch };

const CAP = 100;
let past: Entry[] = [];
let future: Entry[] = [];

/** Reactive enable flags for UI (menu items / buttons). */
export const useUndoStore = create<{ canUndo: boolean; canRedo: boolean }>(() => ({
  canUndo: false,
  canRedo: false,
}));
function sync() {
  useUndoStore.setState({ canUndo: past.length > 0, canRedo: future.length > 0 });
}

function push(entry: Entry) {
  past.push(entry);
  if (past.length > CAP) past.shift();
  future = []; // a fresh action invalidates the redo branch
  sync();
}

// ── board appliers: mounted BoardViews register how to apply a position patch ──
const boardAppliers = new Map<string, (patch: BoardPatch) => void>();
export function registerBoard(id: string, apply: (patch: BoardPatch) => void) {
  boardAppliers.set(id, apply);
}
export function unregisterBoard(id: string) {
  boardAppliers.delete(id);
}

// ── recording (called from the commit wrapper + BoardView) ──
/** Record a data mutation. `undo` is the inverse Diff, `redo` is the forward Diff. */
export function recordData(undo: Diff, redo: Diff) {
  if (undo.length === 0) return;
  push({ kind: "data", undo, redo });
}

/** Record a board reposition. No-op if nothing actually moved. */
export function recordBoardMove(boardId: string, before: BoardPatch, after: BoardPatch) {
  const moved = Object.keys(after).some((id) => {
    const b = before[id];
    const a = after[id];
    return b && a && (b.x !== a.x || b.y !== a.y);
  });
  if (moved) push({ kind: "board", boardId, before, after });
}

// ── undo / redo ──
export async function undo() {
  const entry = past.pop();
  if (!entry) {
    notify("Nothing to undo", { tone: "muted", key: "undo" });
    return;
  }
  if (entry.kind === "data") await useApp.getState().commit(entry.undo, { record: false });
  else boardAppliers.get(entry.boardId)?.(entry.before);
  future.push(entry);
  sync();
  logEvent("undo", entry.kind);
  notify("Undone", { body: "Reverted your last change.", icon: Undo2, key: "undo" });
}

export async function redo() {
  const entry = future.pop();
  if (!entry) {
    notify("Nothing to redo", { tone: "muted", key: "redo" });
    return;
  }
  if (entry.kind === "data") await useApp.getState().commit(entry.redo, { record: false });
  else boardAppliers.get(entry.boardId)?.(entry.after);
  past.push(entry);
  sync();
  logEvent("redo", entry.kind);
  notify("Redone", { body: "Reapplied the change.", icon: Redo2, key: "redo" });
}

/** Current undo / redo stack depths (for the debug report). */
export function stackDepths(): { undo: number; redo: number } {
  return { undo: past.length, redo: future.length };
}

/** Drop all history (called on vault switch – undo is per-network). */
export function clear() {
  past = [];
  future = [];
  sync();
}

/** True if the event originates in a text-editing surface that owns its own undo. */
export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el?.closest?.("input, textarea, [contenteditable='true'], [contenteditable=''], .cm-editor");
}

// Test-only: inspect/reset the stacks without going through the apply side.
export const __test = {
  state: () => ({ past: [...past], future: [...future] }),
  reset: () => {
    past = [];
    future = [];
    sync();
  },
};
