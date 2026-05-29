import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEntity, serializeEntity } from "../index";

const vaultDir = fileURLToPath(new URL("./fixtures/vault/", import.meta.url));

const relpaths = readdirSync(vaultDir, { recursive: true })
  .map((p) => String(p).replaceAll("\\", "/")) // normalize Windows backslashes
  .filter((p) => p.endsWith(".md"))
  .sort();

describe("fixture vault round-trips", () => {
  it("found the fixture files", () => {
    expect(relpaths.length).toBeGreaterThanOrEqual(12);
  });

  describe.each(relpaths)("%s", (rel) => {
    const text = readFileSync(vaultDir + rel, "utf8");

    it("parses cleanly", () => {
      const r = parseEntity(rel, text);
      if (!r.ok) throw new Error(`${rel}: ${r.problem.message}`);
      expect(r.entity.id).toBeTruthy();
      expect(r.warnings).toHaveLength(0);
    });

    it("round-trips parse → serialize → parse to an identical entity", () => {
      const r1 = parseEntity(rel, text);
      if (!r1.ok) throw new Error(r1.problem.message);
      const r2 = parseEntity(rel, serializeEntity(r1.entity));
      if (!r2.ok) throw new Error(r2.problem.message);
      expect(r2.entity).toEqual(r1.entity);
    });

    it("serializes stably (re-serialize is byte-identical)", () => {
      const r1 = parseEntity(rel, text);
      if (!r1.ok) throw new Error(r1.problem.message);
      const once = serializeEntity(r1.entity);
      const r2 = parseEntity(rel, once);
      if (!r2.ok) throw new Error(r2.problem.message);
      expect(serializeEntity(r2.entity)).toBe(once);
    });
  });
});
