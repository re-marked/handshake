import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { VaultFile } from "../switchboard";
import type { VaultChange, VaultIO } from "./io";

/**
 * VaultIO backed by the Rust commands in src-tauri/src/lib.rs. `vault` is the
 * absolute path to the vault folder on disk.
 */
export function createTauriIO(vault: string): VaultIO {
  return {
    readVault: () => invoke<VaultFile[]>("read_vault", { vault }),
    writeFile: (relpath, text) => invoke<void>("write_file", { vault, relpath, content: text }),
    deleteFile: (relpath) => invoke<void>("delete_file", { vault, relpath }),
    readAttachment: (relpath) => invoke<string>("read_attachment", { vault, relpath }),
    watch: async (onChange) => {
      // Listen before starting the watcher so no early event slips through.
      const unlisten = await listen<VaultChange>("vault:change", (event) => onChange(event.payload));
      await invoke<void>("start_watching", { vault });
      return unlisten;
    },
  };
}
