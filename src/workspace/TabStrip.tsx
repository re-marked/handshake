import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { tabLabel, viewKey, type Leaf } from "@/workspace/model";
import { TabLauncher } from "@/workspace/TabLauncher";

/** A browser-style tab bar for one leaf. Board is pinned (un-closable). */
export function TabStrip({ leaf }: { leaf: Leaf }) {
  const people = useApp((s) => s.switchboard.people);
  const setActiveTab = useApp((s) => s.setActiveTab);
  const closeTab = useApp((s) => s.closeTab);
  const nameOf = (id: string) => people.get(id)?.name;

  return (
    <div className="flex h-9 shrink-0 items-center gap-1 overflow-x-auto border-b bg-card px-2">
      {leaf.tabs.map((view, i) => {
        const key = viewKey(view);
        const active = i === leaf.activeIndex;
        const closable = view.type !== "board";
        return (
          <div
            key={key}
            className={cn(
              "group/tab flex h-7 shrink-0 items-center gap-1 rounded-md pl-2.5 pr-1 text-sm transition-colors",
              active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50",
            )}
          >
            <button className="max-w-44 truncate" onClick={() => setActiveTab(leaf.id, key)}>
              {tabLabel(view, nameOf)}
            </button>
            {closable && (
              <button
                aria-label="Close tab"
                onClick={() => closeTab(leaf.id, key)}
                className="rounded p-0.5 text-muted-foreground opacity-0 transition group-hover/tab:opacity-100 hover:bg-background hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        );
      })}
      <TabLauncher leafId={leaf.id} />
    </div>
  );
}
