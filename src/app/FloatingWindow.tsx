import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp, type FloatWindow } from "@/app/store";
import { PersonView } from "@/views/PersonView";
import type { View } from "@/app/view";

function ViewBody({ view }: { view: View }) {
  switch (view.type) {
    case "person":
      return <PersonView id={view.id} />;
    default:
      return null; // only person floats in L1
  }
}

/** A content-sized, draggable floating window holding a View. The board stays behind it. */
export function FloatingWindow({ win }: { win: FloatWindow }) {
  const closeFloat = useApp((s) => s.closeFloat);
  const [pos, setPos] = useState({ x: win.x, y: win.y });
  const dragRef = useRef<{ ox: number; oy: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    setPos({ x: e.clientX - dragRef.current.ox, y: e.clientY - dragRef.current.oy });
  }
  function onPointerUp(e: React.PointerEvent) {
    dragRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }

  return (
    <Card
      className="pointer-events-auto fixed z-50 flex max-h-[70vh] w-80 flex-col gap-0 overflow-hidden py-0 shadow-xl"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        className="flex shrink-0 cursor-grab items-center justify-between border-b px-3 py-1.5 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="text-xs text-muted-foreground">Note</span>
        <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={() => closeFloat(win.key)}>
          <X />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-3.5 py-3">
          <ViewBody view={win.view} />
        </div>
      </ScrollArea>
    </Card>
  );
}
