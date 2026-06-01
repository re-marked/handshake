import { describe, expect, it } from "vitest";
import {
  affiliationLabel,
  affiliationTerms,
  parseEntity,
  primaryAffiliation,
  pruneAffiliations,
  serializeEntity,
  summarizeAffiliations,
  type Person,
} from "../index";

function person(over: Partial<Person> = {}): Person {
  return {
    kind: "person",
    id: "p",
    name: "P",
    isSelf: false,
    tags: [],
    affiliations: [],
    handles: {},
    body: "",
    ...over,
  };
}

describe("affiliation parsing (back-compat)", () => {
  it("reads legacy flat role/company into a single affiliation", () => {
    const r = parseEntity("people/p.md", "---\nname: P\nrole: Partner\ncompany: Base Case\n---\n");
    if (!r.ok) throw new Error(r.problem.message);
    expect((r.entity as Person).affiliations).toEqual([{ role: "Partner", company: "Base Case" }]);
  });

  it("reads role-only and company-only legacy fields", () => {
    const r1 = parseEntity("people/p.md", "---\nname: P\nrole: Founder\n---\n");
    const r2 = parseEntity("people/p.md", "---\nname: P\ncompany: Acme\n---\n");
    if (!r1.ok || !r2.ok) throw new Error("parse failed");
    expect((r1.entity as Person).affiliations).toEqual([{ role: "Founder" }]);
    expect((r2.entity as Person).affiliations).toEqual([{ company: "Acme" }]);
  });

  it("reads the new affiliations list and drops empty entries", () => {
    const text =
      "---\nname: P\naffiliations:\n  - role: Founder\n    company: Acme\n  - role: Advisor\n    company: Beta\n  - {}\n---\n";
    const r = parseEntity("people/p.md", text);
    if (!r.ok) throw new Error(r.problem.message);
    expect((r.entity as Person).affiliations).toEqual([
      { role: "Founder", company: "Acme" },
      { role: "Advisor", company: "Beta" },
    ]);
  });

  it("prefers the affiliations list over stray legacy fields", () => {
    const text = "---\nname: P\nrole: Ignored\naffiliations:\n  - role: Real\n---\n";
    const r = parseEntity("people/p.md", text);
    if (!r.ok) throw new Error(r.problem.message);
    expect((r.entity as Person).affiliations).toEqual([{ role: "Real" }]);
  });

  it("yields [] when there's no role/company at all", () => {
    const r = parseEntity("people/p.md", "---\nname: P\n---\n");
    if (!r.ok) throw new Error(r.problem.message);
    expect((r.entity as Person).affiliations).toEqual([]);
  });
});

describe("affiliation serialization", () => {
  it("writes a single affiliation as flat role/company (byte-identical to the legacy shape)", () => {
    const text = serializeEntity(person({ affiliations: [{ role: "Partner", company: "Base Case" }] }));
    expect(text).toContain("role: Partner");
    expect(text).toContain("company: Base Case");
    expect(text).not.toContain("affiliations:");
  });

  it("writes two or more affiliations as an affiliations list", () => {
    const text = serializeEntity(
      person({ affiliations: [{ role: "Founder", company: "Acme" }, { role: "Advisor", company: "Beta" }] }),
    );
    expect(text).toContain("affiliations:");
    expect(text).not.toMatch(/^role:/m);
  });

  it("omits all affiliation keys when there are none", () => {
    const text = serializeEntity(person({ affiliations: [] }));
    expect(text).not.toContain("role:");
    expect(text).not.toContain("company:");
    expect(text).not.toContain("affiliations:");
  });

  it("round-trips a multi-affiliation person", () => {
    const p = person({ affiliations: [{ role: "Founder", company: "Acme" }, { company: "Beta" }] });
    const r = parseEntity("people/p.md", serializeEntity(p));
    if (!r.ok) throw new Error(r.problem.message);
    expect((r.entity as Person).affiliations).toEqual(p.affiliations);
  });
});

describe("affiliation display helpers", () => {
  it("labels one affiliation with a middot, omitting blanks", () => {
    expect(affiliationLabel({ role: "Head of Growth", company: "Linear" })).toBe("Head of Growth · Linear");
    expect(affiliationLabel({ role: "Founder" })).toBe("Founder");
    expect(affiliationLabel(undefined)).toBe("");
  });

  it("summarizes multiple affiliations with a bullet", () => {
    expect(summarizeAffiliations([{ role: "Founder", company: "Acme" }, { company: "Beta" }])).toBe(
      "Founder · Acme • Beta",
    );
    expect(summarizeAffiliations([])).toBe("");
  });

  it("primaryAffiliation is the first", () => {
    expect(primaryAffiliation(person({ affiliations: [{ role: "A" }, { role: "B" }] }))?.role).toBe("A");
    expect(primaryAffiliation(person())).toBeUndefined();
  });

  it("prunes blank rows and trims fields", () => {
    expect(pruneAffiliations([{ role: "  Founder  " }, {}, { company: "" }])).toEqual([{ role: "Founder" }]);
  });

  it("collects every role and company as search terms", () => {
    expect(affiliationTerms([{ role: "Founder", company: "Acme" }, { company: "Beta" }])).toEqual([
      "Founder",
      "Acme",
      "Beta",
    ]);
  });
});
