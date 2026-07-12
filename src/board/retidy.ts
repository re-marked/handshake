// A tiny registry so non-board UI (the command palette) can trigger a board's "re-tidy" – snapping
// every card back to the automatic radial layout, recorded as one undoable move. Mirrors the board
// applier registry in undo.ts: a mounted BoardView registers its handler; callers look it up by id.

type RetidyFn = () => void;

const registry = new Map<string, RetidyFn>();

export function registerRetidy(boardId: string, fn: RetidyFn): void {
  registry.set(boardId, fn);
}

export function unregisterRetidy(boardId: string): void {
  registry.delete(boardId);
}

/** Re-tidy a board by id. Returns false if no such board is currently mounted. */
export function retidyBoard(boardId: string): boolean {
  const fn = registry.get(boardId);
  if (!fn) return false;
  fn();
  return true;
}

/** Whether a board with this id is mounted (so callers can gate an action on it). */
export function isBoardMounted(boardId: string): boolean {
  return registry.has(boardId);
}
