import { describe, expect, it } from "vitest";
import { buildSwitchboard, lastInteractionDate, type Switchboard, type VaultFile } from "../index";
import { loadFixtureVault } from "./fixtures";

/** Build a vault from inline [relpath, text] pairs. */
function vault(...files: [string, string][]): VaultFile[] {
  return files.map(([relpath, text]) => ({ relpath, text }));
}

/** A minimal entity file: frontmatter + (optional) body. */
function file(frontmatter: string, body = ""): string {
  return `---\n${frontmatter}\n---\n${body}\n`;
}

/** Sorted neighbor ids, for stable assertions. */
function neighbors(sb: Switchboard, id: string): string[] {
  return [...(sb.adjacency.get(id) ?? new Set<string>())].sort();
}

describe("buildSwitchboard — fixture vault", () => {
  const sb = buildSwitchboard(loadFixtureVault());

  it("loads every entity into its store", () => {
    expect(sb.people.size).toBe(4);
    expect(sb.handshakes.size).toBe(4);
    expect(sb.goals.size).toBe(2);
    expect(sb.interactions.size).toBe(2);
  });

  it("identifies the self node by flag, not filename", () => {
    expect(sb.self?.id).toBe("self");
    expect(sb.self?.isSelf).toBe(true);
  });

  it("builds an undirected adjacency map", () => {
    expect(neighbors(sb, "self")).toEqual(["sarah-chen", "tom-okonkwo"]);
    expect(neighbors(sb, "tom-okonkwo")).toEqual(["james-liu", "sarah-chen", "self"]);
    expect(neighbors(sb, "sarah-chen")).toEqual(["self", "tom-okonkwo"]);
    expect(neighbors(sb, "james-liu")).toEqual(["tom-okonkwo"]); // reachable only via Tom
  });

  it("groups interactions by person, newest first", () => {
    expect(sb.interactionsByPerson.get("sarah-chen")?.map((i) => i.id)).toEqual(["2026-05-26-dm-sarah"]);
    expect(lastInteractionDate(sb, "sarah-chen")).toBe("2026-05-26");
    expect(lastInteractionDate(sb, "self")).toBeUndefined(); // no interaction tags self yet
  });

  it("is clean — and a dangling goal target is NOT a problem", () => {
    expect(sb.problems).toEqual([]);
    expect(sb.goals.get("meet-naval")?.target).toBe("naval-ravikant"); // not in vault — intentionally fine
  });

  it("parses with no Node Buffer present (WebView2 has no Node globals)", () => {
    const g = globalThis as { Buffer?: unknown };
    const saved = g.Buffer;
    try {
      delete g.Buffer;
      expect(buildSwitchboard(loadFixtureVault()).people.size).toBe(4);
    } finally {
      g.Buffer = saved;
    }
  });
});

describe("buildSwitchboard — resilience", () => {
  it("an empty vault yields empty state and no problems", () => {
    const sb = buildSwitchboard([]);
    expect(sb.people.size).toBe(0);
    expect(sb.self).toBeNull();
    expect(sb.problems).toEqual([]);
  });

  it("warns when people exist but none is self", () => {
    const sb = buildSwitchboard(vault(["people/a.md", file("id: a\nname: A\nisSelf: false")]));
    expect(sb.self).toBeNull();
    expect(sb.problems.some((p) => p.message.includes("no self node"))).toBe(true);
  });

  it("picks a deterministic self when several are flagged", () => {
    const sb = buildSwitchboard(vault(
      ["people/zara.md", file("id: zara\nname: Zara\nisSelf: true")],
      ["people/amy.md", file("id: amy\nname: Amy\nisSelf: true")],
    ));
    expect(sb.self?.id).toBe("amy"); // lowest id wins
    expect(sb.problems.some((p) => p.message.includes("multiple self nodes"))).toBe(true);
  });

  it("flags a handshake to an unknown person and omits the dead edge", () => {
    const sb = buildSwitchboard(vault(
      ["people/a.md", file("id: a\nname: A\nisSelf: true")],
      ["handshakes/a__ghost.md", file("people: [a, ghost]\nstrength: warm")],
    ));
    expect(sb.adjacency.get("a")).toBeUndefined(); // edge skipped — ghost isn't real
    expect(sb.problems.some((p) => p.message.includes('unknown person "ghost"'))).toBe(true);
  });

  it("flags a non-canonical handshake filename but still records the edge", () => {
    const sb = buildSwitchboard(vault(
      ["people/a.md", file("id: a\nname: A\nisSelf: true")],
      ["people/b.md", file("id: b\nname: B")],
      ["handshakes/b__a.md", file("people: [b, a]\nstrength: warm")], // should be a__b
    ));
    expect(sb.problems.some((p) => p.message.includes('"a__b.md"'))).toBe(true);
    expect(neighbors(sb, "a")).toEqual(["b"]);
  });

  it("flags a duplicate relationship", () => {
    const sb = buildSwitchboard(vault(
      ["people/a.md", file("id: a\nname: A\nisSelf: true")],
      ["people/b.md", file("id: b\nname: B")],
      ["handshakes/a__b.md", file("people: [a, b]\nstrength: warm")],
      ["handshakes/b__a.md", file("people: [b, a]\nstrength: cold")], // same pair
    ));
    expect(sb.handshakes.size).toBe(2); // both files stored…
    expect(neighbors(sb, "a")).toEqual(["b"]); // …but only one edge
    expect(sb.problems.some((p) => p.message.includes("duplicate handshake"))).toBe(true);
  });

  it("excludes a malformed entity but keeps the rest of the vault", () => {
    const sb = buildSwitchboard(vault(
      ["people/a.md", file("id: a\nname: A\nisSelf: true")],
      ["handshakes/broken.md", file("people: [only-one]\nstrength: warm")], // needs exactly 2
    ));
    expect(sb.people.size).toBe(1);
    expect(sb.handshakes.size).toBe(0);
    expect(sb.problems.some((p) => p.severity === "error")).toBe(true);
  });

  it("ignores non-entity files without complaint", () => {
    const sb = buildSwitchboard(vault(
      ["README.md", "# not an entity"],
      ["attachments/a.jpg", "not markdown anyway"],
      ["people/a.md", file("id: a\nname: A\nisSelf: true")],
    ));
    expect(sb.people.size).toBe(1);
    expect(sb.problems).toEqual([]);
  });
});
