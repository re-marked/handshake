import type { VaultFile } from "../switchboard";

/** A change to a vault file detected on disk by the watcher. */
export interface VaultChange {
  relpath: string;
  kind: "modified" | "removed";
  text: string | null; // null for removals
}

/**
 * The disk boundary. The Rust shell implements this for the real app; tests
 * inject an in-memory fake. Keeping it an interface is what lets the whole
 * session layer be tested without a Tauri runtime.
 */
export interface VaultIO {
  /** Read every markdown entity file in the vault. */
  readVault(): Promise<VaultFile[]>;
  /** Atomically write (or overwrite) one file. */
  writeFile(relpath: string, text: string): Promise<void>;
  /** Delete one file (a no-op if it's already gone). */
  deleteFile(relpath: string): Promise<void>;
  /** React to external edits (not our own writes). Resolves to an unsubscribe fn. */
  watch(onChange: (change: VaultChange) => void): Promise<() => void>;
}
