import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

// App-level state that lives OUTSIDE any vault (in the OS app-config dir): the list of recently
// opened vault paths, most-recent first. Tracks which "networks" exist so we can reopen the last
// one on launch and offer a quick switcher. Browser-safe (only Tauri invoke + the dialog plugin).

/** The display name for a vault path = its folder name. */
export function vaultName(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

/** Does the vault folder still exist? (A recent path may have been deleted/moved.) */
export function vaultExists(path: string): Promise<boolean> {
  return invoke<boolean>("vault_exists", { vault: path });
}

/** Does this folder actually look like a Handshake vault (owner card / minimal structure)? Used to
 *  refuse opening an arbitrary folder as a vault. Creation bypasses this (a new folder is empty). */
export function isVault(path: string): Promise<boolean> {
  return invoke<boolean>("is_vault", { vault: path });
}

/** A filesystem-safe folder name from a network name (strips path-illegal chars; keeps spaces). */
export function sanitizeFolderName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Join a parent path + child using the parent's own separator (Windows backslash vs POSIX). */
export function joinPath(parent: string, child: string): string {
  const sep = parent.includes("\\") ? "\\" : "/";
  return `${parent.replace(/[\\/]+$/, "")}${sep}${child}`;
}

/** Load the recent vault paths (most-recent first). Empty on first run / any error. */
export async function loadRecents(): Promise<string[]> {
  try {
    const raw = await invoke<string>("read_app_state");
    if (!raw.trim()) return [];
    const data = JSON.parse(raw) as unknown;
    const recents = (data as { recents?: unknown }).recents;
    return Array.isArray(recents) ? recents.filter((p): p is string => typeof p === "string") : [];
  } catch {
    return [];
  }
}

/** Persist the recent vault paths. Best-effort. */
export async function saveRecents(recents: string[]): Promise<void> {
  try {
    await invoke<void>("write_app_state", { content: JSON.stringify({ recents }, null, 2) });
  } catch {
    /* ignore */
  }
}

/** Open the OS folder picker; returns the chosen absolute path, or null if cancelled. */
export async function pickFolder(title: string): Promise<string | null> {
  const picked = await open({ directory: true, multiple: false, title });
  return typeof picked === "string" ? picked : null;
}
