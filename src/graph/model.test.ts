import { describe, expect, it } from "vitest";
import { buildSwitchboard } from "@/switchboard";
import { loadFixtureVault } from "@/switchboard/__tests__/fixtures";
import { toGraphModel } from "@/graph/model";

describe("toGraphModel", () => {
  const sb = buildSwitchboard(loadFixtureVault());
  const model = toGraphModel(sb, new Date("2026-05-29"));

  it("maps people to nodes and handshakes to links", () => {
    expect(model.nodes).toHaveLength(4);
    expect(model.links).toHaveLength(4);
    expect(model.nodes.find((n) => n.isSelf)?.id).toBe("self");
  });

  it("scores recency as freshness", () => {
    const sarah = model.nodes.find((n) => n.id === "sarah-chen")!; // dm'd 3 days before `now`
    const self = model.nodes.find((n) => n.id === "self")!; // no interactions logged
    expect(sarah.freshness).toBe(1);
    expect(self.freshness).toBeCloseTo(0.55);
  });

  it("only links people that exist in the vault", () => {
    for (const link of model.links) {
      expect(sb.people.has(link.source as string)).toBe(true);
      expect(sb.people.has(link.target as string)).toBe(true);
    }
  });
});
