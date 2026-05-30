import { Fragment } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useApp } from "@/app/store";
import type { Split } from "@/workspace/model";
import { WorkspaceRenderer } from "@/workspace/WorkspaceRenderer";

/**
 * A split node rendered as a shadcn Resizable group. The lib owns the live drag; we mirror
 * its layout (percentages → fractions) into the model on every change so it persists.
 */
export function SplitContainer({ split }: { split: Split }) {
  const resizeSplit = useApp((s) => s.resizeSplit);
  return (
    <ResizablePanelGroup
      direction={split.dir === "row" ? "horizontal" : "vertical"}
      onLayout={(sizes) => resizeSplit(split.id, sizes.map((p) => p / 100))}
      className="h-full w-full"
    >
      {split.children.map((child, i) => (
        <Fragment key={child.id}>
          {i > 0 && <ResizableHandle withHandle />}
          <ResizablePanel
            id={child.id}
            order={i}
            defaultSize={(split.sizes[i] ?? 1 / split.children.length) * 100}
            minSize={15}
          >
            <WorkspaceRenderer node={child} />
          </ResizablePanel>
        </Fragment>
      ))}
    </ResizablePanelGroup>
  );
}
