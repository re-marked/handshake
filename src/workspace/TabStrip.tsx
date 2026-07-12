import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Search, Settings, Share2, Target, User, Users, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { tabLabel, viewKey, type Leaf, type View } from "@/workspace/model";
import { leaves, type DropSide } from "@/workspace/ops";
import { STRIP_H, zoneAt } from "@/workspace/dropZone";
import { dragX, dragY } from "@/workspace/tabDragMotion";
import { TabLauncher } from "@/workspace/TabLauncher";
import { NetworkSwitcher } from "@/app/NetworkSwitcher";

const TAB_SPRING = { type: "spring", stiffness: 520, damping: 40 } as const;
const DRAG_THRESHOLD = 5; // px before a press becomes a drag (vs a click)
const ICON_ONLY_BELOW = 112; // when each tab would get less room than this, collapse to icon-only

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

/** elementFromPoint → the leaf under the cursor + drop zone. Over a strip, also the insertion slot
 *  (which gap between tabs the cursor sits in) so a drop can reorder / land precisely. */
function hitTest(x: number, y: number): { leafId: string; side: DropSide; index?: number } | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  const leafEl = el?.closest<HTMLElement>("[data-leaf-id]");
  if (!leafEl?.dataset.leafId) return null;
  const rect = leafEl.getBoundingClientRect();
  const side = zoneAt(rect, x, y);
  if (side === "center" && y - rect.top < STRIP_H) {
    const tabEls = [...leafEl.querySelectorAll<HTMLElement>("[data-tab-key]")];
    let index = tabEls.length;
    for (let i = 0; i < tabEls.length; i++) {
      const r = tabEls[i].getBoundingClientRect();
      if (x < r.left + r.width / 2) {
        index = i;
        break;
      }
    }
    return { leafId: leafEl.dataset.leafId, side, index };
  }
  return { leafId: leafEl.dataset.leafId, side };
}

/** Track an element's width (the tab region) so we can decide when to collapse tabs to icon-only. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** A thin rose insertion bar shown between tabs while dragging, marking where the tab will land. */
function Caret() {
  return <div className="h-6 w-0.5 shrink-0 self-center rounded-full bg-primary" />;
}

/** A browser-style tab bar for one leaf: tabs shrink as they multiply and collapse to icon-only when
 *  cramped; drag to reorder within the strip, between panes, or to an edge to split. */
export function TabStrip({ leaf }: { leaf: Leaf }) {
  const people = useApp((s) => s.switchboard.people);
  const photos = useApp((s) => s.photos);
  const setActiveTab = useApp((s) => s.setActiveTab);
  const closeTab = useApp((s) => s.closeTab);
  const tabDrag = useApp((s) => s.tabDrag);
  const tabDragOver = useApp((s) => s.tabDragOver);
  // The network switcher rides the far right of the browser tab nav (after the +) – only on the
  // last (rightmost) pane's strip, so it shows exactly once even when the workspace is split.
  const isLastLeaf = useApp((s) => {
    const ls = leaves(s.workspace.root);
    return ls[ls.length - 1]?.id === leaf.id;
  });
  const nameOf = (id: string) => people.get(id)?.name;

  const [tabsRef, tabsW] = useWidth<HTMLDivElement>();
  const iconOnly = tabsW > 0 && tabsW / leaf.tabs.length < ICON_ONLY_BELOW;
  const caretIndex =
    tabDragOver?.leafId === leaf.id && tabDragOver.side === "center" && tabDragOver.index != null
      ? tabDragOver.index
      : null;

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
    if (over) useApp.getState().dropTab(over.leafId, over.side, over.index);
    else useApp.getState().endTabDrag();
  }

  function onPointerCancel(e: React.PointerEvent) {
    const d = drag.current;
    drag.current = null;
    endDrag(e);
    if (d?.started) useApp.getState().endTabDrag();
  }

  function renderTab(view: View, i: number) {
    const key = viewKey(view);
    const active = i === leaf.activeIndex;
    const dragging = tabDrag?.srcLeafId === leaf.id && tabDrag?.key === key;
    const label = tabLabel(view, nameOf);
    const photo = view.type === "person" ? photos.get(view.id) : undefined;
    return (
      <div
        key={key}
        data-tab-key={key}
        role="button"
        tabIndex={0}
        title={label}
        onPointerDown={(e) => onPointerDown(e, key)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setActiveTab(leaf.id, key);
        }}
        className={cn(
          "group/tab relative flex h-8 cursor-pointer touch-none select-none items-center rounded-lg text-sm outline-none transition-colors",
          iconOnly ? "w-9 shrink-0 justify-center" : "min-w-0 max-w-[200px] flex-[0_1_auto] gap-2 pl-2.5 pr-1.5",
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
        {iconOnly ? (
          <>
            <span className="relative z-10">
              <TabIcon view={view} photo={photo} />
            </span>
            {/* Small corner X on hover: clicking it closes; clicking the rest of the tab activates. */}
            <button
              type="button"
              data-no-tab-drag
              aria-label="Close tab"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(leaf.id, key);
              }}
              className="absolute right-0.5 top-0.5 z-20 grid size-4 place-items-center rounded-full bg-card text-muted-foreground/70 opacity-0 shadow-sm ring-1 ring-border transition hover:text-foreground group-hover/tab:opacity-100"
            >
              <X className="size-2.5" />
            </button>
          </>
        ) : (
          <>
            <span className="relative z-10 flex min-w-0 items-center gap-2">
              <TabIcon view={view} photo={photo} />
              <span className="truncate">{label}</span>
            </span>
            <button
              type="button"
              data-no-tab-drag
              aria-label="Close tab"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(leaf.id, key);
              }}
              className="relative z-10 -mr-0.5 grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground/60 transition hover:bg-background hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </>
        )}
      </div>
    );
  }

  // Interleave the drop caret at the hovered insertion slot.
  const items: React.ReactNode[] = [];
  leaf.tabs.forEach((view, i) => {
    if (caretIndex === i) items.push(<Caret key="drop-caret" />);
    items.push(renderTab(view, i));
  });
  if (caretIndex === leaf.tabs.length) items.push(<Caret key="drop-caret-end" />);

  return (
    <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-card px-2">
      <div
        ref={tabsRef}
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items}
      </div>
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
