import { useRef } from "react";
import { motion } from "motion/react";
import { Search, Settings, Share2, Target, User, Users, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { tabLabel, viewKey, type Leaf, type View } from "@/workspace/model";
import { leaves, type DropSide } from "@/workspace/ops";
import { zoneAt } from "@/workspace/dropZone";
import { dragX, dragY } from "@/workspace/tabDragMotion";
import { TabLauncher } from "@/workspace/TabLauncher";
import { NetworkSwitcher } from "@/app/NetworkSwitcher";

const TAB_SPRING = { type: "spring", stiffness: 520, damping: 40 } as const;
const DRAG_THRESHOLD = 5; // px before a press becomes a drag (vs a click)

export function TabIcon({ view, photo }: { view: View; photo?: string }) {
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

/** elementFromPoint → the leaf under the cursor + which drop zone, for pointer-drag hit-testing. */
function hitTest(x: number, y: number): { leafId: string; side: DropSide } | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  const leafEl = el?.closest<HTMLElement>("[data-leaf-id]");
  if (!leafEl?.dataset.leafId) return null;
  return { leafId: leafEl.dataset.leafId, side: zoneAt(leafEl.getBoundingClientRect(), x, y) };
}

/** A browser-style tab bar for one leaf: roomy pills, per-tab icons, and a rose-muted highlight
 *  that glides between tabs. Tabs are pointer-draggable between panes (and to an edge to split). */
export function TabStrip({ leaf }: { leaf: Leaf }) {
  const people = useApp((s) => s.switchboard.people);
  const photos = useApp((s) => s.photos);
  const setActiveTab = useApp((s) => s.setActiveTab);
  const closeTab = useApp((s) => s.closeTab);
  const tabDrag = useApp((s) => s.tabDrag);
  // The network switcher rides the far right of the browser tab nav (after the +) — only on the
  // last (rightmost) pane's strip, so it shows exactly once even when the workspace is split.
  const isLastLeaf = useApp((s) => {
    const ls = leaves(s.workspace.root);
    return ls[ls.length - 1]?.id === leaf.id;
  });
  const nameOf = (id: string) => people.get(id)?.name;

  // One drag at a time; track the press so we can tell a click from a drag.
  const drag = useRef<{ x: number; y: number; key: string; started: boolean } | null>(null);

  function onPointerDown(e: React.PointerEvent, key: string) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-no-tab-drag]")) return; // the close button
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, key, started: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    if (!d.started) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < DRAG_THRESHOLD) return;
      d.started = true;
      dragX.set(e.clientX); // seed before the ghost mounts so its spring starts at the cursor
      dragY.set(e.clientY);
      document.body.style.cursor = "grabbing";
      useApp.getState().beginTabDrag(leaf.id, d.key);
    }
    dragX.set(e.clientX);
    dragY.set(e.clientY);
    useApp.getState().setTabDragOver(hitTest(e.clientX, e.clientY));
  }

  function endDrag(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    document.body.style.cursor = "";
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    drag.current = null;
    endDrag(e);
    if (!d) return;
    if (!d.started) {
      setActiveTab(leaf.id, d.key); // never moved → it was a click
      return;
    }
    const over = useApp.getState().tabDragOver;
    if (over) useApp.getState().dropTab(over.leafId, over.side);
    else useApp.getState().endTabDrag();
  }

  function onPointerCancel(e: React.PointerEvent) {
    const d = drag.current;
    drag.current = null;
    endDrag(e);
    if (d?.started) useApp.getState().endTabDrag();
  }

  return (
    <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-card px-2">
      <ScrollArea orientation="horizontal" className="min-w-0 flex-1" viewportClassName="[&>div]:!flex [&>div]:items-center [&>div]:gap-1">
        {leaf.tabs.map((view, i) => {
          const key = viewKey(view);
          const active = i === leaf.activeIndex;
          const dragging = tabDrag?.srcLeafId === leaf.id && tabDrag?.key === key;
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onPointerDown={(e) => onPointerDown(e, key)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setActiveTab(leaf.id, key);
              }}
              className={cn(
                "group/tab relative flex h-8 shrink-0 cursor-pointer touch-none select-none items-center gap-2 rounded-lg pl-2.5 pr-2 text-sm outline-none transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                dragging && "opacity-50",
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
              <button
                type="button"
                data-no-tab-drag
                aria-label="Close tab"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(leaf.id, key);
                }}
                className="relative z-10 -mr-0.5 grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground/70 opacity-0 transition hover:bg-background hover:text-foreground group-hover/tab:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </ScrollArea>
      <TabLauncher leafId={leaf.id} mode="split" />
      <TabLauncher leafId={leaf.id} />
      {isLastLeaf && (
        <>
          <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />
          <NetworkSwitcher />
        </>
      )}
    </div>
  );
}
