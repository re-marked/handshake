import {
  applyDiff,
  buildSwitchboard,
  emptySwitchboard,
  type ApplyResult,
  type Diff,
  type Switchboard,
  type VaultFile,
} from "../switchboard";
import type { VaultChange, VaultIO } from "./io";

/**
 * Owns the live Switchboard and the disk. The only stateful object in the data
 * layer; everything it leans on (the engine, applyDiff) is pure. It keeps an
 * in-memory mirror of the files so external edits can rebuild the board cheaply.
 */
export class VaultSession {
  private board: Switchboard = emptySwitchboard();
  private readonly files = new Map<string, string>();

  constructor(private readonly io: VaultIO) {}

  get switchboard(): Switchboard {
    return this.board;
  }

  /** Read the vault from disk and (re)build the in-memory state. */
  async load(): Promise<Switchboard> {
    const vaultFiles = await this.io.readVault();
    this.files.clear();
    for (const file of vaultFiles) this.files.set(file.relpath, file.text);
    this.board = buildSwitchboard(vaultFiles);
    return this.board;
  }

  /**
   * Validate + compute writes via the funnel, persist them, then swap in the new
   * state. A rejected diff writes nothing and leaves the state untouched.
   */
  async commit(diff: Diff): Promise<ApplyResult> {
    const result = applyDiff(this.board, diff);
    if (!result.ok) return result;
    for (const write of result.writes) {
      if ("delete" in write) {
        await this.io.deleteFile(write.relpath);
        this.files.delete(write.relpath);
      } else {
        await this.io.writeFile(write.relpath, write.text);
        this.files.set(write.relpath, write.text);
      }
    }
    this.board = result.next;
    return result;
  }

  /** Begin reacting to external edits (Obsidian, git, etc.). Returns an unsubscribe fn. */
  async watch(onChange?: (change: VaultChange) => void): Promise<() => void> {
    return this.io.watch((change) => {
      this.applyExternalChange(change);
      onChange?.(change);
    });
  }

  private applyExternalChange(change: VaultChange): void {
    if (change.kind === "removed") this.files.delete(change.relpath);
    else this.files.set(change.relpath, change.text ?? "");
    this.board = buildSwitchboard(this.toVaultFiles());
  }

  private toVaultFiles(): VaultFile[] {
    return [...this.files].map(([relpath, text]) => ({ relpath, text }));
  }
}
