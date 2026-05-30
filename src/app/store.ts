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
  type NoteMode,
  type OpenTarget,
  type Pane,
  type View,
  type Workspace,
} from "@/workspace/model";
import { findPane, paneShowing, panes, removePane, setPaneView, setSizes, splitPane } from "@/workspace/ops";

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
  /** The workspace: open tabs (the single top bar) + the pane tiling below + floats + note default. */
  workspace: Workspace;
  /** Row density for list views (People). Persisted to localStorage. */
  density: "compact" | "comfortable" | "spacious";
  /** A request to center the board on a person (from the People view); nonce retriggers. */
  locate: { id: string; nonce: number } | null;

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
  /** Open a page in the focused pane (or focus its pane if already shown). */
  openTab: (view: View) => void;
  /** Click a tab: focus its pane, else swap it into the focused pane. */
  selectTab: (key: string) => void;
  /** Close a page (and its pane, if it's currently shown). */
  closeTab: (key: string) => void;
  /** Split the focused pane, showing a view in the new pane. */
  splitActive: (dir: "row" | "col", view: View) => void;
  /** Focus a pane. */
  setActivePane: (id: string) => void;
  /** Focus (or open) the home board in the active pane. */
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
    if (s.workspace.tabs.some((t) => viewKey(t) === key)) {
      get().selectTab(key); // already a docked tab/pane → focus it
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
    set((s) => ({
      deletingId: id,
      openPersonId: null,
      // drop any floating note for this person; a docked tab is cleaned up below.
      workspace: {
        ...s.workspace,
        floats: s.workspace.floats.filter((f) => !(f.view.type === "person" && f.view.id === id)),
      },
    }));
    get().closeTab(`person:${id}`);
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
      get().splitActive(target.split, view);
      return;
    }
    get().openTab(view);
  },

  openTab(view) {
    const ws = get().workspace;
    const key = viewKey(view);
    const tabs = ws.tabs.some((t) => viewKey(t) === key) ? ws.tabs : [...ws.tabs, view];
    const shown = paneShowing(ws.layout, key);
    if (shown) {
      set({ workspace: { ...ws, tabs, activePaneId: shown.id } }); // already visible → focus it
      return;
    }
    set({ workspace: { ...ws, tabs, layout: setPaneView(ws.layout, ws.activePaneId, view) } });
  },

  selectTab(key) {
    const ws = get().workspace;
    const shown = paneShowing(ws.layout, key);
    if (shown) {
      set({ workspace: { ...ws, activePaneId: shown.id } });
      return;
    }
    const view = ws.tabs.find((t) => viewKey(t) === key);
    if (view) set({ workspace: { ...ws, layout: setPaneView(ws.layout, ws.activePaneId, view) } });
  },

  splitActive(dir, view) {
    const ws = get().workspace;
    const key = viewKey(view);
    const tabs = ws.tabs.some((t) => viewKey(t) === key) ? ws.tabs : [...ws.tabs, view];
    const newPane: Pane = { kind: "pane", id: newId(), view };
    set({
      workspace: {
        ...ws,
        tabs,
        layout: splitPane(ws.layout, ws.activePaneId, dir, newPane),
        activePaneId: newPane.id,
      },
    });
  },

  closeTab(key) {
    const ws = get().workspace;
    const tabs = ws.tabs.filter((t) => viewKey(t) !== key);
    if (tabs.length === 0) return; // never close the last page (board "main" is un-closable anyway)
    const shown = paneShowing(ws.layout, key);
    let layout = ws.layout;
    let activePaneId = ws.activePaneId;
    if (shown) {
      layout =
        panes(ws.layout).length > 1
          ? removePane(ws.layout, shown.id) // collapse the pane
          : setPaneView(ws.layout, shown.id, tabs[0]); // sole pane → show another page
      if (!findPane(layout, activePaneId)) activePaneId = panes(layout)[0]?.id ?? activePaneId;
    }
    set({ workspace: { ...ws, tabs, layout, activePaneId } });
  },

  setActivePane(id) {
    set((s) => ({ workspace: { ...s.workspace, activePaneId: id } }));
  },

  focusBoard() {
    get().openTab({ type: "board", id: "main" });
  },

  resizeSplit(splitId, sizes) {
    set((s) => ({ workspace: { ...s.workspace, layout: setSizes(s.workspace.layout, splitId, sizes) } }));
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
    const key = `person:${id}`;
    const s = get();
    // Detach from every container first — a person lives in exactly one place.
    set({
      openPersonId: s.openPersonId === id ? null : s.openPersonId,
      workspace: { ...s.workspace, floats: s.workspace.floats.filter((f) => viewKey(f.view) !== key) },
    });
    get().closeTab(key); // drops a docked tab + collapses its pane, if present
    // Re-attach in the target mode.
    if (mode === "panel") set({ openPersonId: id });
    else if (mode === "float") get().addFloat(view);
    else get().openTab(view);
  },

  setNoteDefault(mode) {
    set((s) => ({ workspace: { ...s.workspace, noteDefault: mode } }));
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
