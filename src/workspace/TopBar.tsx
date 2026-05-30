import { motion } from "motion/react";
import { Search, Settings, Share2, Target, User, Users, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { tabLabel, viewKey, type View } from "@/workspace/model";
import { activeView } from "@/workspace/ops";
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

/**
 * The one and only top bar: every open page is a tab here (browser-style). Clicking a tab
 * shows it in the focused pane; the rose-muted highlight glides to the active page. The
 * panes below have no bars of their own.
 */
export function TopBar() {
  const tabs = useApp((s) => s.workspace.tabs);
  const activeKey = useApp((s) => {
    const v = activeView(s.workspace);
    return v ? viewKey(v) : null;
  });
  const people = useApp((s) => s.switchboard.people);
  const photos = useApp((s) => s.photos);
  const selectTab = useApp((s) => s.selectTab);
  const closeTab = useApp((s) => s.closeTab);
  const nameOf = (id: string) => people.get(id)?.name;

  return (
    <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-card px-2">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {tabs.map((view) => {
          const key = viewKey(view);
          const active = key === activeKey;
          const closable = !(view.type === "board" && view.id === "main");
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => selectTab(key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") selectTab(key);
              }}
              className={cn(
                "group/tab relative flex h-8 shrink-0 cursor-pointer select-none items-center gap-2 rounded-lg pl-2.5 pr-2 text-sm outline-none transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="workspace-tab-hl"
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
                    closeTab(key);
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
      <TabLauncher mode="split" />
      <TabLauncher />
    </div>
  );
}
