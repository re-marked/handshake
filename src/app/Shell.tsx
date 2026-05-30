import { useApp } from "@/app/store";
import { NavRail } from "@/app/NavRail";
import { PersonPanel } from "@/app/PersonPanel";
import { CommandPalette } from "@/app/CommandPalette";
import { WorkspaceBoundary } from "@/app/WorkspaceBoundary";
import { WorkspaceRenderer } from "@/workspace/WorkspaceRenderer";

/** The app frame: nav rail + the docked workspace (tabs/splits) + the slide-in note + palette. */
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
      <main className="relative min-w-0 flex-1 overflow-hidden">
        <WorkspaceBoundary>
          <WorkspaceRenderer node={root} />
        </WorkspaceBoundary>
        <PersonPanel />
      </main>
      <CommandPalette />
    </div>
  );
}
