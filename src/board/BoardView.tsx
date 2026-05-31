import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, Plus, User } from "lucide-react";
import { buildBoardModel, type BoardCard, type BoardLink, type BoardModel, type Pos } from "@/board/tree";
import { boardCache } from "@/board/boardCache";
import { PersonCard } from "@/board/PersonCard";
import { GoalCard } from "@/board/GoalCard";
import { TIE_COLOR } from "@/board/ties";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConnectionMenuItems } from "@/app/ConnectionMenu";
import { promoteGoalDiff } from "@/app/goals";
import { useApp } from "@/app/store";
import { canonicalHandshakeId, canonicalPair, mintPersonId, type Handshake, type Person } from "@/switchboard";
import type { Layout } from "@/vault/layout";

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
export function BoardView({ boardId }: { boardId: string }) {
  const switchboard = useApp((s) => s.switchboard);
  const photos = useApp((s) => s.photos);
  const layout = useApp((s) => s.layout);
  const saveLayout = useApp((s) => s.saveLayout);
  const deletingId = useApp((s) => s.deletingId);
  const locate = useApp((s) => s.locate);
  const containerRef = useRef<HTMLDivElement>(null);
  const model = useMemo(
    () => buildBoardModel(switchboard, new Date(), new Map(Object.entries(layout.parentOverrides ?? {}))),
    [switchboard, layout],
  );

  const cached = boardCache.get(boardId);
  const [positions, setPositions] = useState<Map<string, Pos>>(
    () => cached?.positions ?? seedPositions(model, layout),
  );
  const [pan, setPan] = useState<Pos>(() => cached?.pan ?? layout.viewport?.pan ?? { x: 0, y: 0 });
  const [zoom, setZoom] = useState(() => cached?.zoom ?? layout.viewport?.zoom ?? 1);

  // The "+" create-and-connect flow: a ghost card you name before it materializes.
  const [composing, setComposing] = useState<{ sourceId: string; pos: Pos } | null>(null);
  const [composeName, setComposeName] = useState("");
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const composeBusy = useRef(false);
  // A connection's settings menu, opened by clicking its line (anchored at the click point).
  const [lineMenu, setLineMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  // Drag-to-link: while dragging a card over a linkable one, preview the new tie.
  const [linkPreview, setLinkPreview] = useState<{ from: string; to: string } | null>(null);
  // A briefly-highlighted card after a "locate" from the People view.
  const [focusId, setFocusId] = useState<string | null>(null);

  // First-ever open (no saved viewport): center self (world origin) in the viewport.
  useEffect(() => {
    if (cached || layout.viewport) return;
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
  function persistNow() {
    if (useApp.getState().switching) return; // a vault switch is tearing down — don't write to it
    const snap = latest.current;
    boardCache.set(boardId, { positions: new Map(snap.positions), pan: snap.pan, zoom: snap.zoom });
    if (boardId === "main") {
      saveLayout({
        positions: Object.fromEntries(snap.positions),
        viewport: { pan: snap.pan, zoom: snap.zoom },
        parentOverrides: layout.parentOverrides ?? {},
      });
    }
  }
  function schedulePersist() {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(persistNow, PERSIST_DELAY);
  }
  useEffect(
    () => () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistNow(); // flush this board's layout into the cache before unmount (survives splits)
    },
    [boardId],
  );

  // Locate: center the viewport on a person (requested from the People view) + briefly ring them.
  useEffect(() => {
    if (!locate || boardId !== "main") return; // locate targets the home board
    const el = containerRef.current;
    const pos = positions.get(locate.id);
    if (el && pos) {
      setPan({ x: el.clientWidth / 2 - pos.x * zoom, y: el.clientHeight / 2 - pos.y * zoom });
      schedulePersist();
    }
    setFocusId(locate.id);
    const t = setTimeout(() => setFocusId(null), 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locate?.nonce]);

  const drag = useRef<{
    mode: "card" | "pan";
    cardId?: string;
    subtree: string[];
    start: Map<string, Pos>;
    dropTarget: string | null;
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
      const subtree = [id, ...descendants(id)];
      drag.current = {
        mode: "card",
        cardId: id,
        subtree,
        start: new Map(subtree.map((sid) => [sid, at(sid)])),
        dropTarget: null,
        lastX: e.clientX,
        lastY: e.clientY,
        downX: e.clientX,
        downY: e.clientY,
      };
    } else {
      drag.current = {
        mode: "pan",
        subtree: [],
        start: new Map(),
        dropTarget: null,
        lastX: e.clientX,
        lastY: e.clientY,
        downX: e.clientX,
        downY: e.clientY,
      };
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

    // Is the cursor over a linkable card (not in the dragged subtree, not already tied)?
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect && d.cardId && !d.cardId.startsWith("goal:")) {
      const px = (e.clientX - rect.left - pan.x) / zoom;
      const py = (e.clientY - rect.top - pan.y) / zoom;
      const subtree = new Set(d.subtree);
      let found: string | null = null;
      for (const card of model.cards) {
        if (card.isGoal) continue;
        if (subtree.has(card.id)) continue;
        if (switchboard.handshakes.has(canonicalHandshakeId(d.cardId, card.id))) continue;
        const c = at(card.id);
        if (Math.abs(px - c.x) < 80 && Math.abs(py - c.y) < 104) {
          found = card.id;
          break;
        }
      }
      if (found !== d.dropTarget) {
        d.dropTarget = found;
        setLinkPreview(found ? { from: d.cardId, to: found } : null);
      }
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    drag.current = null;
    containerRef.current?.releasePointerCapture(e.pointerId);
    setLinkPreview(null);
    if (!d) return;
    const moved = Math.hypot(e.clientX - d.downX, e.clientY - d.downY);
    if (d.mode === "card" && d.cardId) {
      const isGoal = d.cardId.startsWith("goal:");
      if (moved < 5) {
        if (!isGoal) {
          if (e.metaKey || e.ctrlKey) {
            useApp.getState().openView({ type: "person", id: d.cardId }, { split: "row" }); // ⌘/Ctrl-click → split
          } else {
            useApp.getState().revealPerson(d.cardId, { toggle: true }); // plain click → note in the default mode
          }
        }
      } else if (!isGoal && d.dropTarget) {
        // Dropped onto another card → link them, and snap the dragged subtree back so
        // nothing's left overlapping. (Drop in open space to reposition instead.)
        const target = d.dropTarget;
        setPositions((prev) => {
          const next = new Map(prev);
          for (const [sid, p] of d.start) next.set(sid, p);
          return next;
        });
        const [pa, pb] = canonicalPair(d.cardId, target);
        void useApp.getState().commit([
          {
            op: "createHandshake",
            handshake: {
              kind: "handshake",
              id: canonicalHandshakeId(d.cardId, target),
              people: [pa, pb],
              strength: "cold",
              body: "",
            },
          },
        ]);
      } else {
        schedulePersist(); // repositioned in open space
      }
    } else {
      schedulePersist(); // pan
    }
  }

  function onWheel(e: React.WheelEvent) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const nextZoom = Math.min(8, Math.max(0.05, zoom * Math.exp(-e.deltaY * 0.0015)));
    const wx = (cx - pan.x) / zoom;
    const wy = (cy - pan.y) / zoom;
    setPan({ x: cx - wx * nextZoom, y: cy - wy * nextZoom });
    setZoom(nextZoom);
    schedulePersist();
  }

  const at = (id: string): Pos => positions.get(id) ?? { x: 0, y: 0 };
  const selfId = switchboard.self?.id;

  // Find an open spot for a new card: fan outward from the source (in its growth
  // direction, away from its parent), expanding the radius until it clears every
  // existing card so the newcomer never lands on top of one.
  function findFreeSpot(sourceId: string): Pos {
    const src = at(sourceId);
    const parent = model.parentOf.get(sourceId);
    const from = parent ? at(parent) : { x: src.x, y: src.y - 1 };
    const baseAngle = Math.atan2(src.y - from.y, src.x - from.x);
    const occupied = [...positions.values()];
    const W = 186; // card is ~144 wide; leave a clear gutter
    const H = 236; // ~196 tall + gutter
    const free = (p: Pos) => !occupied.some((q) => Math.abs(q.x - p.x) < W && Math.abs(q.y - p.y) < H);
    for (let r = 240; r <= 720; r += 80) {
      for (let k = 0; k <= 8; k++) {
        for (const s of k === 0 ? [0] : [1, -1]) {
          const a = baseAngle + s * k * 0.4;
          const cand = { x: src.x + r * Math.cos(a), y: src.y + r * Math.sin(a) };
          if (free(cand)) return cand;
        }
      }
    }
    return { x: src.x + 210 * Math.cos(baseAngle), y: src.y + 210 * Math.sin(baseAngle) };
  }

  function startCompose(sourceId: string) {
    setComposeName("");
    setComposing({ sourceId, pos: findFreeSpot(sourceId) });
  }

  // Tick a goal card: graduate it into a real person (connected to you), solidifying in
  // place where the dashed card sat, then open the new note.
  async function promoteGoalCard(card: BoardCard) {
    if (!card.goalId) return;
    const sb = useApp.getState().switchboard;
    const goal = sb.goals.get(card.goalId);
    if (!goal) return;
    const { diff, personId } = promoteGoalDiff(sb, goal);
    const pos = at(card.id);
    setPositions((prev) => {
      const next = new Map(prev);
      next.set(personId, pos);
      next.delete(card.id);
      return next;
    });
    setJustCreated(personId);
    const res = await useApp.getState().commit(diff);
    if (res.ok) {
      schedulePersist();
      useApp.getState().revealPerson(personId);
      setTimeout(() => setJustCreated(null), 500);
    } else {
      setJustCreated(null);
    }
  }

  function cancelCompose() {
    setComposing(null);
    setComposeName("");
  }

  // Materialize the ghost: mint the id from the typed name, write the person + the edge
  // to its source in one atomic diff, spring it solid, and open its note for editing.
  async function materialize() {
    const c = composing;
    const name = composeName.trim();
    if (!c || !name || composeBusy.current) {
      if (!name) cancelCompose();
      return;
    }
    composeBusy.current = true;
    try {
      const sb = useApp.getState().switchboard;
      const id = mintPersonId(sb.people, name);
      const person: Person = { kind: "person", id, name, isSelf: false, tags: [], handles: {}, body: "" };
      const [pa, pb] = canonicalPair(c.sourceId, id);
      const handshake: Handshake = {
        kind: "handshake",
        id: canonicalHandshakeId(c.sourceId, id),
        people: [pa, pb],
        strength: "cold",
        body: "",
      };
      setPositions((prev) => new Map(prev).set(id, c.pos));
      setJustCreated(id);
      const res = await useApp.getState().commit([
        { op: "createPerson", person },
        { op: "createHandshake", handshake },
      ]);
      if (res.ok) {
        cancelCompose();
        schedulePersist();
        useApp.getState().revealPerson(id);
        setTimeout(() => setJustCreated(null), 500);
      } else {
        setPositions((prev) => {
          const n = new Map(prev);
          n.delete(id);
          return n;
        });
        setJustCreated(null);
      }
    } finally {
      composeBusy.current = false;
    }
  }

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
        {/* A 1×1 SVG at the world origin with overflow visible — links draw at world coords and
            paint outside its box. (A giant fixed-size SVG rasterizes a huge GPU layer; two boards
            at once blew past the layer limit and one board's links silently vanished — issue #3.) */}
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1}>
          {model.links.map((link) => (
            <LinkLine
              key={`${link.a}|${link.b}`}
              link={link}
              a={at(link.a)}
              b={at(link.b)}
              onOpen={(e) =>
                setLineMenu({ id: canonicalHandshakeId(link.a, link.b), x: e.clientX, y: e.clientY })
              }
            />
          ))}
          {/* aspirational dashed tie from you to each goal card */}
          {selfId &&
            model.cards.map((c) =>
              c.isGoal ? (
                <line
                  key={`goal-tie:${c.id}`}
                  x1={at(selfId).x}
                  y1={at(selfId).y}
                  x2={at(c.id).x}
                  y2={at(c.id).y}
                  style={{ stroke: "var(--primary)", strokeWidth: 1.25, strokeOpacity: 0.3, strokeDasharray: "3 7" }}
                />
              ) : null,
            )}
          {composing && (
            <line
              x1={at(composing.sourceId).x}
              y1={at(composing.sourceId).y}
              x2={composing.pos.x}
              y2={composing.pos.y}
              style={{ stroke: "var(--primary)", strokeWidth: 1.5, strokeOpacity: 0.5, strokeDasharray: "4 4" }}
            />
          )}
          {linkPreview && (
            <line
              x1={at(linkPreview.from).x}
              y1={at(linkPreview.from).y}
              x2={at(linkPreview.to).x}
              y2={at(linkPreview.to).y}
              style={{ stroke: "var(--primary)", strokeWidth: 2, strokeOpacity: 0.7, strokeDasharray: "5 5" }}
            />
          )}
        </svg>

        {model.cards.map((card) => {
          const p = at(card.id);
          return (
            <div
              key={card.id}
              data-card-id={card.id}
              className="group absolute cursor-grab"
              style={{ left: p.x, top: p.y, transform: "translate(-50%, -50%)" }}
            >
              <motion.div
                initial={card.id === justCreated ? { scale: 0.5, opacity: 0 } : false}
                animate={{
                  scale: card.id === deletingId ? 0.4 : 1,
                  opacity: card.id === deletingId ? 0 : 1,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {card.isGoal ? (
                  <GoalCard title={card.name} />
                ) : (
                  <PersonCard
                    card={card}
                    photoSrc={photos.get(card.id)}
                    highlighted={card.id === linkPreview?.to || card.id === focusId}
                  />
                )}
              </motion.div>
              {card.isGoal ? (
                <button
                  type="button"
                  aria-label={`Mark ${card.name} met — add as a connection`}
                  title="Mark met → add as a connection"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    void promoteGoalCard(card);
                  }}
                  className="absolute -left-2 -top-2 flex size-6 items-center justify-center rounded-full border border-primary/50 bg-card text-muted-foreground opacity-60 shadow-sm transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground group-hover:opacity-90 hover:!opacity-100"
                >
                  <Check className="size-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label={`Add someone connected to ${card.name}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    startCompose(card.id);
                  }}
                  className="absolute left-full top-1/2 ml-2.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-full border bg-card text-muted-foreground opacity-30 shadow-sm transition-all group-hover:opacity-80 hover:border-primary hover:text-foreground hover:!opacity-100"
                >
                  <Plus className="size-3" />
                </button>
              )}
            </div>
          );
        })}

        {composing && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 480, damping: 30 }}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute"
            style={{ left: composing.pos.x, top: composing.pos.y, transform: "translate(-50%, -50%)" }}
          >
            <div className="w-36 overflow-hidden rounded-md border border-dashed border-primary/60 bg-card shadow-sm">
              <div className="flex aspect-square w-full items-center justify-center bg-muted">
                <User strokeWidth={1.5} className="h-1/2 w-1/2 text-muted-foreground/40" />
              </div>
              <div className="px-2 py-2">
                <input
                  autoFocus
                  value={composeName}
                  onChange={(e) => setComposeName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void materialize();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      cancelCompose();
                    }
                  }}
                  onBlur={() => {
                    if (composeName.trim()) void materialize();
                    else cancelCompose();
                  }}
                  placeholder="Name…"
                  className="w-full bg-transparent text-sm font-medium leading-tight text-card-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <DropdownMenu open={!!lineMenu} onOpenChange={(o) => { if (!o) setLineMenu(null); }}>
        <DropdownMenuTrigger asChild>
          <div
            aria-hidden
            className="fixed"
            style={{ left: lineMenu?.x ?? -9999, top: lineMenu?.y ?? -9999, width: 0, height: 0 }}
          />
        </DropdownMenuTrigger>
        {lineMenu && (
          <DropdownMenuContent align="start" className="w-56">
            <ConnectionMenuItems handshakeId={lineMenu.id} />
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  );
}

function LinkLine({
  link,
  a,
  b,
  onOpen,
}: {
  link: BoardLink;
  a: Pos;
  b: Pos;
  onOpen: (e: { clientX: number; clientY: number }) => void;
}) {
  const width = link.strength === "close" ? 2 : link.strength === "warm" ? 1.5 : 1;
  return (
    <g className="cursor-pointer" onPointerDown={(e) => e.stopPropagation()} onClick={onOpen}>
      {/* fat invisible hit area so the thin yarn is easy to click */}
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke="transparent"
        strokeWidth={14}
        strokeLinecap="round"
        style={{ pointerEvents: "stroke" }}
      />
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        style={{
          stroke: TIE_COLOR[link.strength],
          strokeWidth: width,
          strokeOpacity: link.treeEdge ? 0.85 : 0.5,
          strokeDasharray: link.strength === "dormant" ? "5 5" : undefined,
          pointerEvents: "none",
        }}
      />
    </g>
  );
}
