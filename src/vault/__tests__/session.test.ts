import { describe, expect, it } from "vitest";
import { VaultSession } from "../session";
import type { Snapshot, TmSize, TmStats, TmStatus, VaultChange, VaultIO } from "../io";
import {
  canonicalHandshakeId,
  canonicalPair,
  mintPersonId,
  type Diff,
  type Handshake,
  type Person,
  type VaultFile,
} from "../../switchboard";
import { loadFixtureVault } from "../../switchboard/__tests__/fixtures";

/** In-memory VaultIO backed by a Map, standing in for the Rust shell + disk. */
class FakeIO implements VaultIO {
  readonly files = new Map<string, string>();
  private listeners: ((change: VaultChange) => void)[] = [];

  constructor(seed: VaultFile[]) {
    for (const f of seed) this.files.set(f.relpath, f.text);
  }
  async readVault(): Promise<VaultFile[]> {
    return [...this.files].map(([relpath, text]) => ({ relpath, text }));
  }
  async writeFile(relpath: string, text: string): Promise<void> {
    this.files.set(relpath, text);
  }
  async deleteFile(relpath: string): Promise<void> {
    this.files.delete(relpath);
  }
  async readAttachment(): Promise<string> {
    return "";
  }
  async importAttachment(_srcPath: string, name: string): Promise<string> {
    return `attachments/${name}.png`;
  }
  private layoutJson = "";
  async readLayout(): Promise<string> {
    return this.layoutJson;
  }
  async writeLayout(content: string): Promise<void> {
    this.layoutJson = content;
  }
  private workspaceJson = "";
  async readWorkspace(): Promise<string> {
    return this.workspaceJson;
  }
  async writeWorkspace(content: string): Promise<void> {
    this.workspaceJson = content;
  }
  private settingsJson = "";
  async readSettings(): Promise<string> {
    return this.settingsJson;
  }
  async writeSettings(content: string): Promise<void> {
    this.settingsJson = content;
  }
  async watch(onChange: (change: VaultChange) => void): Promise<() => void> {
    this.listeners.push(onChange);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== onChange);
    };
  }
  // Time Machine is git-on-disk; the in-memory fake just no-ops it.
  async tmInit(): Promise<void> {}
  async tmSnapshot(): Promise<string | null> {
    return null;
  }
  async tmLog(): Promise<Snapshot[]> {
    return [];
  }
  async tmRestore(): Promise<void> {}
  async tmStatus(): Promise<TmStatus> {
    return { isRepo: false, dirty: false, headId: null };
  }
  async tmSize(): Promise<TmSize> {
    return { dataBytes: 0, gitBytes: 0 };
  }
  async tmStats(): Promise<TmStats> {
    return { snapshots: 0, firstTime: 0, lastTime: 0, activeDays: 0, addedBytes: 0, dataBytes: 0, gitBytes: 0 };
  }
  async writeDebug(name: string): Promise<string> {
    return `/fake/.handshake/debug/${name}`;
  }
  /** Test helper: simulate an external editor writing a file. */
  externalWrite(relpath: string, text: string): void {
    this.files.set(relpath, text);
    for (const l of this.listeners) l({ relpath, kind: "modified", text });
  }
  /** Test helper: simulate an external deletion. */
  externalDelete(relpath: string): void {
    this.files.delete(relpath);
    for (const l of this.listeners) l({ relpath, kind: "removed", text: null });
  }
}

describe("VaultSession", () => {
  it("loads the vault into the engine", async () => {
    const session = new VaultSession(new FakeIO(loadFixtureVault()));
    await session.load();
    expect(session.switchboard.people.size).toBe(4);
    expect(session.switchboard.self?.id).toBe("self");
  });

  it("commits a capture and persists every file to disk", async () => {
    const io = new FakeIO(loadFixtureVault());
    const session = new VaultSession(io);
    await session.load();

    const id = mintPersonId(session.switchboard.people, "Anya Gupta");
    const person: Person = {
      kind: "person", id, name: "Anya Gupta", isSelf: false, tags: [], handles: {}, createdAt: "2026-05-29", body: "",
    };
    const handshake: Handshake = {
      kind: "handshake", id: canonicalHandshakeId("self", id), people: canonicalPair("self", id), strength: "cold", body: "",
    };
    const diff: Diff = [{ op: "createPerson", person }, { op: "createHandshake", handshake }];

    const result = await session.commit(diff);
    expect(result.ok).toBe(true);
    expect(io.files.has(`people/${id}.md`)).toBe(true);
    expect(io.files.has(`handshakes/${canonicalHandshakeId("self", id)}.md`)).toBe(true);
    expect(session.switchboard.people.has(id)).toBe(true);
  });

  it("survives a full round-trip through disk: commit, then a fresh session reloads it", async () => {
    const io = new FakeIO(loadFixtureVault());
    const session = new VaultSession(io);
    await session.load();

    const id = mintPersonId(session.switchboard.people, "Anya Gupta");
    const person: Person = {
      kind: "person", id, name: "Anya Gupta", isSelf: false, tags: ["journalist"],
      handles: { twitter: "@anyagupta" }, createdAt: "2026-05-29", body: "replied to her thread",
    };
    await session.commit([{ op: "createPerson", person }]);

    const reloaded = new VaultSession(io);
    await reloaded.load();
    expect(reloaded.switchboard.people.get(id)).toEqual(person);
  });

  it("writes nothing when the diff is rejected", async () => {
    const io = new FakeIO(loadFixtureVault());
    const session = new VaultSession(io);
    await session.load();
    const before = io.files.size;

    const bad: Handshake = {
      kind: "handshake", id: canonicalHandshakeId("self", "ghost"), people: canonicalPair("self", "ghost"), strength: "cold", body: "",
    };
    const result = await session.commit([{ op: "createHandshake", handshake: bad }]);
    expect(result.ok).toBe(false);
    expect(io.files.size).toBe(before);
  });

  it("reloads the board when an external edit arrives", async () => {
    const io = new FakeIO(loadFixtureVault());
    const session = new VaultSession(io);
    await session.load();
    let notified = 0;
    await session.watch(() => {
      notified += 1;
    });

    io.externalWrite(
      "people/sarah-chen.md",
      "---\nid: sarah-chen\nname: Sarah Chen\nisSelf: false\nrole: Partner\n---\nedited in Obsidian\n",
    );

    const sarah = session.switchboard.people.get("sarah-chen");
    expect(sarah?.role).toBe("Partner");
    expect(sarah?.body).toBe("edited in Obsidian");
    expect(notified).toBe(1);
  });

  it("drops an entity from the board when its file is deleted externally", async () => {
    const io = new FakeIO(loadFixtureVault());
    const session = new VaultSession(io);
    await session.load();
    await session.watch();
    expect(session.switchboard.people.has("james-liu")).toBe(true);

    io.externalDelete("people/james-liu.md");
    expect(session.switchboard.people.has("james-liu")).toBe(false);
  });

  it("persists and restores the board layout", async () => {
    const session = new VaultSession(new FakeIO(loadFixtureVault()));
    await session.saveLayout({
      positions: { self: { x: 10, y: 20 } },
      viewport: { pan: { x: 5, y: 5 }, zoom: 1.5 },
      parentOverrides: {},
    });
    const reloaded = await session.loadLayout();
    expect(reloaded.positions.self).toEqual({ x: 10, y: 20 });
    expect(reloaded.viewport?.zoom).toBe(1.5);
  });
});
