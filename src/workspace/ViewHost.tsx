import { ScrollArea } from "@/components/ui/scroll-area";
import { BoardView } from "@/board/BoardView";
import { PeopleView } from "@/views/PeopleView";
import { GoalsView } from "@/views/GoalsView";
import { PersonView } from "@/views/PersonView";
import { NoteModeSwitch } from "@/workspace/NoteModeSwitch";
import type { View } from "@/workspace/model";

/**
 * Renders a View into whatever container holds it (a tab, a split pane, a float).
 * `dense` tightens the person note's padding for narrow containers (floats).
 */
export function ViewHost({ view, dense = false }: { view: View; dense?: boolean }) {
  switch (view.type) {
    case "board":
      return <BoardView boardId={view.id} />;
    case "people":
      return <PeopleView />;
    case "goals":
      return <GoalsView />;
    case "person":
      return (
        <div className="flex h-full w-full flex-col">
          {/* Tabs/panes have no header of their own, so the note-mode switch rides a slim
              toolbar here. Floats (dense) carry it in their own header instead. */}
          {!dense && (
            <div className="flex h-10 shrink-0 items-center justify-end border-b px-2">
              <NoteModeSwitch id={view.id} current="tab" />
            </div>
          )}
          <ScrollArea className="min-h-0 flex-1">
            {/* Full width in a tab/pane (#9); floats stay compact. */}
            <div className={dense ? "px-3.5 py-3" : "px-8 py-7"}>
              <PersonView id={view.id} />
            </div>
          </ScrollArea>
        </div>
      );
    case "search":
    case "settings":
      return (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          {view.type === "search" ? "Search" : "Settings"} — coming soon
        </div>
      );
  }
}
