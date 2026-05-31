import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { viewKey, type Leaf as LeafNode } from "@/workspace/model";
import { leaves } from "@/workspace/ops";
import { TabStrip } from "@/workspace/TabStrip";
import { ViewHost } from "@/workspace/ViewHost";

/** Shown when a leaf has no open tabs (you closed them all, board included). */
function EmptyLeaf() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-8 text-center">
      <p className="max-w-xs text-sm text-muted-foreground">
        You find yourself in a weird place. No tabs are open.
      </p>
      <Button variant="outline" size="sm" onClick={() => useApp.getState().focusBoard()}>
        <Share2 /> Open board
      </Button>
    </div>
  );
}

/**
 * A tabbed pane. All tabs stay mounted (hidden when inactive) so heavy views — the board
 * especially — keep their state across tab switches. An empty leaf (every tab closed) shows
 * the "weird place" state with a way back to the board.
 */
export function Leaf({ leaf }: { leaf: LeafNode }) {
  const active = useApp((s) => s.workspace.activeLeafId === leaf.id);
  const tiled = useApp((s) => leaves(s.workspace.root).length > 1);
  const empty = leaf.tabs.length === 0;

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
      {!empty && <TabStrip leaf={leaf} />}
      <div className="relative min-h-0 flex-1">
        {empty ? (
          <EmptyLeaf />
        ) : (
          leaf.tabs.map((view, i) => (
            <div key={viewKey(view)} className={cn("absolute inset-0", i !== leaf.activeIndex && "hidden")}>
              <ViewHost view={view} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
