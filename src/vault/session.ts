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
import { emptyLayout, parseLayout, serializeLayout, type Layout } from "./layout";
import { parseWorkspace, serializeWorkspace } from "./workspace";
import { emptyWorkspace, type Workspace } from "@/workspace/model";

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

  /** Read an attachment (image) as a data URL the webview can display. */
  readAttachment(relpath: string): Promise<string> {
    return this.io.readAttachment(relpath);
  }

  /** Load the board layout sidecar (positions, viewport, parent overrides). */
  async loadLayout(): Promise<Layout> {
    try {
      return parseLayout(await this.io.readLayout());
    } catch {
      return emptyLayout();
    }
  }

  /** Persist the board layout sidecar. */
  async saveLayout(layout: Layout): Promise<void> {
    await this.io.writeLayout(serializeLayout(layout));
  }

  /** Load the workspace sidecar (open tabs, the pane tiling, floats). */
  async loadWorkspace(): Promise<Workspace> {
    try {
      return parseWorkspace(await this.io.readWorkspace());
    } catch {
      return emptyWorkspace();
    }
  }

  /** Persist the workspace sidecar. */
  async saveWorkspace(workspace: Workspace): Promise<void> {
    await this.io.writeWorkspace(serializeWorkspace(workspace));
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
