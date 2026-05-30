import { describe, expect, it } from "vitest";
import { buildSwitchboard } from "@/switchboard";
import { loadFixtureVault } from "@/switchboard/__tests__/fixtures";
import { buildBoardModel } from "@/board/tree";

describe("buildBoardModel", () => {
  const sb = buildSwitchboard(loadFixtureVault());
  const model = buildBoardModel(sb, new Date("2026-05-29"));

  it("roots the tree at self; nests indirect contacts under their connector", () => {
    expect(model.parentOf.get("self")).toBeNull();
    expect(model.parentOf.get("sarah-chen")).toBe("self"); // directly connected
    expect(model.parentOf.get("tom-okonkwo")).toBe("self"); // directly connected
    expect(model.parentOf.get("james-liu")).toBe("tom-okonkwo"); // reached only via Tom
  });

  it("lists children", () => {
    expect(model.childrenOf.get("self")).toEqual(["sarah-chen", "tom-okonkwo"]);
    expect(model.childrenOf.get("tom-okonkwo")).toEqual(["james-liu"]);
  });

  it("marks hierarchy edges vs cross-links", () => {
    const key = (l: { a: string; b: string }) => [l.a, l.b].sort().join("|");
    const selfTom = model.links.find((l) => key(l) === "self|tom-okonkwo")!;
    const sarahTom = model.links.find((l) => key(l) === "sarah-chen|tom-okonkwo")!;
    expect(selfTom.treeEdge).toBe(true);
    expect(sarahTom.treeEdge).toBe(false); // both hang off self → a cross-link, not hierarchy
  });

  it("gives every card a position, self at the center", () => {
    expect(model.positions.size).toBe(4);
    const self = model.positions.get("self")!;
    expect(self.x).toBeCloseTo(0);
    expect(self.y).toBeCloseTo(0);
  });
});
