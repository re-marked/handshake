import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { viewKey, type Leaf as LeafNode } from "@/workspace/model";
import { leaves } from "@/workspace/ops";
import { TabStrip } from "@/workspace/TabStrip";
import { ViewHost } from "@/workspace/ViewHost";

/**
 * A tabbed pane. All tabs stay mounted (hidden when inactive) so heavy views — the board
 * especially — keep their state across tab switches. In `simple` mode the per-leaf strip is
 * hidden (the single TopBar renders the active leaf's tabs instead); the leaf still gets the
 * focus ring + click-to-focus so the top bar can follow it.
 */
export function Leaf({ leaf, simple = false }: { leaf: LeafNode; simple?: boolean }) {
  const active = useApp((s) => s.workspace.activeLeafId === leaf.id);
  const tiled = useApp((s) => leaves(s.workspace.root).length > 1);

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col",
        tiled && active && "rounded-sm ring-1 ring-inset ring-primary/40",
      )}
      onPointerDown={() => {
        if (!active) useApp.getState().setActiveLeaf(leaf.id);
      }}
    >
      {!simple && <TabStrip leaf={leaf} />}
      <div className="relative min-h-0 flex-1">
        {leaf.tabs.map((view, i) => (
          <div key={viewKey(view)} className={cn("absolute inset-0", i !== leaf.activeIndex && "hidden")}>
            <ViewHost view={view} />
          </div>
        ))}
      </div>
    </div>
  );
}
