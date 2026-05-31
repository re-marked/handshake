import { useApp } from "@/app/store";
import { NavRail } from "@/app/NavRail";
import { PersonPanel } from "@/app/PersonPanel";
import { CommandPalette } from "@/app/CommandPalette";
import { WorkspaceBoundary } from "@/app/WorkspaceBoundary";
import { TopBar } from "@/workspace/TopBar";
import { WorkspaceRenderer } from "@/workspace/WorkspaceRenderer";
import { FloatingLayer } from "@/workspace/FloatingLayer";

/** The app frame: nav rail + the workspace tree (per-pane tabs, or one top bar in simple mode)
 *  + the slide-in note + palette. */
export function Shell() {
  const status = useApp((s) => s.status);
  const error = useApp((s) => s.error);
  const root = useApp((s) => s.workspace.root);
  const mode = useApp((s) => s.workspace.layoutMode);

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
        {mode === "simple" && <TopBar />}
        <div className="relative min-h-0 flex-1">
          <WorkspaceBoundary>
            <WorkspaceRenderer node={root} simple={mode === "simple"} />
          </WorkspaceBoundary>
          <FloatingLayer />
        </div>
        <PersonPanel />
      </main>
      <CommandPalette />
    </div>
  );
}
