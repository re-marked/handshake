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
    importAttachment: (srcPath, name) => invoke<string>("import_attachment", { vault, src: srcPath, name }),
    readLayout: () => invoke<string>("read_layout", { vault }),
    writeLayout: (content) => invoke<void>("write_layout", { vault, content }),
    readWorkspace: () => invoke<string>("read_workspace", { vault }),
    writeWorkspace: (content) => invoke<void>("write_workspace", { vault, content }),
    readSettings: () => invoke<string>("read_settings", { vault }),
    writeSettings: (content) => invoke<void>("write_settings", { vault, content }),
    watch: async (onChange) => {
      // Listen before starting the watcher so no early event slips through.
      const unlisten = await listen<VaultChange>("vault:change", (event) => onChange(event.payload));
      await invoke<void>("start_watching", { vault });
      return unlisten;
    },
  };
}
