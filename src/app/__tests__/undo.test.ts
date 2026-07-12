import { vi, describe, it, expect, beforeEach } from "vitest";
import type { Diff } from "@/switchboard";

// Mock the store so the data undo/redo path calls a spy instead of the real (Tauri) commit.
const { commit } = vi.hoisted(() => ({ commit: vi.fn(async () => ({ ok: true })) }));
vi.mock("@/app/store", () => ({ useApp: { getState: () => ({ commit }) } }));

import * as undo from "../undo";
import type { BoardPatch } from "../undo";

const del = (id: string): Diff => [{ op: "deletePerson", id }];
const create = (id: string): Diff => [
  { op: "createPerson", person: { kind: "person", id, name: id, isSelf: false, tags: [], affiliations: [], handles: {}, body: "" } },
];

beforeEach(() => {
  undo.__test.reset();
  commit.mockClear();
});

describe("undo stack – data", () => {
  it("records a data action and exposes it on the past stack", () => {
    undo.recordData(create("a"), del("a")); // undo=create, redo=delete
    expect(undo.__test.state().past).toHaveLength(1);
    expect(undo.__test.state().future).toHaveLength(0);
  });

  it("ignores an empty inverse", () => {
    undo.recordData([], del("a"));
    expect(undo.__test.state().past).toHaveLength(0);
  });

  it("undo replays the inverse (record:false); redo replays the forward diff", async () => {
    undo.recordData(create("a"), del("a"));
    await undo.undo();
    expect(commit).toHaveBeenLastCalledWith(create("a"), { record: false });
    expect(undo.__test.state()).toMatchObject({ past: [], future: [expect.anything()] });
    await undo.redo();
    expect(commit).toHaveBeenLastCalledWith(del("a"), { record: false });
    expect(undo.__test.state()).toMatchObject({ past: [expect.anything()], future: [] });
  });

  it("a fresh action after an undo clears the redo branch", async () => {
    undo.recordData(create("a"), del("a"));
    await undo.undo();
    expect(undo.__test.state().future).toHaveLength(1);
    undo.recordData(create("b"), del("b"));
    expect(undo.__test.state().future).toHaveLength(0);
  });

  it("caps the history, dropping the oldest", () => {
    for (let i = 0; i < 130; i++) undo.recordData(create(`p${i}`), del(`p${i}`));
    expect(undo.__test.state().past).toHaveLength(100);
  });
});

describe("undo stack – board", () => {
  it("records only a real move and replays before/after through the registered applier", async () => {
    const applied: BoardPatch[] = [];
    undo.registerBoard("main", (patch) => applied.push(patch));

    undo.recordBoardMove("main", { a: { x: 1, y: 1 } }, { a: { x: 1, y: 1 } }); // no move
    expect(undo.__test.state().past).toHaveLength(0);

    undo.recordBoardMove("main", { a: { x: 0, y: 0 } }, { a: { x: 10, y: 5 } });
    expect(undo.__test.state().past).toHaveLength(1);

    await undo.undo();
    expect(applied.at(-1)).toEqual({ a: { x: 0, y: 0 } }); // restored "before"
    await undo.redo();
    expect(applied.at(-1)).toEqual({ a: { x: 10, y: 5 } }); // re-applied "after"
    undo.unregisterBoard("main");
  });
});

describe("undo stack – interleaved", () => {
  it("undoes in strict reverse chronological order across data + board", async () => {
    const applied: BoardPatch[] = [];
    undo.registerBoard("main", (patch) => applied.push(patch));

    undo.recordData(create("a"), del("a")); // 1: data
    undo.recordBoardMove("main", { a: { x: 0, y: 0 } }, { a: { x: 9, y: 9 } }); // 2: board

    await undo.undo(); // most recent = board
    expect(applied).toHaveLength(1);
    expect(commit).not.toHaveBeenCalled();

    await undo.undo(); // then data
    expect(commit).toHaveBeenCalledWith(create("a"), { record: false });
    undo.unregisterBoard("main");
  });
});
