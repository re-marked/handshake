import { type ReactNode } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { panes } from "@/workspace/ops";
import { type Pane, type PaneNode } from "@/workspace/model";
import { ViewHost } from "@/workspace/ViewHost";

/** Renders the pane tiling: a single pane, or a recursive resizable split of panes. */
export function PaneRenderer({ node }: { node: PaneNode }) {
  const resizeSplit = useApp((s) => s.resizeSplit);
  if (node.kind === "pane") return <PaneHost pane={node} />;

  const children: ReactNode[] = [];
  node.children.forEach((child, i) => {
    if (i > 0) children.push(<ResizableHandle key={`handle-${child.id}`} withHandle />);
    children.push(
      <ResizablePanel
        key={child.id}
        id={child.id}
        order={i}
        defaultSize={(node.sizes[i] ?? 1 / node.children.length) * 100}
        minSize={15}
      >
        <PaneRenderer node={child} />
      </ResizablePanel>,
    );
  });

  return (
    <ResizablePanelGroup
      id={node.id}
      direction={node.dir === "row" ? "horizontal" : "vertical"}
      onLayout={(sizes) => resizeSplit(node.id, sizes.map((p) => p / 100))}
      className="h-full w-full"
    >
      {children}
    </ResizablePanelGroup>
  );
}

/** One pane: a bare view, with a focus ring when it's the active pane in a tiling. */
function PaneHost({ pane }: { pane: Pane }) {
  const active = useApp((s) => s.workspace.activePaneId === pane.id);
  const tiled = useApp((s) => panes(s.workspace.layout).length > 1);
  return (
    <div
      className={cn("relative h-full w-full", tiled && active && "ring-1 ring-inset ring-primary/40")}
      onPointerDown={() => {
        if (!active) useApp.getState().setActivePane(pane.id);
      }}
    >
      <ViewHost view={pane.view} />
    </div>
  );
}
