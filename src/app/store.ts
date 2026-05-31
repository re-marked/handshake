import { create } from "zustand";
import { createTauriIO } from "@/vault/tauriIo";
import { VaultSession } from "@/vault/session";
import { emptyLayout, type Layout } from "@/vault/layout";
import { emptySwitchboard, type ApplyResult, type Diff, type Switchboard } from "@/switchboard";
import {
  emptyWorkspace,
  newId,
  viewKey,
  type FloatingWindow,
  type Leaf,
  type NoteMode,
  type OpenTarget,
  type Split,
  type View,
  type Workspace,
} from "@/workspace/model";
import {
  collapseEmpty,
  detachView,
  dropTab as applyDropTab,
  findLeaf,
  findView,
  insertTab,
  leaves,
  mapLeaf,
  removeTab,
  setSizes,
  splitNode,
  type DropSide,
} from "@/workspace/ops";

type Status = "idle" | "loading" | "ready" | "error";

function readDensity(): "compact" | "comfortable" | "spacious" {
  try {
    const v = localStorage.getItem("handshake.density");
    if (v === "compact" || v === "comfortable" || v === "spacious") return v;
  } catch {
    /* ignore */
  }
  return "comfortable";
}

/**
 * The app store — the backbone the whole shell reads from. Holds the live vault state +
 * the open person note, and routes writes through the one VaultSession. (The generic
 * workspace — tabs/splits/Views — lands in later layers; see SHELL.md.)
 */
interface AppState {
  status: Status;
  error: string | null;
  session: VaultSession | null;
  switchboard: Switchboard;
  photos: Map<string, string>;
  layout: Layout;
  /** The person whose note slides in (top-right), or null when closed. */
  openPersonId: string | null;
  /** A person mid-deletion — the board plays its exit before the data is removed. */
  deletingId: string | null;
  /** Whether the command palette (Ctrl-P) is open. */
  commandOpen: boolean;
  /** The workspace: the Leaf/Split tree + floats + note default + layout skin (tabs ⇄ simple). */
  workspace: Workspace;
  /** Row density for list views (People). Persisted to localStorage. */
  density: "compact" | "comfortable" | "spacious";
  /** A request to center the board on a person (from the People view); nonce retriggers. */
  locate: { id: string; nonce: number } | null;
  /** The tab currently being dragged (source leaf + view key), or null. Transient; not saved. */
  tabDrag: { srcLeafId: string; key: string } | null;

  init: (vault: string) => Promise<void>;
  /** Route a diff through the funnel, persist it, and swap in the new state. The board
   *  updates in place — no reload — because applyDiff hands back the derived next state. */
  commit: (diff: Diff) => Promise<ApplyResult>;
  saveLayout: (layout: Layout) => void;
  /** Reveal a person in the remembered note mode — or focus them if already shown
   *  somewhere. `toggle` lets the board's tap-again close the slide-in panel. */
  revealPerson: (id: string, opts?: { toggle?: boolean }) => void;
  /** Open a person in the slide-in panel (primitive; callers usually want revealPerson). */
  openPerson: (id: string) => void;
  closePerson: () => void;
  /** Delete a person and all their ties; animates the card out, then commits. */
  deletePerson: (id: string) => Promise<void>;
  /** Open/close the command palette. */
  setCommandOpen: (open: boolean) => void;
  /** Open a View into a target (tab / panel / split / float). */
  openView: (view: View, target?: OpenTarget) => void;
  /** Make a leaf the active one (the focused pane). */
  setActiveLeaf: (leafId: string) => void;
  /** Make a tab active within its leaf (and focus that leaf). */
  setActiveTab: (leafId: string, key: string) => void;
  /** Close a tab in a leaf; collapses an emptied leaf (board:main is un-closable). */
  closeTab: (leafId: string, key: string) => void;
  /** Split a leaf (row/col), opening a view in the new pane. */
  splitLeaf: (leafId: string, dir: "row" | "col", view: View) => void;
  /** Begin dragging a tab (drag-and-drop between panes). */
  beginTabDrag: (srcLeafId: string, key: string) => void;
  /** End a tab drag (drop finished or cancelled). */
  endTabDrag: () => void;
  /** Drop the dragged tab onto a leaf — `center` moves it in; an edge splits there. */
  dropTab: (destLeafId: string, side: DropSide) => void;
  /** Focus (or open) the home board in the active leaf. */
  focusBoard: () => void;
  /** Update a split's pane sizes (fractions). */
  resizeSplit: (splitId: string, sizes: number[]) => void;
  /** Pop a view out into a floating window — or focus it if it's already floating. */
  addFloat: (view: View) => void;
  /** Close a floating window. */
  closeFloat: (id: string) => void;
  /** Move a floating window (absolute coords within the board area). */
  moveFloat: (id: string, x: number, y: number) => void;
  /** Resize a floating window. */
  resizeFloat: (id: string, w: number, h: number) => void;
  /** Raise a floating window above the others. */
  focusFloat: (id: string) => void;
  /** Move a person's note between modes (panel ⇄ float ⇄ tab) — a move, not a copy. */
  setNoteMode: (id: string, mode: NoteMode) => void;
  /** Remember which mode new notes open in (persisted in the workspace). */
  setNoteDefault: (mode: NoteMode) => void;
  /** Quick layout: this note on the left, the board on the right (a one-tap sane split). */
  splitNoteWithBoard: (id: string) => void;
  /** Reset the workspace to a single board tab (recovery from a bad layout). */
  resetWorkspace: () => void;
  /** Set the list-view row density (persists to localStorage). */
  setDensity: (density: "compact" | "comfortable" | "spacious") => void;
  /** Switch to the board and center it on a person (+ a brief highlight). */
  locatePerson: (id: string) => void;
}

