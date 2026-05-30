import { cn } from "@/lib/utils";
import { viewKey, type Leaf as LeafNode } from "@/workspace/model";
import { TabStrip } from "@/workspace/TabStrip";
import { ViewHost } from "@/workspace/ViewHost";

/**
 * A tabbed pane. All tabs stay mounted (hidden when inactive) so heavy views —
 * the board especially — keep their state across tab switches; the active one shows.
 */
export function Leaf({ leaf }: { leaf: LeafNode }) {
  return (
    <div className="flex h-full w-full flex-col">
      <TabStrip leaf={leaf} />
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
