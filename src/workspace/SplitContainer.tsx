import { type ReactNode } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useApp } from "@/app/store";
import type { Split } from "@/workspace/model";
import { WorkspaceRenderer } from "@/workspace/WorkspaceRenderer";

/**
 * A split node rendered as a shadcn Resizable group. The lib owns the live drag; we mirror
 * its layout (percentages → fractions) into the model on change so it persists. Children are
 * a flat panel/handle array (react-resizable-panels registers by child position, not Fragments).
 */
export function SplitContainer({ split, simple = false }: { split: Split; simple?: boolean }) {
  const resizeSplit = useApp((s) => s.resizeSplit);

  const children: ReactNode[] = [];
  split.children.forEach((child, i) => {
    if (i > 0) children.push(<ResizableHandle key={`handle-${child.id}`} withHandle />);
    children.push(
      <ResizablePanel
        key={child.id}
        id={child.id}
        order={i}
        defaultSize={(split.sizes[i] ?? 1 / split.children.length) * 100}
        minSize={15}
      >
        <WorkspaceRenderer node={child} simple={simple} />
      </ResizablePanel>,
    );
  });

  return (
    <ResizablePanelGroup
      id={split.id}
      direction={split.dir === "row" ? "horizontal" : "vertical"}
      onLayout={(sizes) => resizeSplit(split.id, sizes.map((p) => p / 100))}
      className="h-full w-full"
    >
      {children}
    </ResizablePanelGroup>
  );
}
