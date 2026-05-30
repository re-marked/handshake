import { motion } from "motion/react";
import { Search, Settings, Share2, Target, User, Users, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { tabLabel, viewKey, type Leaf, type View } from "@/workspace/model";
import { TabLauncher } from "@/workspace/TabLauncher";

const TAB_SPRING = { type: "spring", stiffness: 520, damping: 40 } as const;

function TabIcon({ view, photo }: { view: View; photo?: string }) {
  if (view.type === "person") {
    return (
      <Avatar className="size-5">
        {photo && <AvatarImage src={photo} alt="" />}
        <AvatarFallback>
          <User className="size-3 text-muted-foreground/70" strokeWidth={2} />
        </AvatarFallback>
      </Avatar>
    );
  }
  const Icon =
    view.type === "board"
      ? Share2
      : view.type === "people"
        ? Users
        : view.type === "goals"
          ? Target
          : view.type === "search"
            ? Search
            : Settings;
  return <Icon className="size-4 shrink-0" strokeWidth={1.75} />;
}

/** A fresh, browser-style tab bar for one leaf: roomy pills, per-tab icons, and a
 *  rose-muted highlight that glides between tabs. Board is pinned (un-closable). */
export function TabStrip({ leaf }: { leaf: Leaf }) {
  const people = useApp((s) => s.switchboard.people);
  const photos = useApp((s) => s.photos);
  const setActiveTab = useApp((s) => s.setActiveTab);
  const closeTab = useApp((s) => s.closeTab);
  const nameOf = (id: string) => people.get(id)?.name;

  return (
    <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-card px-2">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {leaf.tabs.map((view, i) => {
        const key = viewKey(view);
        const active = i === leaf.activeIndex;
        const closable = view.type !== "board";
        return (
          <div
            key={key}
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab(leaf.id, key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setActiveTab(leaf.id, key);
            }}
            className={cn(
              "group/tab relative flex h-8 shrink-0 cursor-pointer select-none items-center gap-2 rounded-lg pl-2.5 pr-2 text-sm outline-none transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-hl-${leaf.id}`}
                transition={TAB_SPRING}
                className="absolute inset-0 rounded-lg bg-muted shadow-sm ring-1 ring-primary/15"
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <TabIcon view={view} photo={view.type === "person" ? photos.get(view.id) : undefined} />
              <span className="max-w-44 truncate">{tabLabel(view, nameOf)}</span>
            </span>
            {closable && (
              <button
                type="button"
                aria-label="Close tab"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(leaf.id, key);
                }}
                className="relative z-10 -mr-0.5 grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground/70 opacity-0 transition hover:bg-background hover:text-foreground group-hover/tab:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        );
        })}
      </div>
      <TabLauncher leafId={leaf.id} />
    </div>
  );
}
