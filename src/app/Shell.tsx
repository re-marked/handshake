import { useApp } from "@/app/store";
import { NavRail } from "@/app/NavRail";
import { PersonPanel } from "@/app/PersonPanel";
import { CommandPalette } from "@/app/CommandPalette";
import { NetworkSwitcher } from "@/app/NetworkSwitcher";
import { WorkspaceBoundary } from "@/app/WorkspaceBoundary";
import { WorkspaceRenderer } from "@/workspace/WorkspaceRenderer";
import { FloatingLayer } from "@/workspace/FloatingLayer";
import { TabDragGhost } from "@/workspace/TabDragGhost";

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
    <div className="flex h-full w-full flex-col overflow-hidden bg-background text-foreground">
      {/* App top bar — the network switcher lives top-left. */}
      <header className="flex h-9 shrink-0 items-center border-b border-border bg-card px-1.5">
        <NetworkSwitcher />
      </header>
      <div className="flex min-h-0 flex-1">
        <NavRail />
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="relative min-h-0 flex-1">
            <WorkspaceBoundary>
              <WorkspaceRenderer node={root} />
            </WorkspaceBoundary>
            <FloatingLayer />
          </div>
          <PersonPanel />
        </main>
      </div>
      <CommandPalette />
      <TabDragGhost />
    </div>
  );
}
