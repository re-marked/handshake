import { useEffect, useMemo, useRef, useState } from "react";
import type { Switchboard } from "@/switchboard";
import { buildBoardModel, type BoardLink, type Pos } from "@/board/tree";
import { PersonCard } from "@/board/PersonCard";

const LINK_SPAN = 8000; // SVG coordinate span (centered on origin) for drawing links

/**
 * The board — a clean digital corkboard. Cards are placed and stay put (no physics);
 * dragging a card rigidly moves its whole subtree. Pan the empty board, scroll to zoom.
 */
export function BoardView({ switchboard, photos }: { switchboard: Switchboard; photos: Map<string, string> }) {
  const model = useMemo(() => buildBoardModel(switchboard, new Date()), [switchboard]);
  const containerRef = useRef<HTMLDivElement>(null);

  const [positions, setPositions] = useState<Map<string, Pos>>(() => new Map(model.positions));
  const [pan, setPan] = useState<Pos>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Reset to the tidy layout when the vault changes (positions aren't persisted yet),
  // and center the board so self (0,0) sits mid-viewport.
  useEffect(() => {
    setPositions(new Map(model.positions));
    setZoom(1);
    const el = containerRef.current;
    setPan(el ? { x: el.clientWidth / 2, y: el.clientHeight / 2 } : { x: 0, y: 0 });
  }, [model]);

  const drag = useRef<{ mode: "card" | "pan"; subtree: string[]; lastX: number; lastY: number } | null>(null);

  function descendants(id: string): string[] {
    const out: string[] = [];
    const stack = [...(model.childrenOf.get(id) ?? [])];
    while (stack.length) {
      const n = stack.pop()!;
      out.push(n);
      stack.push(...(model.childrenOf.get(n) ?? []));
    }
    return out;
  }

  function onPointerDown(e: React.PointerEvent) {
    const cardEl = (e.target as HTMLElement).closest<HTMLElement>("[data-card-id]");
    containerRef.current?.setPointerCapture(e.pointerId);
    if (cardEl?.dataset.cardId) {
      const id = cardEl.dataset.cardId;
      drag.current = { mode: "card", subtree: [id, ...descendants(id)], lastX: e.clientX, lastY: e.clientY };
    } else {
      drag.current = { mode: "pan", subtree: [], lastX: e.clientX, lastY: e.clientY };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.lastX = e.clientX;
    d.lastY = e.clientY;

    if (d.mode === "pan") {
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      return;
    }
    const wdx = dx / zoom;
    const wdy = dy / zoom;
    setPositions((prev) => {
      const next = new Map(prev);
      for (const id of d.subtree) {
        const p = next.get(id);
        if (p) next.set(id, { x: p.x + wdx, y: p.y + wdy });
      }
      return next;
    });
  }

  function onPointerUp(e: React.PointerEvent) {
    drag.current = null;
    containerRef.current?.releasePointerCapture(e.pointerId);
  }

  function onWheel(e: React.WheelEvent) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const nextZoom = Math.min(3, Math.max(0.3, zoom * Math.exp(-e.deltaY * 0.0015)));
    const wx = (cx - pan.x) / zoom;
    const wy = (cy - pan.y) / zoom;
    setPan({ x: cx - wx * nextZoom, y: cy - wy * nextZoom });
    setZoom(nextZoom);
  }

  const at = (id: string): Pos => positions.get(id) ?? { x: 0, y: 0 };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none select-none overflow-hidden bg-background"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      style={{ cursor: drag.current?.mode === "pan" ? "grabbing" : "default" }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <svg
          className="pointer-events-none absolute"
          style={{ left: -LINK_SPAN / 2, top: -LINK_SPAN / 2, width: LINK_SPAN, height: LINK_SPAN }}
          viewBox={`${-LINK_SPAN / 2} ${-LINK_SPAN / 2} ${LINK_SPAN} ${LINK_SPAN}`}
        >
          {model.links.map((link) => (
            <LinkLine key={`${link.a}|${link.b}`} link={link} a={at(link.a)} b={at(link.b)} />
          ))}
        </svg>

        {model.cards.map((card) => {
          const p = at(card.id);
          return (
            <div
              key={card.id}
              data-card-id={card.id}
              className="absolute cursor-grab"
              style={{ left: p.x, top: p.y, transform: "translate(-50%, -50%)" }}
            >
              <PersonCard card={card} photoSrc={photos.get(card.id)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LinkLine({ link, a, b }: { link: BoardLink; a: Pos; b: Pos }) {
  const width = link.strength === "close" ? 2 : link.strength === "warm" ? 1.5 : 1;
  return (
    <line
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      style={{
        stroke: "var(--border)",
        strokeWidth: width,
        strokeOpacity: link.treeEdge ? 0.9 : 0.4,
        strokeDasharray: link.strength === "dormant" ? "5 5" : undefined,
      }}
    />
  );
}
