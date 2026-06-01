import type { VaultFile } from "../switchboard";

/** A change to a vault file detected on disk by the watcher. */
export interface VaultChange {
  relpath: string;
  kind: "modified" | "removed";
  text: string | null; // null for removals
}

// ── Time Machine (git) ───────────────────────────────────────────────────────

/** One snapshot (git commit) with its change stats, as returned by `tm_log`. */
export interface Snapshot {
  id: string;
  time: number; // unix seconds
  message: string;
  files: number;
  insertions: number;
  deletions: number;
}

/** Repo state for a vault. */
export interface TmStatus {
  isRepo: boolean;
  dirty: boolean;
  headId: string | null;
}

/** Bytes of network data vs. bytes of `.git` history. */
export interface TmSize {
  dataBytes: number;
  gitBytes: number;
}

/** Aggregated history stats for growth estimates. */
export interface TmStats {
  snapshots: number;
  firstTime: number; // unix seconds (0 if none)
  lastTime: number;
  activeDays: number; // distinct days with a snapshot
  addedBytes: number; // total added-line bytes across all snapshots — "content written"
  dataBytes: number;
  gitBytes: number;
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
  /** Read an attachment (image) as a data URL the webview can display. */
  readAttachment(relpath: string): Promise<string>;
  /** Copy an external image into the vault's attachments/ folder; returns the vault-relative path. */
  importAttachment(srcPath: string, name: string): Promise<string>;
  /** Read the board layout sidecar (raw JSON; empty string if absent). */
  readLayout(): Promise<string>;
  /** Atomically write the board layout sidecar. */
  writeLayout(content: string): Promise<void>;
  /** Read the workspace sidecar (raw JSON; empty string if absent). */
  readWorkspace(): Promise<string>;
  /** Atomically write the workspace sidecar. */
  writeWorkspace(content: string): Promise<void>;
  /** Read the settings sidecar (raw JSON; empty string if absent). */
  readSettings(): Promise<string>;
  /** Atomically write the settings sidecar. */
  writeSettings(content: string): Promise<void>;
  /** React to external edits (not our own writes). Resolves to an unsubscribe fn. */
  watch(onChange: (change: VaultChange) => void): Promise<() => void>;

  /** Write a debug report into `.handshake/debug/<name>`; resolves to its absolute path. */
  writeDebug(name: string, content: string): Promise<string>;

  // ── Time Machine ──
  /** Ensure the vault is a git repo (idempotent): .gitignore + identity + initial snapshot. */
  tmInit(): Promise<void>;
  /** Snapshot the vault; returns the new commit id, or null when nothing changed. */
  tmSnapshot(message: string): Promise<string | null>;
  /** Newest-first snapshot history (capped at `limit`). */
  tmLog(limit: number): Promise<Snapshot[]>;
  /** Rewrite the working tree to a snapshot's state (HEAD stays put). */
  tmRestore(commitId: string): Promise<void>;
  /** Repo state: is-repo / dirty / current HEAD id. */
  tmStatus(): Promise<TmStatus>;
  /** Disk sizes: network data vs. .git history. */
  tmSize(): Promise<TmSize>;
  /** Aggregated history stats (written bytes, active days, span) for growth estimates. */
  tmStats(): Promise<TmStats>;
}
