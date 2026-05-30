import { useEffect, useMemo, useRef, useState } from "react";
import { buildBoardModel, type BoardLink, type BoardModel, type Pos } from "@/board/tree";
import { PersonCard } from "@/board/PersonCard";
import { useApp } from "@/app/store";
import type { Layout } from "@/vault/layout";

const LINK_SPAN = 8000; // SVG coordinate span (centered on origin) for drawing links
const PERSIST_DELAY = 500;

function seedPositions(model: BoardModel, layout: Layout): Map<string, Pos> {
  const out = new Map(model.positions); // tidy radial seed
  for (const [id, p] of Object.entries(layout.positions)) {
    if (out.has(id)) out.set(id, p); // a saved position wins for cards that still exist
  }
  return out;
}

/**
 * The board — a clean digital corkboard. Cards stay where placed (no physics); dragging
 * a card rigidly moves its whole subtree. Positions, pan, and zoom persist to layout.json.
 */
export function BoardView() {
  const switchboard = useApp((s) => s.switchboard);
  const photos = useApp((s) => s.photos);
  const layout = useApp((s) => s.layout);
  const saveLayout = useApp((s) => s.saveLayout);
  const openView = useApp((s) => s.openView);
  const containerRef = useRef<HTMLDivElement>(null);
  const model = useMemo(
    () => buildBoardModel(switchboard, new Date(), new Map(Object.entries(layout.parentOverrides ?? {}))),
    [switchboard, layout],
  );

  const [positions, setPositions] = useState<Map<string, Pos>>(() => seedPositions(model, layout));
  const [pan, setPan] = useState<Pos>(() => layout.viewport?.pan ?? { x: 0, y: 0 });
  const [zoom, setZoom] = useState(() => layout.viewport?.zoom ?? 1);

  // First-ever open (no saved viewport): center self (world origin) in the viewport.
  useEffect(() => {
    if (layout.viewport) return;
    const el = containerRef.current;
    if (el) setPan({ x: el.clientWidth / 2, y: el.clientHeight / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Across vault reloads: keep live positions, seed new cards, prune removed ones.
  useEffect(() => {
    setPositions((prev) => {
      const next = new Map(prev);
      const ids = new Set(model.cards.map((c) => c.id));
      for (const [id, p] of model.positions) if (!next.has(id)) next.set(id, p);
      for (const id of [...next.keys()]) if (!ids.has(id)) next.delete(id);
      return next;
    });
  }, [model]);

  // ---- debounced persistence ----
  const latest = useRef({ positions, pan, zoom });
  latest.current = { positions, pan, zoom };
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function schedulePersist() {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      saveLayout({
        positions: Object.fromEntries(latest.current.positions),
        viewport: { pan: latest.current.pan, zoom: latest.current.zoom },
        parentOverrides: layout.parentOverrides ?? {},
      });
    }, PERSIST_DELAY);
  }
  useEffect(() => () => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
  }, []);

  const drag = useRef<{
    mode: "card" | "pan";
    cardId?: string;
    subtree: string[];
    lastX: number;
    lastY: number;
    downX: number;
    downY: number;
  } | null>(null);

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
      drag.current = {
        mode: "card",
        cardId: id,
        subtree: [id, ...descendants(id)],
        lastX: e.clientX,
        lastY: e.clientY,
        downX: e.clientX,
        downY: e.clientY,
      };
    } else {
      drag.current = { mode: "pan", subtree: [], lastX: e.clientX, lastY: e.clientY, downX: e.clientX, downY: e.clientY };
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
    const d = drag.current;
    drag.current = null;
    containerRef.current?.releasePointerCapture(e.pointerId);
    if (!d) return;
    // A barely-moved press on a card is a click → open its note (float); otherwise it
    // was a drag/pan → persist the new layout.
    const moved = Math.hypot(e.clientX - d.downX, e.clientY - d.downY);
    if (d.mode === "card" && d.cardId && moved < 5) {
      openView({ type: "person", id: d.cardId }, "float", { x: e.clientX, y: e.clientY });
    } else {
      schedulePersist();
    }
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
    schedulePersist();
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
