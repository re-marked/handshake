import { describe, it, expect } from "vitest";
import { renderReport } from "../debug";
import { DEFAULT_SETTINGS } from "@/vault/settings";

const data = {
  when: "2026-06-01T12:00:00.000Z",
  reason: "manual",
  version: "0.8.0",
  build: "v0.8.0 · abc1234 · built …",
  platform: "test-agent",
  status: "ready",
  vault: "/vault",
  counts: { people: 3, handshakes: 2, goals: 1, interactions: 0 },
  self: "mark",
  openPersonId: null,
  deletingId: null,
  lastSnapshot: { id: "abcdef0", time: 1_717_200_000 },
  tmError: null,
  undo: { undo: 2, redo: 0 },
  workspace: {
    layoutMode: "tabs",
    activeLeafId: "L1",
    floats: 0,
    leaves: [{ id: "L1", active: true, tabs: ["board:main", "person:mark"] }],
  },
  settings: DEFAULT_SETTINGS,
  problems: [],
  events: [{ t: 1_717_200_000_000, kind: "commit", summary: "updatePerson mark" }],
  errors: [],
};

describe("renderReport", () => {
  it("includes the key sections + a JSON appendix", () => {
    const md = renderReport(data);
    expect(md).toContain("# Handshake debug report");
    expect(md).toContain("people **3**");
    expect(md).toContain("undo depth: 2");
    expect(md).toContain("board:main, person:mark");
    expect(md).toContain("Recent events (1)");
    expect(md).toContain("updatePerson mark");
    expect(md).toContain("```json");
  });

  it("surfaces a Time Machine error when present", () => {
    expect(renderReport({ ...data, tmError: "boom" })).toContain("Time Machine error:** boom");
  });

  it("notes when no errors were captured", () => {
    expect(renderReport(data)).toContain("_none captured_");
  });
});
