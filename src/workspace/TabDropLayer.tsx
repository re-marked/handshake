import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import type { DropSide } from "@/workspace/ops";

const ZONE_CLASS: Record<DropSide, string> = {
  center: "inset-0",
  left: "inset-y-0 left-0 w-1/2",
  right: "inset-y-0 right-0 w-1/2",
  top: "inset-x-0 top-0 h-1/2",
  bottom: "inset-x-0 bottom-0 h-1/2",
};

const STRIP_H = 44; // the tab strip (h-11) reads as "move into this leaf", not a split zone

/** Which zone the cursor is in: over the tab strip or the body center → move; within 25% of a
 *  body edge → split on that edge. */
function zoneAt(el: HTMLElement, clientX: number, clientY: number): DropSide {
  const r = el.getBoundingClientRect();
  if (clientY - r.top < STRIP_H) return "center"; // dropping on the tab bar moves it in
  const bodyTop = r.top + STRIP_H;
  const fx = (clientX - r.left) / Math.max(1, r.width);
  const fy = (clientY - bodyTop) / Math.max(1, r.bottom - bodyTop);
  const dl = fx;
  const dr = 1 - fx;
  const dt = fy;
  const db = 1 - fy;
  const min = Math.min(dl, dr, dt, db);
  if (min > 0.25) return "center";
  if (min === dl) return "left";
  if (min === dr) return "right";
  if (min === dt) return "top";
  return "bottom";
}

/**
 * The drop overlay shown over a leaf while a tab is being dragged. The cursor's position picks a
 * zone: center → move the tab into this leaf; an edge → split here with the tab in a new pane on
 * that side. Mounted only during a drag (the store's `tabDrag`), so it never blocks normal use.
 */
export function TabDropLayer({ leafId }: { leafId: string }) {
  const [zone, setZone] = useState<DropSide | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-10"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (ref.current) setZone(zoneAt(ref.current, e.clientX, e.clientY));
      }}
      onDragLeave={() => setZone(null)}
      onDrop={(e) => {
        e.preventDefault();
        const side = ref.current ? zoneAt(ref.current, e.clientX, e.clientY) : "center";
        useApp.getState().dropTab(leafId, side);
        setZone(null);
      }}
    >
      {zone && (
        <div
          className={cn(
            "pointer-events-none absolute rounded-md bg-primary/20 ring-2 ring-inset ring-primary/60 transition-all duration-100",
            ZONE_CLASS[zone],
          )}
        />
      )}
    </div>
  );
}
