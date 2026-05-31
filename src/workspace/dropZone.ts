import type { DropSide } from "@/workspace/ops";

export const STRIP_H = 44; // the tab strip (h-11) reads as "move into this leaf", not a split zone

/** Which zone a point is in over a leaf rect: over the tab strip or body center → move; within
 *  25% of a body edge → split on that edge. */
export function zoneAt(rect: DOMRect, x: number, y: number): DropSide {
  if (y - rect.top < STRIP_H) return "center"; // over the tab bar → move into this leaf
  const bodyTop = rect.top + STRIP_H;
  const fx = (x - rect.left) / Math.max(1, rect.width);
  const fy = (y - bodyTop) / Math.max(1, rect.bottom - bodyTop);
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

/** Tailwind classes positioning the drop highlight for each zone within a leaf. */
export const ZONE_CLASS: Record<DropSide, string> = {
  center: "inset-0",
  left: "inset-y-0 left-0 w-1/2",
  right: "inset-y-0 right-0 w-1/2",
  top: "inset-x-0 top-0 h-1/2",
  bottom: "inset-x-0 bottom-0 h-1/2",
};
