import { lastInteractionDate, type Strength, type Switchboard } from "@/switchboard";

/** A person as a force-graph node. The optional fields are mutated by d3-force at runtime. */
export interface GraphNode {
  id: string;
  label: string;
  isSelf: boolean;
  /** 0..1 recency: 1 = recently touched, low = gone quiet. Drives node opacity (staleness). */
  freshness: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

/** A handshake as a force-graph link. d3-force resolves `source`/`target` from id to node. */
export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  strength: Strength;
  index?: number;
}

export interface GraphModel {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Staleness curve (tunable). Recent → full strength; long-neglected → a legible floor.
const FRESH_DAYS = 14;
const STALE_DAYS = 180;
const FLOOR = 0.3;
const NO_ACTIVITY = 0.55; // never logged an interaction → neutral, not "neglected"

/** Derive the graph (nodes + links) from the live Switchboard. Pure; `now` is injected. */
export function toGraphModel(sb: Switchboard, now: Date): GraphModel {
  const nodes: GraphNode[] = [...sb.people.values()].map((p) => ({
    id: p.id,
    label: p.name,
    isSelf: p.isSelf,
    freshness: freshnessOf(lastInteractionDate(sb, p.id), now),
  }));

  const links: GraphLink[] = [...sb.handshakes.values()]
    .filter((h) => sb.people.has(h.people[0]) && sb.people.has(h.people[1]))
    .map((h) => ({ source: h.people[0], target: h.people[1], strength: h.strength }));

  return { nodes, links };
}

function freshnessOf(last: string | undefined, now: Date): number {
  if (!last) return NO_ACTIVITY;
  const days = (now.getTime() - Date.parse(last)) / 86_400_000;
  if (Number.isNaN(days)) return NO_ACTIVITY;
  if (days <= FRESH_DAYS) return 1;
  if (days >= STALE_DAYS) return FLOOR;
  return 1 - (1 - FLOOR) * ((days - FRESH_DAYS) / (STALE_DAYS - FRESH_DAYS));
}
