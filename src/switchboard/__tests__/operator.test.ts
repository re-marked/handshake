import { describe, expect, it } from "vitest";
import {
  applyDiff,
  buildSwitchboard,
  canonicalHandshakeId,
  canonicalPair,
  mintInteractionId,
  mintPersonId,
  parseEntity,
  slugify,
  type Diff,
  type Handshake,
  type Interaction,
  type Person,
  type Switchboard,
} from "../index";
import { loadFixtureVault } from "./fixtures";

const base = () => buildSwitchboard(loadFixtureVault());

function entitiesOf(sb: Switchboard) {
  return {
    people: Object.fromEntries(sb.people),
    handshakes: Object.fromEntries(sb.handshakes),
    goals: Object.fromEntries(sb.goals),
    interactions: Object.fromEntries(sb.interactions),
  };
}

/** The three mutations a "replied to Anya" capture would produce. */
function captureAnya(sb: Switchboard): { diff: Diff; personId: string; interactionId: string } {
  const personId = mintPersonId(sb.people, "Anya Gupta");
  const person: Person = {
    kind: "person", id: personId, name: "Anya Gupta", isSelf: false,
    tags: ["journalist"], affiliations: [], handles: { twitter: "@anyagupta" }, createdAt: "2026-05-29", body: "",
  };
  const handshake: Handshake = {
    kind: "handshake", id: canonicalHandshakeId("self", personId),
    people: canonicalPair("self", personId), strength: "cold", body: "",
  };
  const interactionId = mintInteractionId(sb.interactions, "2026-05-29", "reply", [personId]);
  const interaction: Interaction = {
    kind: "interaction", id: interactionId, date: "2026-05-29", type: "reply",
    channel: "twitter", people: [personId], body: "replied to her AI-journalism thread",
  };
  return {
    diff: [
      { op: "createPerson", person },
      { op: "createHandshake", handshake },
      { op: "logInteraction", interaction },
    ],
    personId,
    interactionId,
  };
}

describe("applyDiff – capture", () => {
  it("applies a multi-mutation diff with intra-diff references", () => {
    const sb = base();
    const { diff, personId, interactionId } = captureAnya(sb);
    const r = applyDiff(sb, diff);

    expect(r.ok).toBe(true);
    expect(r.writes).toHaveLength(3);
    expect(r.created).toEqual([
      { kind: "person", id: personId },
      { kind: "handshake", id: canonicalHandshakeId("self", personId) },
      { kind: "interaction", id: interactionId },
    ]);
    expect([...(r.next.adjacency.get(personId) ?? [])]).toEqual(["self"]);
    expect(r.next.interactionsByPerson.get(personId)?.length).toBe(1);
    expect(r.next.problems).toEqual([]);
  });

  it("does not mutate the input state (purity)", () => {
    const sb = base();
    const snapshot = entitiesOf(sb);
    applyDiff(sb, captureAnya(sb).diff);
    expect(entitiesOf(sb)).toEqual(snapshot);
  });

  it("every write parses back cleanly", () => {
    const sb = base();
    const r = applyDiff(sb, captureAnya(sb).diff);
    for (const w of r.writes) {
      if (!("text" in w)) continue;
      expect(parseEntity(w.relpath, w.text).ok).toBe(true);
    }
  });
});

describe("applyDiff – undo (inverse)", () => {
  it("inverse of a capture restores the original state exactly", () => {
    const sb = base();
    const before = entitiesOf(sb);
    const applied = applyDiff(sb, captureAnya(sb).diff);
    const undone = applyDiff(applied.next, applied.inverse);
    expect(undone.ok).toBe(true);
    expect(entitiesOf(undone.next)).toEqual(before);
  });

  it("inverse of an update restores the prior field values", () => {
    const sb = base();
    const before = sb.people.get("sarah-chen");
    const applied = applyDiff(sb, [
      { op: "updatePerson", id: "sarah-chen", patch: { affiliations: [{ role: "VP Growth", company: "Linear Inc" }] } },
    ]);
    expect(applied.next.people.get("sarah-chen")?.affiliations[0]?.role).toBe("VP Growth");
    const undone = applyDiff(applied.next, applied.inverse);
    expect(undone.next.people.get("sarah-chen")).toEqual(before);
  });

  it("inverse of a delete recreates the entity exactly, body and all", () => {
    const sb = base();
    const sarah = sb.people.get("sarah-chen");
    const applied = applyDiff(sb, [{ op: "deletePerson", id: "sarah-chen" }]);
    expect(applied.writes[0]).toEqual({ relpath: "people/sarah-chen.md", delete: true });
    expect(applied.next.people.has("sarah-chen")).toBe(false);
    const undone = applyDiff(applied.next, applied.inverse);
    expect(undone.next.people.get("sarah-chen")).toEqual(sarah);
  });
});

describe("applyDiff – validation & atomicity", () => {
  it("rejects a handshake to an unknown person, writing nothing", () => {
    const sb = base();
    const handshake: Handshake = {
      kind: "handshake", id: canonicalHandshakeId("self", "ghost"),
      people: canonicalPair("self", "ghost"), strength: "cold", body: "",
    };
    const r = applyDiff(sb, [{ op: "createHandshake", handshake }]);
    expect(r.ok).toBe(false);
    expect(r.writes).toEqual([]);
    expect(r.next).toBe(sb); // unchanged reference
    expect(r.errors[0]).toMatch(/unknown person "ghost"/);
  });

  it("rejects a non-canonical handshake id", () => {
    const sb = base();
    const handshake: Handshake = {
      kind: "handshake", id: "self__sarah-chen", people: ["self", "sarah-chen"], strength: "warm", body: "",
    };
    expect(applyDiff(sb, [{ op: "createHandshake", handshake }]).errors[0]).toMatch(/canonical/);
  });

  it("is atomic: a later invalid mutation discards earlier valid ones", () => {
    const sb = base();
    const id = mintPersonId(sb.people, "New Person");
    const person: Person = { kind: "person", id, name: "New Person", isSelf: false, tags: [], affiliations: [], handles: {}, body: "" };
    const bad: Handshake = {
      kind: "handshake", id: canonicalHandshakeId(id, "ghost"),
      people: canonicalPair(id, "ghost"), strength: "cold", body: "",
    };
    const r = applyDiff(sb, [{ op: "createPerson", person }, { op: "createHandshake", handshake: bad }]);
    expect(r.ok).toBe(false);
    expect(r.next.people.has(id)).toBe(false); // the valid create rolled back too
  });

  it("rejects updating or deleting a missing entity", () => {
    const sb = base();
    expect(applyDiff(sb, [{ op: "deleteGoal", id: "nope" }]).ok).toBe(false);
    expect(applyDiff(sb, [{ op: "updatePerson", id: "nope", patch: { affiliations: [{ role: "x" }] } }]).ok).toBe(false);
  });
});

describe("id minting", () => {
  it("slugify handles case, spaces, punctuation, and diacritics", () => {
    expect(slugify("Sarah Chen")).toBe("sarah-chen");
    const accented = "Jose" + String.fromCharCode(0x301) + " Garcia"; // e + combining acute
    expect(slugify(accented)).toBe("jose-garcia");
    expect(slugify("  @weird__name  ")).toBe("weird-name");
    expect(slugify("!!!")).toBe("untitled");
  });

  it("mints a de-collided id when the slug is taken", () => {
    const sb = base();
    expect(mintPersonId(sb.people, "Sarah Chen")).toBe("sarah-chen-2");
    expect(mintPersonId(sb.people, "Anya Gupta")).toBe("anya-gupta");
  });
});