export const useApp = create<AppState>()((set, get) => ({
  status: "idle",
  error: null,
  session: null,
  switchboard: emptySwitchboard(),
  photos: new Map(),
  layout: emptyLayout(),
  openPersonId: null,
  deletingId: null,
  commandOpen: false,
  workspace: emptyWorkspace(),
  density: readDensity(),
  locate: null,
  tabDrag: null,

  async init(vault) {
    if (get().status !== "idle") return; // guard against StrictMode double-invoke
    set({ status: "loading" });
    const session = new VaultSession(createTauriIO(vault));
    set({ session });
    try {
      const [switchboard, layout, workspace] = await Promise.all([
        session.load(),
        session.loadLayout(),
        session.loadWorkspace(),
      ]);
      set({ switchboard, layout, workspace, status: "ready" });

      const resolved = await Promise.all(
        [...switchboard.people.values()]
          .filter((p) => p.photo)
          .map(async (p) => {
            try {
              return [p.id, await session.readAttachment(p.photo!)] as const;
            } catch {
              return null;
            }
          }),
      );
      set({ photos: new Map(resolved.filter((e): e is readonly [string, string] => e !== null)) });
    } catch (e) {
      set({ status: "error", error: String(e) });
    }
  },

  async commit(diff) {
    const session = get().session;
    if (!session) throw new Error("commit before vault init");
    const result = await session.commit(diff);
    if (result.ok) set({ switchboard: result.next });
    return result;
  },

  // Persist only — don't store the live layout back into state (would re-seed mid-drag).
  saveLayout(layout) {
    void get().session?.saveLayout(layout).catch(() => {});
  },

  revealPerson(id, opts) {
    const s = get();
    const key = `person:${id}`;
    const floating = s.workspace.floats.find((f) => viewKey(f.view) === key);
    if (floating) {
      get().focusFloat(floating.id); // already floating → raise it
      return;
    }
    const hit = findView(s.workspace.root, key);
    if (hit) {
      get().setActiveTab(hit.leaf.id, key); // already a docked tab → focus it
      return;
    }
    if (s.openPersonId === id) {
      if (opts?.toggle) get().closePerson(); // panel: tap the same card again to close
      return;
    }
    const mode = s.workspace.noteDefault; // not shown anywhere → open in the remembered mode
    if (mode === "panel") get().openPerson(id);
    else get().openView({ type: "person", id }, mode);
  },

  openPerson(id) {
    set({ openPersonId: id });
  },

  closePerson() {
    set({ openPersonId: null });
  },

  async deletePerson(id) {
    const { switchboard, commit } = get();
    if (switchboard.people.get(id)?.isSelf) return; // never delete self
    const ties = [...switchboard.handshakes.values()]
      .filter((h) => h.people.includes(id))
      .map((h) => h.id);
    // detachView drops the docked tab (collapsing an emptied leaf) + any float and repairs the
    // active leaf; clear the slide-in panel too (it lives outside the workspace).
    set((s) => ({
      deletingId: id,
      openPersonId: s.openPersonId === id ? null : s.openPersonId,
      workspace: detachView(s.workspace, `person:${id}`),
    }));
    await new Promise((r) => setTimeout(r, 190)); // let the card spring out first
    const diff: Diff = [
      ...ties.map((hid) => ({ op: "deleteHandshake", id: hid }) as const),
      { op: "deletePerson", id } as const,
    ];
    await commit(diff);
    set({ deletingId: null });
  },

  setCommandOpen(open) {
    set({ commandOpen: open });
  },

  openView(view, target = "tab") {
    if (target === "panel") {
      if (view.type === "person") set({ openPersonId: view.id });
      return;
    }
    if (target === "float") {
      get().addFloat(view);
      return;
    }
    if (typeof target === "object") {
      get().splitLeaf(get().workspace.activeLeafId, target.split, view);
      return;
    }
    // "tab": dedupe-then-focus across the whole tree, else insert into the active leaf.
    const ws = get().workspace;
    const hit = findView(ws.root, viewKey(view));
    if (hit) {
      get().setActiveTab(hit.leaf.id, viewKey(view));
      return;
    }
    const leafId = findLeaf(ws.root, ws.activeLeafId) ? ws.activeLeafId : leaves(ws.root)[0].id;
    set({
      workspace: { ...ws, root: mapLeaf(ws.root, leafId, (l) => insertTab(l, view)), activeLeafId: leafId },
    });
  },

  setActiveLeaf(leafId) {
    set((s) => ({ workspace: { ...s.workspace, activeLeafId: leafId } }));
  },

  setActiveTab(leafId, key) {
    set((s) => {
      const root = mapLeaf(s.workspace.root, leafId, (l) => {
        const i = l.tabs.findIndex((v) => viewKey(v) === key);
        return i >= 0 ? { ...l, activeIndex: i } : l;
      });
      return { workspace: { ...s.workspace, root, activeLeafId: leafId } };
    });
  },

  closeTab(leafId, key) {
    set((s) => {
      // Any tab is closable, including the board. Closing the last tab leaves an empty leaf
      // (the "no tabs open" state); collapseEmpty unwraps emptied panes within a split.
      const root = collapseEmpty(mapLeaf(s.workspace.root, leafId, (l) => removeTab(l, key)));
      const ids = new Set(leaves(root).map((l) => l.id));
      const activeLeafId = ids.has(s.workspace.activeLeafId) ? s.workspace.activeLeafId : leaves(root)[0].id;
      return { workspace: { ...s.workspace, root, activeLeafId } };
    });
  },

  splitLeaf(leafId, dir, view) {
    const ws = get().workspace;
    if (!findLeaf(ws.root, leafId)) return;
    const newLeaf: Leaf = { kind: "leaf", id: newId(), tabs: [view], activeIndex: 0 };
    set({ workspace: { ...ws, root: splitNode(ws.root, leafId, dir, newLeaf), activeLeafId: newLeaf.id } });
  },

  beginTabDrag(srcLeafId, key) {
    set({ tabDrag: { srcLeafId, key } });
  },

  endTabDrag() {
    if (get().tabDrag) set({ tabDrag: null });
  },

  dropTab(destLeafId, side) {
    const d = get().tabDrag;
    if (!d) return;
    set((s) => ({ workspace: applyDropTab(s.workspace, d.srcLeafId, d.key, destLeafId, side), tabDrag: null }));
  },

  focusBoard() {
    get().openView({ type: "board", id: "main" }, "tab");
  },

  resizeSplit(splitId, sizes) {
    set((s) => ({ workspace: { ...s.workspace, root: setSizes(s.workspace.root, splitId, sizes) } }));
  },

  addFloat(view) {
    const ws = get().workspace;
    const key = viewKey(view);
    const existing = ws.floats.find((f) => viewKey(f.view) === key);
    if (existing) {
      get().focusFloat(existing.id); // already floating → raise it instead of duplicating
      return;
    }
    const maxZ = ws.floats.reduce((m, f) => Math.max(m, f.z), 0);
    const n = ws.floats.length % 6; // cascade so stacked floats don't hide each other
    const person = view.type === "person";
    const float: FloatingWindow = {
      id: newId(),
      view,
      x: 96 + n * 28,
      y: 64 + n * 28,
      w: person ? 340 : 600,
      h: 460,
      z: maxZ + 1,
    };
    set({ workspace: { ...ws, floats: [...ws.floats, float] } });
  },

  closeFloat(id) {
    set((s) => ({ workspace: { ...s.workspace, floats: s.workspace.floats.filter((f) => f.id !== id) } }));
  },

  moveFloat(id, x, y) {
    set((s) => ({
      workspace: { ...s.workspace, floats: s.workspace.floats.map((f) => (f.id === id ? { ...f, x, y } : f)) },
    }));
  },

  resizeFloat(id, w, h) {
    set((s) => ({
      workspace: { ...s.workspace, floats: s.workspace.floats.map((f) => (f.id === id ? { ...f, w, h } : f)) },
    }));
  },

  focusFloat(id) {
    set((s) => {
      const maxZ = s.workspace.floats.reduce((m, f) => Math.max(m, f.z), 0);
      const cur = s.workspace.floats.find((f) => f.id === id);
      if (!cur || cur.z === maxZ) return {}; // missing or already on top → no-op
      return {
        workspace: {
          ...s.workspace,
          floats: s.workspace.floats.map((f) => (f.id === id ? { ...f, z: maxZ + 1 } : f)),
        },
      };
    });
  },

  setNoteMode(id, mode) {
    const view: View = { type: "person", id };
    // Detach from every container first — a person lives in exactly one place.
    set((s) => ({
      openPersonId: s.openPersonId === id ? null : s.openPersonId,
      workspace: detachView(s.workspace, `person:${id}`),
    }));
    // Re-attach in the target mode.
    if (mode === "panel") set({ openPersonId: id });
    else if (mode === "float") get().addFloat(view);
    else get().openView(view, "tab");
  },

  setNoteDefault(mode) {
    set((s) => ({ workspace: { ...s.workspace, noteDefault: mode } }));
  },

  splitNoteWithBoard(id) {
    const note: View = { type: "person", id };
    const board: View = { type: "board", id: "main" };
    const left: Leaf = { kind: "leaf", id: newId(), tabs: [note], activeIndex: 0 };
    const right: Leaf = { kind: "leaf", id: newId(), tabs: [board], activeIndex: 0 };
    const root: Split = { kind: "split", id: newId(), dir: "row", children: [left, right], sizes: [0.42, 0.58] };
    // A "snap to this layout" action: it replaces the tiling with note | board (other open
    // views are dropped — there's no global bar to keep them). The note moves into the left
    // pane, so detach it from the panel/floats.
    set((s) => ({
      openPersonId: s.openPersonId === id ? null : s.openPersonId,
      workspace: {
        ...s.workspace,
        root,
        activeLeafId: left.id,
        floats: s.workspace.floats.filter((f) => viewKey(f.view) !== `person:${id}`),
      },
    }));
  },

  resetWorkspace() {
    set({ workspace: emptyWorkspace() });
  },

  setDensity(density) {
    try {
      localStorage.setItem("handshake.density", density);
    } catch {
      /* ignore */
    }
    set({ density });
  },

  locatePerson(id) {
    get().focusBoard(); // make the board the active tab so centering lands on a visible board
    set((s) => ({ locate: { id, nonce: (s.locate?.nonce ?? 0) + 1 } }));
  },
}));

// Persist the workspace (tabs / pane tiling / floats / note default) ~500ms after it changes,
// mirroring BoardView's debounced layout writer. Transient bits (openPersonId, locate, command,
// deletingId) live outside `workspace`, so they never trigger a write.
let workspaceSaveTimer: ReturnType<typeof setTimeout> | null = null;
useApp.subscribe((state, prev) => {
  if (state.workspace === prev.workspace) return;
  const { session, status } = state;
  if (!session || status !== "ready") return;
  if (workspaceSaveTimer) clearTimeout(workspaceSaveTimer);
  workspaceSaveTimer = setTimeout(() => {
    void session.saveWorkspace(useApp.getState().workspace).catch(() => {});
  }, 500);
});
