import { create } from "zustand";
import { createTauriIO } from "@/vault/tauriIo";
import { VaultSession } from "@/vault/session";
import { emptyLayout, type Layout } from "@/vault/layout";
import { emptySwitchboard, type Switchboard } from "@/switchboard";
import { viewKey, type OpenTarget, type View } from "@/app/view";

type Status = "idle" | "loading" | "ready" | "error";

export interface FloatWindow {
  key: string;
  view: View;
  x: number;
  y: number;
}

/**
 * The app store — the backbone the whole shell reads from. Holds the live vault state,
 * the workspace (floats now; tabs/splits in later layers), and routes writes through
 * the one VaultSession. See SHELL.md.
 */
interface AppState {
  status: Status;
  error: string | null;
  session: VaultSession | null;
  switchboard: Switchboard;
  photos: Map<string, string>;
  layout: Layout;
  floats: FloatWindow[];
  selectedId: string | null;

  init: (vault: string) => Promise<void>;
  saveLayout: (layout: Layout) => void;
  openView: (view: View, target: OpenTarget, at?: { x: number; y: number }) => void;
  closeFloat: (key: string) => void;
  select: (id: string | null) => void;
}

export const useApp = create<AppState>()((set, get) => ({
  status: "idle",
  error: null,
  session: null,
  switchboard: emptySwitchboard(),
  photos: new Map(),
  layout: emptyLayout(),
  floats: [],
  selectedId: null,

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

  // L1 wires only `float`; tab/split/sidebar land in later layers (see SHELL.md).
  openView(view, target, at) {
    if (target !== "float") return;
    const key = viewKey(view);
    const selectedId = view.type === "person" ? view.id : get().selectedId;
    if (get().floats.some((f) => f.key === key)) {
      set({ selectedId });
      return;
    }
    set((s) => ({
      floats: [...s.floats, { key, view, x: at?.x ?? 96, y: at?.y ?? 96 }],
      selectedId,
    }));
  },

  closeFloat(key) {
    set((s) => ({ floats: s.floats.filter((f) => f.key !== key) }));
  },

  select(id) {
    set({ selectedId: id });
  },
}));
