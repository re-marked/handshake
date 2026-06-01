import { useApp } from "@/app/store";
import { NavRail } from "@/app/NavRail";
import { PersonPanel } from "@/app/PersonPanel";
import { CommandPalette } from "@/app/CommandPalette";
import { WorkspaceBoundary } from "@/app/WorkspaceBoundary";
import { WorkspaceRenderer } from "@/workspace/WorkspaceRenderer";
import { FloatingLayer } from "@/workspace/FloatingLayer";
import { TabDragGhost } from "@/workspace/TabDragGhost";
import { LastSnapshot } from "@/app/LastSnapshot";

// Will become a Developer Settings toggle; hardcoded off for now (the rail's info popover shows
// the same last-snapshot info on demand instead).
const SHOW_STATUS_LINE = false;

/** The app frame: nav rail + the workspace tree (per-pane tabs) + the slide-in note + palette. */
export function Shell() {
  const status = useApp((s) => s.status);
  const error = useApp((s) => s.error);
  const root = useApp((s) => s.workspace.root);

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
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative min-h-0 flex-1">
          <WorkspaceBoundary>
            <WorkspaceRenderer node={root} />
          </WorkspaceBoundary>
          <FloatingLayer />
          {/* Ambient status line (last snapshot, in the board corner). Off for now — too busy for
              everyday use; the Developer Settings toggle (coming) will let users turn it back on. */}
          {SHOW_STATUS_LINE && (
            <div className="pointer-events-none absolute bottom-1.5 left-2.5 z-10 max-w-[min(60%,32rem)] truncate">
              <LastSnapshot />
            </div>
          )}
        </div>
        <PersonPanel />
      </main>
      <CommandPalette />
      <TabDragGhost />
    </div>
  );
}
