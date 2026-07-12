import { useRef } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/app/store";
import { tabLabel, type FloatingWindow as FloatWin } from "@/workspace/model";
import { TabIcon } from "@/workspace/TabStrip";
import { ViewHost } from "@/workspace/ViewHost";
import { NoteModeSwitch } from "@/workspace/NoteModeSwitch";

const POP = { type: "spring", stiffness: 520, damping: 40 } as const;
const MIN_W = 260;
const MIN_H = 200;

type Drag = { mode: "move" | "resize"; downX: number; downY: number; ox: number; oy: number; ow: number; oh: number };

/**
 * A draggable, resizable in-app window holding a View – the "float" note mode. The whole
 * header is the drag handle; a corner grip resizes; clicking anywhere raises it. Position and
 * size are clamped to the board area (`bounds`) so a window can never be lost off-screen.
 */
export function FloatingWindow({
  float,
  bounds,
  zIndex,
}: {
  float: FloatWin;
  bounds: { w: number; h: number };
  zIndex: number;
}) {
  const { id, view, x, y, w, h } = float;
  const people = useApp((s) => s.switchboard.people);
  const photo = useApp((s) => (view.type === "person" ? s.photos.get(view.id) : undefined));
  const drag = useRef<Drag | null>(null);

  function begin(mode: "move" | "resize", e: React.PointerEvent) {
    e.preventDefault();
    useApp.getState().focusFloat(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { mode, downX: e.clientX, downY: e.clientY, ox: x, oy: y, ow: w, oh: h };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.downX;
    const dy = e.clientY - d.downY;
    if (d.mode === "move") {
      const nx = Math.min(Math.max(0, d.ox + dx), Math.max(0, bounds.w - d.ow));
      const ny = Math.min(Math.max(0, d.oy + dy), Math.max(0, bounds.h - d.oh));
      useApp.getState().moveFloat(id, nx, ny);
    } else {
      const nw = Math.min(Math.max(MIN_W, d.ow + dx), Math.max(MIN_W, bounds.w - d.ox));
      const nh = Math.min(Math.max(MIN_H, d.oh + dy), Math.max(MIN_H, bounds.h - d.oy));
      useApp.getState().resizeFloat(id, nw, nh);
    }
  }

  function onPointerUp() {
    drag.current = null; // pointer capture releases implicitly on pointerup
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12, ease: "easeIn" } }}
      transition={POP}
      style={{ left: x, top: y, width: w, height: h, zIndex }}
      className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-xl border bg-card shadow-2xl"
      onPointerDown={() => useApp.getState().focusFloat(id)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className="flex h-10 shrink-0 cursor-grab select-none items-center justify-between gap-2 border-b px-2.5 active:cursor-grabbing"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
          begin("move", e);
        }}
      >
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <TabIcon view={view} photo={photo} />
          <span className="truncate">{tabLabel(view, (pid) => people.get(pid)?.name)}</span>
        </div>
        <div data-no-drag className="flex items-center gap-1">
          {view.type === "person" && <NoteModeSwitch id={view.id} current="float" />}
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => useApp.getState().closeFloat(id)}>
            <X />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ViewHost view={view} dense />
      </div>

      {/* Corner resize grip */}
      <div
        data-no-drag
        onPointerDown={(e) => {
          e.stopPropagation();
          begin("resize", e);
        }}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
        aria-label="Resize"
      >
        <span className="absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-muted-foreground/40" />
      </div>
    </motion.div>
  );
}
