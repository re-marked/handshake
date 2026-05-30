import { create } from "zustand";
import { createTauriIO } from "@/vault/tauriIo";
import { VaultSession } from "@/vault/session";
import { emptyLayout, type Layout } from "@/vault/layout";
import { emptySwitchboard, type Switchboard } from "@/switchboard";

type Status = "idle" | "loading" | "ready" | "error";

/**
 * The app store — the backbone the whole shell reads from. Holds the live vault state
 * and routes writes through the one VaultSession. Workspace/selection state lands here
 * in later layers (see SHELL.md).
 */
interface AppState {
  status: Status;
  error: string | null;
  session: VaultSession | null;
  switchboard: Switchboard;
  photos: Map<string, string>;
  layout: Layout;

  init: (vault: string) => Promise<void>;
  /** Persist the board layout (positions + viewport) to disk. */
  saveLayout: (layout: Layout) => void;
}

export const useApp = create<AppState>()((set, get) => ({
  status: "idle",
  error: null,
  session: null,
  switchboard: emptySwitchboard(),
  photos: new Map(),
  layout: emptyLayout(),

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

  // Don't store the live layout back into state — that would re-seed the board mid-drag.
  // We only write it through; the in-memory layout is the snapshot the board seeded from.
  saveLayout(layout) {
    void get().session?.saveLayout(layout).catch(() => {});
  },
}));
