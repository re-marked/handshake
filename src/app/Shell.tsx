import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { NavRail } from "@/app/NavRail";
import { PersonPanel } from "@/app/PersonPanel";
import { CommandPalette } from "@/app/CommandPalette";
import { BoardView } from "@/board/BoardView";
import { GoalsView } from "@/views/GoalsView";
import { PeopleView } from "@/views/PeopleView";

/** The app frame: nav rail + the main area (the board). Right region + palette land later. */
export function Shell() {
  const status = useApp((s) => s.status);
  const error = useApp((s) => s.error);
  const view = useApp((s) => s.view);

  if (status === "error") {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }
  if (status !== "ready") {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        Loading vault…
      </div>
    );
  }
  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      <NavRail />
      <main className="relative min-w-0 flex-1 overflow-hidden">
        <div className={cn("absolute inset-0", view !== "board" && "hidden")}>
          <BoardView />
        </div>
        {view === "goals" && (
          <div className="absolute inset-0">
            <GoalsView />
          </div>
        )}
        {view === "people" && (
          <div className="absolute inset-0">
            <PeopleView />
          </div>
        )}
        <PersonPanel />
      </main>
      <CommandPalette />
    </div>
  );
}
