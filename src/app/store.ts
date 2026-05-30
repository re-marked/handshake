import { create } from "zustand";
import { createTauriIO } from "@/vault/tauriIo";
import { VaultSession } from "@/vault/session";
import { emptyLayout, type Layout } from "@/vault/layout";
import { emptySwitchboard, type ApplyResult, type Diff, type Switchboard } from "@/switchboard";
import { emptyWorkspace, viewKey, type OpenTarget, type View, type Workspace } from "@/workspace/model";
import { findView, insertTab, mapLeaf, removeTab } from "@/workspace/ops";

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
  /** The docked workspace tree (tabs + splits) + floats + active leaf + note default. */
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
  /** Open a View into a target (tab / panel / replaceActive / split / float); dedupes + focuses. */
  openView: (view: View, target?: OpenTarget) => void;
  /** Close a tab (by viewKey) in a leaf. */
  closeTab: (leafId: string, key: string) => void;
  /** Make a tab active within its leaf. */
  setActiveTab: (leafId: string, key: string) => void;
  /** Mark a leaf as the active one. */
  setActiveLeaf: (leafId: string) => void;
  /** Focus (or open) the board tab and make it active. */
  focusBoard: () => void;
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
      const [switchboard, layout] = await Promise.all([session.load(), session.loadLayout()]);
      set({ switchboard, layout, status: "ready" });

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
    const ws = get().workspace;
    const key = viewKey(view);
    const found = findView(ws.root, key);
    if (found) {
      // already open somewhere → focus it (don't duplicate)
      set({
        workspace: {
          ...ws,
          activeLeafId: found.leaf.id,
          root: mapLeaf(ws.root, found.leaf.id, (l) => ({ ...l, activeIndex: found.index })),
        },
      });
      return;
    }
    const leafId = ws.activeLeafId;
    const root = mapLeaf(ws.root, leafId, (l) => {
      if (target === "replaceActive") {
        const cur = l.tabs[l.activeIndex];
        if (cur && cur.type !== "board") {
          return { ...l, tabs: l.tabs.map((t, i) => (i === l.activeIndex ? view : t)) };
        }
      }
      return insertTab(l, view); // split/float dock as a tab until those layers land
    });
    set({ workspace: { ...ws, activeLeafId: leafId, root } });
  },

  closeTab(leafId, key) {
    set((s) => ({
      workspace: { ...s.workspace, root: mapLeaf(s.workspace.root, leafId, (l) => removeTab(l, key)) },
    }));
  },

  setActiveTab(leafId, key) {
    set((s) => ({
      workspace: {
        ...s.workspace,
        activeLeafId: leafId,
        root: mapLeaf(s.workspace.root, leafId, (l) => {
          const i = l.tabs.findIndex((v) => viewKey(v) === key);
          return i >= 0 ? { ...l, activeIndex: i } : l;
        }),
      },
    }));
  },

  setActiveLeaf(leafId) {
    set((s) => ({ workspace: { ...s.workspace, activeLeafId: leafId } }));
  },

  focusBoard() {
    get().openView({ type: "board" }, "tab");
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
