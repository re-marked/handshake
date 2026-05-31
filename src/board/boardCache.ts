import type { Pos } from "@/board/tree";

/**
 * Per-board live layout (positions + viewport), kept in-memory so a board's arrangement survives
 * a split-remount within a session. Module-level + keyed by boardId. Lives in its own file so the
 * store can clear it on a vault switch without importing BoardView (which would be a cycle).
 * The "main" board also persists to its vault's layout.json; extra boards are session-only.
 */
export type BoardSnapshot = { positions: Map<string, Pos>; pan: Pos; zoom: number };

export const boardCache = new Map<string, BoardSnapshot>();

/** Drop all cached board layouts — call when switching vaults (the old positions belong to a
 *  different network's people and would mis-seed the new one). */
export function clearBoardCache(): void {
  boardCache.clear();
}
