// A View is anything that can occupy a pane, tab, or floating window (see SHELL.md).
// Typed + serializable. New features become new view types + a command that opens them.
export type View =
  | { type: "board" }
  | { type: "person"; id: string }
  | { type: "list"; kind: "people" | "interactions" | "goals" }
  | { type: "search"; query: string }
  | { type: "settings" };

export type OpenTarget = "float" | "tab" | "replaceActive" | "split" | "sidebar";

/** A stable key per logical view (so opening the same person twice doesn't duplicate it). */
export function viewKey(view: View): string {
  switch (view.type) {
    case "person": return `person:${view.id}`;
    case "list": return `list:${view.kind}`;
    case "search": return "search";
    case "settings": return "settings";
    case "board": return "board";
  }
}
