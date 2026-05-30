import { create } from "zustand";
import { createTauriIO } from "@/vault/tauriIo";
import { VaultSession } from "@/vault/session";
import { emptyLayout, type Layout } from "@/vault/layout";
import { emptySwitchboard, type ApplyResult, type Diff, type Switchboard } from "@/switchboard";

type Status = "idle" | "loading" | "ready" | "error";

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
  /** The active primary view in the main area. */
  view: "board" | "goals";

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
  /** Switch the primary view (board ↔ goals). */
  setView: (view: "board" | "goals") => void;
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
  view: "board",

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

  setView(view) {
    set({ view });
  },
}));
