import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Check, Filter, Maximize, Minus, Plus, UserPlus, Wand2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buildBoardModel, type BoardCard, type BoardLink, type BoardModel, type Pos } from "@/board/tree";
import { boardCache } from "@/board/boardCache";
import { PhotoUpload } from "@/app/PhotoUpload";
import { importPhoto } from "@/vault/photos";
import { newId } from "@/workspace/model";
import { PersonCard } from "@/board/PersonCard";
import { GoalCard } from "@/board/GoalCard";
import { TIE_COLOR } from "@/board/ties";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConnectionMenuItems } from "@/app/ConnectionMenu";
import { promoteGoalDiff } from "@/app/goals";
import { useApp } from "@/app/store";
import { recordBoardMove, registerBoard, unregisterBoard, type BoardPatch } from "@/app/undo";
import { registerRetidy, unregisterRetidy } from "@/board/retidy";
import { cn } from "@/lib/utils";
import { canonicalHandshakeId, canonicalPair, mintPersonId, type Handshake, type Person, type Strength } from "@/switchboard";
import type { CardSpacing, FadeStrength, FlashDuration, ZoomRange } from "@/vault/settings";
import type { Layout } from "@/vault/layout";

const PERSIST_DELAY = 500;

// How much of a card's staleness becomes dimming, per strength setting (1 = the raw freshness curve).
const FADE_SCALE: Record<FadeStrength, number> = { subtle: 0.5, medium: 1, strong: 1.6 };
// Board feel knobs (0.8.3 customization): how spread out cards are, how far you can zoom, and how
// long a located card flashes. Spacing scales both the auto-layout gap and the new-card spawn search.
const SPACING_FACTOR: Record<CardSpacing, number> = { compact: 0.78, comfortable: 1, spacious: 1.3 };
// Card grows with inbound `[[mentions]]` (#16) — gentle + capped so the board stays legible.
const CARD_SCALE_MAX = 1.35;
const cardSizeScale = (backlinkCount: number): number => 1 + Math.min(backlinkCount, 5) * 0.07;
const ZOOM_LIMITS: Record<ZoomRange, [number, number]> = { standard: [0.2, 4], wide: [0.05, 8] };
const FLASH_MS: Record<FlashDuration, number> = { brief: 700, normal: 1400, long: 3000 };

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
  // This board's own session, captured at mount — so layout writes always land in THIS vault even
  // mid-switch (the store's current session may already point at the network being opened) (#25).
  const sessionRef = useRef(useApp.getState().session);
  const deletingId = useApp((s) => s.deletingId);
  const locate = useApp((s) => s.locate);
  const showGoals = useApp((s) => s.settings.showGoalsOnBoard);
  const showIntroducedBy = useApp((s) => s.settings.showIntroducedBy);
  const showBacklinks = useApp((s) => s.settings.showBacklinks);
  const sizeCardsByBacklinks = useApp((s) => s.settings.sizeCardsByBacklinks);
  const fadeStaleCards = useApp((s) => s.settings.fadeStaleCards);
  const fadeStrength = useApp((s) => s.settings.fadeStrength);
  const cardSpacing = useApp((s) => s.settings.cardSpacing);
  const zoomRange = useApp((s) => s.settings.zoomRange);
  const locateFlash = useApp((s) => s.settings.locateFlash);
  const containerRef = useRef<HTMLDivElement>(null);
  const spacing = SPACING_FACTOR[cardSpacing];
  const model = useMemo(
    () =>
      buildBoardModel(
        switchboard,
        new Date(),
        new Map(Object.entries(layout.parentOverrides ?? {})),
        Math.round(200 * spacing),
      ),
    [switchboard, layout, spacing],
  );

  // Inline board filter (#16): dim cards that don't carry every chosen tag / a chosen tie strength.
  const [boardFilter, setBoardFilter] = useState<{ tags: string[]; strengths: Strength[] }>({
    tags: [],
    strengths: [],
  });
  const filterActive = boardFilter.tags.length > 0 || boardFilter.strengths.length > 0;
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of switchboard.people.values()) p.tags.forEach((t) => set.add(t));
    return [...set].sort();
  }, [switchboard.people]);
  const strengthsByPerson = useMemo(() => {
    const m = new Map<string, Set<Strength>>();
    for (const h of switchboard.handshakes.values()) {
      for (const pid of h.people) {
        let set = m.get(pid);
        if (!set) {
          set = new Set();
          m.set(pid, set);
        }
        set.add(h.strength);
      }
    }
    return m;
  }, [switchboard.handshakes]);

  const cached = boardCache.get(boardId);
  const [positions, setPositions] = useState<Map<string, Pos>>(
    () => cached?.positions ?? seedPositions(model, layout),
  );
  const [pan, setPan] = useState<Pos>(() => cached?.pan ?? layout.viewport?.pan ?? { x: 0, y: 0 });
  const [zoom, setZoom] = useState(() => cached?.zoom ?? layout.viewport?.zoom ?? 1);

  // The "+" create-and-connect flow: a ghost card you name before it materializes.
  const [composing, setComposing] = useState<{
    sourceId: string;
    pos: Pos;
    photo?: { rel: string; dataUrl?: string };
  } | null>(null);
  const [composeName, setComposeName] = useState("");
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const composeBusy = useRef(false);
  // True while the photo picker is open, so the name input's blur doesn't materialize/cancel the
  // ghost (clicking the photo + opening the OS dialog both blur the input — see #28).
  const pickingPhoto = useRef(false);
  // A connection's settings menu, opened by clicking its line (anchored at the click point).
  const [lineMenu, setLineMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  // Drag-to-link: while dragging a card over a linkable one, preview the new tie.
  const [linkPreview, setLinkPreview] = useState<{ from: string; to: string } | null>(null);
  // A briefly-highlighted card after a "locate" from the People view.
  const [focusId, setFocusId] = useState<string | null>(null);
  // True for the brief window after a re-tidy, so cards animate (transition left/top) to their
  // fresh auto-layout spots instead of snapping. Off during normal drags (which must be 1:1).
  const [tidying, setTidying] = useState(false);
  // Latest model, for the retidy handler registered once below (reads it fresh at call time).
  const modelRef = useRef(model);
  modelRef.current = model;

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
    const snap = latest.current;
    boardCache.set(boardId, { positions: new Map(snap.positions), pan: snap.pan, zoom: snap.zoom });
    // Persist to this board's own session (not the store's current one), so a network you're
    // leaving keeps its final card positions / viewport even when you switch mid-debounce (#25).
    if (boardId === "main") {
      void sessionRef.current
        ?.saveLayout({
          positions: Object.fromEntries(snap.positions),
          viewport: { pan: snap.pan, zoom: snap.zoom },
          parentOverrides: layout.parentOverrides ?? {},
        })
        .catch(() => {});
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

  // Let the undo controller replay card-position patches against this board's live state.
  useEffect(() => {
    registerBoard(boardId, (patch) => {
      setPositions((prev) => {
        const next = new Map(prev);
        for (const [id, p] of Object.entries(patch)) next.set(id, p);
        return next;
      });
      schedulePersist();
    });
    return () => unregisterBoard(boardId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  // Re-tidy: snap every card back to the current auto-layout (which already honours card spacing),
  // as one undoable move, and re-centre the viewport so the result is in view. Registered so the
  // command palette can trigger it; reads positions/model fresh via refs.
  function retidy() {
    const cur = latest.current.positions;
    const tidy = modelRef.current.positions;
    const before: BoardPatch = {};
    const after: BoardPatch = {};
    for (const c of modelRef.current.cards) {
      const t = tidy.get(c.id);
      if (!t) continue;
      before[c.id] = cur.get(c.id) ?? t;
      after[c.id] = t;
    }
    if (Object.keys(after).length === 0) return;
    recordBoardMove(boardId, before, after); // Ctrl-Z restores the previous arrangement
    setTidying(true);
    setPositions((prev) => {
      const next = new Map(prev);
      for (const [id, p] of Object.entries(after)) next.set(id, p);
      return next;
    });
    const el = containerRef.current;
    if (el) setPan({ x: el.clientWidth / 2, y: el.clientHeight / 2 }); // re-centre on the root
    schedulePersist();
    window.setTimeout(() => setTidying(false), 560); // clear the transition once it has played
  }
  useEffect(() => {
    registerRetidy(boardId, retidy);
    return () => unregisterRetidy(boardId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

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
    const t = setTimeout(() => setFocusId(null), FLASH_MS[locateFlash]);
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
    if (e.button !== 0) return; // left button only — right-click is reserved for the command palette
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
              strength: useApp.getState().settings.defaultTieStrength,
              body: "",
            },
          },
        ]);
      } else {
        // Repositioned in open space — record before/after for undo (exact via the total delta).
        const wdx = (e.clientX - d.downX) / zoom;
        const wdy = (e.clientY - d.downY) / zoom;
        const before: BoardPatch = {};
        const after: BoardPatch = {};
        for (const id of d.subtree) {
          const b = d.start.get(id);
          if (!b) continue;
          before[id] = b;
          after[id] = { x: b.x + wdx, y: b.y + wdy };
        }
        recordBoardMove(boardId, before, after);
        schedulePersist();
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
    const [zMin, zMax] = ZOOM_LIMITS[zoomRange];
    const nextZoom = Math.min(zMax, Math.max(zMin, zoom * Math.exp(-e.deltaY * 0.0015)));
    const wx = (cx - pan.x) / zoom;
    const wy = (cy - pan.y) / zoom;
    setPan({ x: cx - wx * nextZoom, y: cy - wy * nextZoom });
    setZoom(nextZoom);
    schedulePersist();
  }

  const at = (id: string): Pos => positions.get(id) ?? { x: 0, y: 0 };
  const selfId = switchboard.self?.id;

  // ---- board toolbar actions ----
  // Zoom by a fixed factor about the viewport centre (keeps the middle of the view put).
  function zoomBy(factor: number) {
    const el = containerRef.current;
    if (!el) return;
    const [zMin, zMax] = ZOOM_LIMITS[zoomRange];
    const next = Math.min(zMax, Math.max(zMin, zoom * factor));
    const cx = el.clientWidth / 2;
    const cy = el.clientHeight / 2;
    const wx = (cx - pan.x) / zoom;
    const wy = (cy - pan.y) / zoom;
    setPan({ x: cx - wx * next, y: cy - wy * next });
    setZoom(next);
    schedulePersist();
  }
  // Frame the whole network in the viewport (the "I'm lost, take me home" button).
  function fitToView() {
    const el = containerRef.current;
    const pts = [...positions.values()];
    if (!el || pts.length === 0) return;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = 140; // half a card + breathing room
    const [zMin, zMax] = ZOOM_LIMITS[zoomRange];
    const z = Math.min(
      zMax,
      Math.max(zMin, Math.min(el.clientWidth / (maxX - minX + pad * 2), el.clientHeight / (maxY - minY + pad * 2))),
    );
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setZoom(z);
    setPan({ x: el.clientWidth / 2 - cx * z, y: el.clientHeight / 2 - cy * z });
    schedulePersist();
  }
  // Start the create-and-connect ghost at the centre of the current view, connected to you.
  function newPersonHere() {
    const el = containerRef.current;
    if (!el || !selfId) return;
    setComposeName("");
    setComposing({
      sourceId: selfId,
      pos: { x: (el.clientWidth / 2 - pan.x) / zoom, y: (el.clientHeight / 2 - pan.y) / zoom },
    });
  }

  // Find an open spot for a new card: fan outward from the source (in its growth
  // direction, away from its parent), expanding the radius until it clears every
  // existing card so the newcomer never lands on top of one.
  function findFreeSpot(sourceId: string): Pos {
    const src = at(sourceId);
    const parent = model.parentOf.get(sourceId);
    const from = parent ? at(parent) : { x: src.x, y: src.y - 1 };
    const baseAngle = Math.atan2(src.y - from.y, src.x - from.x);
    const occupied = [...positions.values()];
    // Leave clearance for the largest a card can get when sized by backlinks, so new cards don't
    // spawn under a big polaroid.
    const grow = sizeCardsByBacklinks ? CARD_SCALE_MAX : 1;
    const W = 186 * grow; // card is ~144 wide; leave a clear gutter
    const H = 236 * grow; // ~196 tall + gutter
    const free = (p: Pos) => !occupied.some((q) => Math.abs(q.x - p.x) < W && Math.abs(q.y - p.y) < H);
    // Spawn radius scales with the card-spacing setting — new cards land closer (compact) or
    // farther (spacious) from their source.
    for (let r = 240 * spacing; r <= 720 * spacing; r += 80 * spacing) {
      for (let k = 0; k <= 8; k++) {
        for (const s of k === 0 ? [0] : [1, -1]) {
          const a = baseAngle + s * k * 0.4;
          const cand = { x: src.x + r * Math.cos(a), y: src.y + r * Math.sin(a) };
          if (free(cand)) return cand;
        }
      }
    }
    return { x: src.x + 210 * spacing * Math.cos(baseAngle), y: src.y + 210 * spacing * Math.sin(baseAngle) };
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

  // Pick a photo for the ghost before it's materialized; previewed on the card, written on create.
  async function pickComposePhoto() {
    const session = useApp.getState().session;
    if (!session) return;
    pickingPhoto.current = true;
    try {
      const picked = await importPhoto(session, newId());
      if (picked) setComposing((c) => (c ? { ...c, photo: picked } : c));
    } finally {
      pickingPhoto.current = false;
    }
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
      const person: Person = { kind: "person", id, name, isSelf: false, tags: [], affiliations: [], handles: {}, body: "", photo: c.photo?.rel };
      const [pa, pb] = canonicalPair(c.sourceId, id);
      const handshake: Handshake = {
        kind: "handshake",
        id: canonicalHandshakeId(c.sourceId, id),
        people: [pa, pb],
        strength: useApp.getState().settings.defaultTieStrength,
        body: "",
      };
      setPositions((prev) => new Map(prev).set(id, c.pos));
      setJustCreated(id);
      const res = await useApp.getState().commit([
        { op: "createPerson", person },
        { op: "createHandshake", handshake },
      ]);
      if (res.ok) {
        if (c.photo?.dataUrl) useApp.setState((s) => ({ photos: new Map(s.photos).set(id, c.photo!.dataUrl!) }));
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
          {model.links
            .filter((link) => (showIntroducedBy || !link.introducedBy) && (showBacklinks || !link.backlink))
            .map((link) => (
            <LinkLine
              key={`${link.introducedBy ? "via:" : link.backlink ? "bl:" : ""}${link.a}|${link.b}`}
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
            showGoals &&
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

        {model.cards
          .filter((card) => showGoals || !card.isGoal)
          .map((card) => {
          const p = at(card.id);
          // Staleness fade (#15): dim cards by how long since you last interacted. You (self) and
          // goals never fade. freshnessOf() gives a 0.35–1 recency value; the strength setting
          // scales how much of that "staleness" translates to dimming (floored so cards stay legible).
          const dim = (1 - card.freshness) * FADE_SCALE[fadeStrength];
          const fade = fadeStaleCards && !card.isSelf && !card.isGoal ? Math.max(0.22, 1 - dim) : 1;
          // Filter dim composes with the staleness fade into one opacity (don't stack two sources).
          const matches =
            !filterActive ||
            (boardFilter.tags.every((t) => card.tags.includes(t)) &&
              (boardFilter.strengths.length === 0 ||
                boardFilter.strengths.some((s) => strengthsByPerson.get(card.id)?.has(s))));
          const opacity = card.id === deletingId ? 0 : fade * (matches ? 1 : 0.12);
          return (
            <div
              key={card.id}
              data-card-id={card.id}
              className={cn(
                "group absolute cursor-grab",
                tidying && "transition-[left,top] duration-500 ease-out",
              )}
              style={{ left: p.x, top: p.y, transform: "translate(-50%, -50%)" }}
            >
              <motion.div
                initial={card.id === justCreated ? { scale: 0.5, opacity: 0 } : false}
                animate={{
                  scale: card.id === deletingId ? 0.4 : 1,
                  opacity,
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
                    sizeScale={sizeCardsByBacklinks ? cardSizeScale(card.backlinkCount) : 1}
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
              {/* Capture mousedown before the input blurs, so picking a photo never cancels/creates. */}
              <div onMouseDownCapture={() => (pickingPhoto.current = true)}>
                <PhotoUpload
                  src={composing.photo?.dataUrl}
                  onClick={pickComposePhoto}
                  round="md"
                  className="aspect-square w-full rounded-none"
                  label="Add a photo"
                />
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
                    if (pickingPhoto.current) return; // photo picker stole focus — keep the ghost
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

      {selfId && (
        <BoardToolbar
          zoom={zoom}
          onNew={newPersonHere}
          onZoomOut={() => zoomBy(0.8)}
          onZoomReset={() => zoomBy(1 / zoom)}
          onZoomIn={() => zoomBy(1.25)}
          onFit={fitToView}
          onTidy={retidy}
          filter={<BoardFilter allTags={allTags} filter={boardFilter} onChange={setBoardFilter} />}
        />
      )}
    </div>
  );
}

/** The always-on board controls — a floating pill at the bottom-centre (create · zoom · layout · filter). */
function BoardToolbar({
  zoom,
  onNew,
  onZoomOut,
  onZoomReset,
  onZoomIn,
  onFit,
  onTidy,
  filter,
}: {
  zoom: number;
  onNew: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomIn: () => void;
  onFit: () => void;
  onTidy: () => void;
  filter?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      // Don't let interactions with the bar pan/zoom the board behind it.
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border bg-card/90 p-1 shadow-lg backdrop-blur-sm"
    >
      <ToolButton label="New person" onClick={onNew}>
        <UserPlus className="size-4" />
      </ToolButton>
      <ToolDivider />
      <ToolButton label="Zoom out" onClick={onZoomOut}>
        <Minus className="size-4" />
      </ToolButton>
      <button
        type="button"
        onClick={onZoomReset}
        title="Reset zoom to 100%"
        className="min-w-[3rem] rounded-md px-1.5 py-1 text-xs tabular-nums text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ToolButton label="Zoom in" onClick={onZoomIn}>
        <Plus className="size-4" />
      </ToolButton>
      <ToolButton label="Fit to view" onClick={onFit}>
        <Maximize className="size-4" />
      </ToolButton>
      <ToolDivider />
      <ToolButton label="Re-tidy board" onClick={onTidy}>
        <Wand2 className="size-4" />
      </ToolButton>
      {filter && (
        <>
          <ToolDivider />
          {filter}
        </>
      )}
    </motion.div>
  );
}

const STRENGTHS: { value: Strength; label: string }[] = [
  { value: "close", label: "Close" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
  { value: "dormant", label: "Dormant" },
];

/** The board filter: a toolbar button → popover of tag + tie-strength chips. Non-matching cards dim. */
function BoardFilter({
  allTags,
  filter,
  onChange,
}: {
  allTags: string[];
  filter: { tags: string[]; strengths: Strength[] };
  onChange: (next: { tags: string[]; strengths: Strength[] }) => void;
}) {
  const count = filter.tags.length + filter.strengths.length;
  const toggleTag = (t: string) =>
    onChange({ ...filter, tags: filter.tags.includes(t) ? filter.tags.filter((x) => x !== t) : [...filter.tags, t] });
  const toggleStrength = (s: Strength) =>
    onChange({
      ...filter,
      strengths: filter.strengths.includes(s) ? filter.strengths.filter((x) => x !== s) : [...filter.strengths, s],
    });
  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-2 py-0.5 text-xs capitalize transition-colors",
      active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:bg-accent/50",
    );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Filter board"
          title="Filter board"
          className={cn(
            "relative grid size-8 place-items-center rounded-md transition-colors hover:bg-accent/50",
            count > 0 ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Filter className="size-4" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-3.5 place-items-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-64 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Filter board</span>
          {count > 0 && (
            <button
              type="button"
              onClick={() => onChange({ tags: [], strengths: [] })}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Tie strength</div>
          <div className="flex flex-wrap gap-1">
            {STRENGTHS.map((s) => (
              <button key={s.value} type="button" onClick={() => toggleStrength(s.value)} className={chip(filter.strengths.includes(s.value))}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {allTags.length > 0 && (
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Tags</div>
            <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto">
              {allTags.map((t) => (
                <button key={t} type="button" onClick={() => toggleTag(t)} className={chip(filter.tags.includes(t))}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
    >
      {children}
    </button>
  );
}

function ToolDivider() {
  return <div className="mx-0.5 h-5 w-px bg-border" />;
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
  // Introduced-by edges have no handshake behind them — a faint dotted line, not clickable.
  if (link.introducedBy) {
    return (
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        style={{
          stroke: "var(--muted-foreground)",
          strokeWidth: 1,
          strokeOpacity: 0.35,
          strokeDasharray: "2 6",
          pointerEvents: "none",
        }}
      />
    );
  }
  // Backlink edges (a `[[mention]]`, no tie behind it) — same dotted treatment, but rose-tinted so
  // it reads apart from the muted introduced-by lines. Not clickable.
  if (link.backlink) {
    return (
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        style={{
          stroke: "var(--primary)",
          strokeWidth: 1,
          strokeOpacity: 0.4,
          strokeDasharray: "2 5",
          pointerEvents: "none",
        }}
      />
    );
  }
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
