import { create } from "zustand";
import { createTauriIO } from "@/vault/tauriIo";
import { VaultSession } from "@/vault/session";
import { emptyLayout, type Layout } from "@/vault/layout";
import { emptySwitchboard, type ApplyResult, type Diff, type Switchboard } from "@/switchboard";
import { emptyWorkspace, newId, viewKey, type OpenTarget, type Pane, type View, type Workspace } from "@/workspace/model";
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
  /** Open a person's note — or close it if that person is already open (tap-to-toggle). */
  togglePerson: (id: string) => void;
  /** Open a person's note unconditionally (e.g. just after creating them). */
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

  togglePerson(id) {
    set((s) => ({ openPersonId: s.openPersonId === id ? null : id }));
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
    set({ deletingId: id, openPersonId: null });
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
    if (typeof target === "object") {
      get().splitActive(target.split, view);
      return;
    }
    get().openTab(view); // "tab" (and "float" until step 3)
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
