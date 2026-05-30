import { canonicalHandshakeId, lastInteractionDate, type Strength, type Switchboard } from "@/switchboard";

export interface BoardCard {
  id: string;
  name: string;
  isSelf: boolean;
  photo?: string; // relpath into attachments/ (loaded once the asset protocol is wired)
  role?: string;
  company?: string;
  /** 0..1 recency → card opacity (staleness). */
  freshness: number;
}

export interface BoardLink {
  a: string;
  b: string;
  strength: Strength;
  /** true if this handshake is the parent↔child hierarchy edge (drives movement). */
  treeEdge: boolean;
}

export interface Pos {
  x: number;
  y: number;
}

export interface BoardModel {
  cards: BoardCard[];
  links: BoardLink[];
  parentOf: Map<string, string | null>; // null = root (self)
  childrenOf: Map<string, string[]>;
  /** Initial tidy positions; replaced once the user arranges + we persist (later). */
  positions: Map<string, Pos>;
}

// Staleness curve (tunable).
const FRESH_DAYS = 14;
const STALE_DAYS = 180;
const FLOOR = 0.35;
const NO_ACTIVITY = 0.6;
const LEVEL_GAP = 200; // radial distance between tree depths

export function buildBoardModel(
  sb: Switchboard,
  now: Date,
  overrides: Map<string, string> = new Map(),
): BoardModel {
  const parentOf = deriveParents(sb, overrides);
  const childrenOf = invertToChildren(parentOf);

  const cards: BoardCard[] = [...sb.people.values()].map((p) => ({
    id: p.id,
    name: p.name,
    isSelf: p.isSelf,
    photo: p.photo,
    role: p.role,
    company: p.company,
    freshness: freshnessOf(lastInteractionDate(sb, p.id), now),
  }));

  const links: BoardLink[] = [...sb.handshakes.values()]
    .filter((h) => sb.people.has(h.people[0]) && sb.people.has(h.people[1]))
    .map((h) => {
      const [a, b] = h.people;
      const treeEdge = parentOf.get(a) === b || parentOf.get(b) === a;
      return { a, b, strength: h.strength, treeEdge };
    });

  const positions = sb.self
    ? radialLayout(sb.self.id, childrenOf)
    : gridFallback([...sb.people.keys()]);

  return { cards, links, parentOf, childrenOf, positions };
}

// parent(X) = (c) manual override ?? (a) introducer on the self↔X handshake
//           ?? nearest neighbor toward self (BFS, the robust fallback) ?? self.
function deriveParents(sb: Switchboard, overrides: Map<string, string>): Map<string, string | null> {
  const parentOf = new Map<string, string | null>();
  const self = sb.self;
  if (!self) {
    for (const id of sb.people.keys()) parentOf.set(id, null);
    return parentOf;
  }
  parentOf.set(self.id, null);

  const bfsParent = bfsParents(sb, self.id);
  for (const id of sb.people.keys()) {
    if (id === self.id) continue;
    parentOf.set(id, chooseParent(sb, self.id, id, overrides, bfsParent));
  }
  return repairCycles(parentOf, self.id, bfsParent);
}

function bfsParents(sb: Switchboard, selfId: string): Map<string, string> {
  const parent = new Map<string, string>();
  const seen = new Set<string>([selfId]);
  const queue: string[] = [selfId];
  while (queue.length) {
    const u = queue.shift()!;
    for (const v of [...(sb.adjacency.get(u) ?? [])].sort()) {
      if (seen.has(v)) continue;
      seen.add(v);
      parent.set(v, u);
      queue.push(v);
    }
  }
  return parent;
}

function chooseParent(
  sb: Switchboard,
  selfId: string,
  id: string,
  overrides: Map<string, string>,
  bfsParent: Map<string, string>,
): string {
  const override = overrides.get(id);
  if (override && override !== id && sb.people.has(override)) return override;

  const via = sb.handshakes.get(canonicalHandshakeId(selfId, id))?.establishedVia;
  if (via && via !== id && via !== selfId && sb.people.has(via)) return via;

  return bfsParent.get(id) ?? selfId;
}

// Ensure every parent chain reaches self without looping; otherwise reset to BFS/self.
function repairCycles(
  parentOf: Map<string, string | null>,
  selfId: string,
  bfsParent: Map<string, string>,
): Map<string, string | null> {
  for (const id of parentOf.keys()) {
    if (id === selfId) continue;
    const path = new Set<string>([id]);
    let cur = parentOf.get(id) ?? null;
    let reachesSelf = false;
    while (cur != null) {
      if (cur === selfId) { reachesSelf = true; break; }
      if (path.has(cur)) break; // cycle
      path.add(cur);
      cur = parentOf.get(cur) ?? null;
    }
    if (!reachesSelf) parentOf.set(id, bfsParent.get(id) ?? selfId);
  }
  return parentOf;
}

function invertToChildren(parentOf: Map<string, string | null>): Map<string, string[]> {
  const childrenOf = new Map<string, string[]>();
  for (const id of parentOf.keys()) childrenOf.set(id, childrenOf.get(id) ?? []);
  for (const [id, parent] of parentOf) {
    if (parent != null) (childrenOf.get(parent) ?? []).push(id);
  }
  for (const arr of childrenOf.values()) arr.sort();
  return childrenOf;
}

// Simple tidy radial layout: each subtree gets an angular wedge ∝ its leaf count.
function radialLayout(rootId: string, childrenOf: Map<string, string[]>): Map<string, Pos> {
  const pos = new Map<string, Pos>();
  const leaves = new Map<string, number>();

  const countLeaves = (id: string): number => {
    const kids = childrenOf.get(id) ?? [];
    if (kids.length === 0) {
      leaves.set(id, 1);
      return 1;
    }
    let sum = 0;
    for (const k of kids) sum += countLeaves(k);
    leaves.set(id, sum);
    return sum;
  };
  countLeaves(rootId);

  const place = (id: string, depth: number, a0: number, a1: number) => {
    const angle = (a0 + a1) / 2;
    const r = depth * LEVEL_GAP;
    pos.set(id, { x: r * Math.cos(angle), y: r * Math.sin(angle) });
    const kids = childrenOf.get(id) ?? [];
    const total = leaves.get(id) ?? 1;
    let a = a0;
    for (const k of kids) {
      const span = (a1 - a0) * ((leaves.get(k) ?? 1) / total);
      place(k, depth + 1, a, a + span);
      a += span;
    }
  };
  place(rootId, 0, 0, Math.PI * 2);
  return pos;
}

function gridFallback(ids: string[]): Map<string, Pos> {
  const pos = new Map<string, Pos>();
  ids.forEach((id, i) => pos.set(id, { x: (i % 6) * 200 - 500, y: Math.floor(i / 6) * 150 - 200 }));
  return pos;
}

function freshnessOf(last: string | undefined, now: Date): number {
  if (!last) return NO_ACTIVITY;
  const days = (now.getTime() - Date.parse(last)) / 86_400_000;
  if (Number.isNaN(days)) return NO_ACTIVITY;
  if (days <= FRESH_DAYS) return 1;
  if (days >= STALE_DAYS) return FLOOR;
  return 1 - (1 - FLOOR) * ((days - FRESH_DAYS) / (STALE_DAYS - FRESH_DAYS));
}
