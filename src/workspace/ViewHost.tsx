import { ScrollArea } from "@/components/ui/scroll-area";
import { BoardView } from "@/board/BoardView";
import { PeopleView } from "@/views/PeopleView";
import { GoalsView } from "@/views/GoalsView";
import { PersonView } from "@/views/PersonView";
import type { View } from "@/workspace/model";

/** Renders a View into whatever container holds it (a tab, a split pane, a float). */
export function ViewHost({ view }: { view: View }) {
  switch (view.type) {
    case "board":
      return <BoardView />;
    case "people":
      return <PeopleView />;
    case "goals":
      return <GoalsView />;
    case "person":
      return (
        <ScrollArea className="h-full w-full">
          <div className="mx-auto max-w-2xl px-8 py-7">
            <PersonView id={view.id} />
          </div>
        </ScrollArea>
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
