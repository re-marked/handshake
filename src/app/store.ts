import { create } from "zustand";
import { createTauriIO } from "@/vault/tauriIo";
import { VaultSession } from "@/vault/session";
import { emptyLayout, type Layout } from "@/vault/layout";
import { emptySwitchboard, type Switchboard } from "@/switchboard";

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

  init: (vault: string) => Promise<void>;
  saveLayout: (layout: Layout) => void;
  /** Open a person's note — or close it if that person is already open (tap-to-toggle). */
  togglePerson: (id: string) => void;
  closePerson: () => void;
}

export const useApp = create<AppState>()((set, get) => ({
  status: "idle",
  error: null,
  session: null,
  switchboard: emptySwitchboard(),
  photos: new Map(),
  layout: emptyLayout(),
  openPersonId: null,

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

  // Persist only — don't store the live layout back into state (would re-seed mid-drag).
  saveLayout(layout) {
    void get().session?.saveLayout(layout).catch(() => {});
  },

  togglePerson(id) {
    set((s) => ({ openPersonId: s.openPersonId === id ? null : id }));
  },

  closePerson() {
    set({ openPersonId: null });
  },
}));
