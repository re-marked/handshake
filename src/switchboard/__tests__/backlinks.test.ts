import { describe, expect, it } from "vitest";
import { buildNameIndex, buildSwitchboard, resolvePersonRef, type Person, type VaultFile } from "../index";
import { buildBoardModel } from "@/board/tree";

function vault(...files: [string, string][]): VaultFile[] {
  return files.map(([relpath, text]) => ({ relpath, text }));
}
function person(id: string, name: string, body = ""): [string, string] {
  return [`people/${id}.md`, `---\nname: ${name}\nisSelf: false\n---\n${body}\n`];
}
const NOW = new Date("2026-06-20T00:00:00Z");

describe("resolvePersonRef + buildNameIndex", () => {
  const people = new Map<string, Person>([
    ["sarah-chen", { kind: "person", id: "sarah-chen", name: "Sarah Chen", isSelf: false, tags: [], affiliations: [], handles: {}, body: "" }],
    ["sam", { kind: "person", id: "sam", name: "Sam", isSelf: false, tags: [], affiliations: [], handles: {}, body: "" }],
    ["sam-2", { kind: "person", id: "sam-2", name: "Sam", isSelf: false, tags: [], affiliations: [], handles: {}, body: "" }],
  ]);
  const index = buildNameIndex(people);

  it("resolves by display name, case-insensitively", () => {
    expect(resolvePersonRef("Sarah Chen", index, people)).toBe("sarah-chen");
    expect(resolvePersonRef("  sarah chen ", index, people)).toBe("sarah-chen");
  });
  it("falls back to the slug when the name doesn't match", () => {
    expect(resolvePersonRef("sarah-chen", index, people)).toBe("sarah-chen");
  });
  it("returns null for an unknown ref", () => {
    expect(resolvePersonRef("Nobody At All", index, people)).toBeNull();
    expect(resolvePersonRef("  ", index, people)).toBeNull();
  });
  it("resolves a duplicate display name to the first (deterministic)", () => {
    expect(resolvePersonRef("Sam", index, people)).toBe("sam");
  });
});

describe("buildBacklinks (the derived index)", () => {
  it("indexes inbound [[mentions]] by name + slug, ignoring self + unresolved", () => {
    const sb = buildSwitchboard(
      vault(
        person("alice", "Alice", "Met [[Bob]] via [[Sarah Chen]]. Note to self: [[Alice]]. Also [[Ghost]]."),
        person("carol", "Carol", "[[bob]] is great – and [[sarah-chen]] too."),
        person("bob", "Bob"),
        person("sarah-chen", "Sarah Chen"),
      ),
    );
    expect([...(sb.backlinks.get("bob") ?? [])].sort()).toEqual(["alice", "carol"]);
    expect([...(sb.backlinks.get("sarah-chen") ?? [])].sort()).toEqual(["alice", "carol"]);
    expect(sb.backlinks.has("alice")).toBe(false); // self-mention skipped
    expect(sb.backlinks.has("ghost")).toBe(false); // unresolved skipped
  });

  it("is visual-only: deriving backlinks creates no handshake files", () => {
    const sb = buildSwitchboard(vault(person("alice", "Alice", "[[Bob]]"), person("bob", "Bob")));
    expect(sb.handshakes.size).toBe(0);
  });
});

describe("buildBoardModel – backlink edges + card size", () => {
  it("emits a backlink edge only where no tie already exists, and counts inbound mentions", () => {
    const sb = buildSwitchboard(
      vault(
        ["people/self.md", "---\nname: Me\nisSelf: true\n---\n"],
        person("alice", "Alice", "[[Bob]]"),
        person("carol", "Carol", "[[Bob]]"),
        person("bob", "Bob"),
      ),
    );
    const model = buildBoardModel(sb, NOW);
    const backlinks = model.links.filter((l) => l.backlink).map((l) => `${l.a}->${l.b}`).sort();
    expect(backlinks).toEqual(["alice->bob", "carol->bob"]);
    expect(model.cards.find((c) => c.id === "bob")?.backlinkCount).toBe(2);
    expect(model.cards.find((c) => c.id === "alice")?.backlinkCount).toBe(0);
  });

  it("does not draw a backlink line when the pair already has a handshake", () => {
    const sb = buildSwitchboard(
      vault(
        ["people/self.md", "---\nname: Me\nisSelf: true\n---\n"],
        person("alice", "Alice", "[[Bob]]"),
        person("bob", "Bob"),
        ["handshakes/alice__bob.md", "---\npeople: [alice, bob]\nstrength: warm\n---\n"],
      ),
    );
    const model = buildBoardModel(sb, NOW);
    expect(model.links.some((l) => l.backlink)).toBe(false);
    // ...but the count still reflects the mention.
    expect(model.cards.find((c) => c.id === "bob")?.backlinkCount).toBe(1);
  });
});
