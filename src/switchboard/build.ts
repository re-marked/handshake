import { kindFromRelpath, parseEntity } from "./parse";
import { canonicalHandshakeId } from "./ids";
import type { Entity, Goal, Handshake, Interaction, Person, VaultProblem } from "./types";

/** One markdown file from the vault. `relpath` is relative to the vault root. */
export interface VaultFile {
  relpath: string;
  text: string;
}

/**
 * The live in-memory state - what the board, pathfinder, and capture query.
 * The markdown files are the source of truth; this is a derived, rebuildable
 * cache. Building it never throws: every issue lands in `problems`.
 */
export interface Switchboard {
  people: Map<string, Person>;
  handshakes: Map<string, Handshake>;
  goals: Map<string, Goal>;
  interactions: Map<string, Interaction>;
  /** The isSelf person - BFS root. Null if the vault has none yet. */
  self: Person | null;
  /** person id -> neighbor ids (undirected). Sparse: isolated people are absent. */
  adjacency: Map<string, Set<string>>;
  /** person id -> their interactions, newest first. Drives staleness / photo-fade. */
  interactionsByPerson: Map<string, Interaction[]>;
  problems: VaultProblem[];
}

/** The four entity stores - the writable core of the state. */
export type EntityStores = Pick<Switchboard, "people" | "handshakes" | "goals" | "interactions">;

export function emptyStores(): EntityStores {
  return { people: new Map(), handshakes: new Map(), goals: new Map(), interactions: new Map() };
}

export function emptySwitchboard(): Switchboard {
  return { ...emptyStores(), self: null, adjacency: new Map(), interactionsByPerson: new Map(), problems: [] };
}

export function buildSwitchboard(files: VaultFile[]): Switchboard {
  const stores = emptyStores();
  const problems: VaultProblem[] = [];

  // Process in a stable order so "first wins" rules and problem lists are
  // reproducible regardless of how the OS enumerated the directory.
  const ordered = [...files].sort((a, b) => cmp(a.relpath, b.relpath));
  for (const file of ordered) {
    const relpath = file.relpath.replaceAll("\\", "/");
    if (!relpath.endsWith(".md")) continue; // not markdown - ignore silently
    if (!kindFromRelpath(relpath)) continue; // not in an entity folder - ignore silently
    const outcome = parseEntity(relpath, file.text);
    if (!outcome.ok) {
      problems.push(outcome.problem);
      continue;
    }
    problems.push(...outcome.warnings);
    storeInto(stores, outcome.entity, relpath, problems);
  }

  return deriveSwitchboard(stores, problems);
}

/**
 * Compute the derived state (self, adjacency, interactionsByPerson, referential
 * problems) from a set of stores. Shared by `buildSwitchboard` (parsed from
 * files) and `applyDiff` (from mutated stores). NB: only *referential* problems
 * are computed here; parse-time warnings must be supplied via `seedProblems`.
 */
export function deriveSwitchboard(stores: EntityStores, seedProblems: VaultProblem[] = []): Switchboard {
  const sb: Switchboard = {
    people: stores.people,
    handshakes: stores.handshakes,
    goals: stores.goals,
    interactions: stores.interactions,
    self: null,
    adjacency: new Map(),
    interactionsByPerson: new Map(),
    problems: [...seedProblems],
  };
  resolveSelf(sb);
  buildAdjacency(sb);
  buildInteractionsByPerson(sb);
  // NB: a goal.target that isn't in the vault is deliberately NOT a problem -
  // it's the normal "meet someone I haven't added yet" case pathfinding handles.
  sb.problems.sort(
    (a, b) => cmp(a.relpath, b.relpath) || cmp(a.severity, b.severity) || cmp(a.message, b.message),
  );
  return sb;
}

/** Most recent interaction date for a person, or undefined. Drives photo-fade staleness. */
export function lastInteractionDate(sb: Switchboard, personId: string): string | undefined {
  return sb.interactionsByPerson.get(personId)?.[0]?.date;
}

/** The vault-relative path a given entity lives at. */
export function relpathOf(entity: Entity): string {
  const dir =
    entity.kind === "person" ? "people"
    : entity.kind === "handshake" ? "handshakes"
    : entity.kind === "goal" ? "goals"
    : "interactions";
  return `${dir}/${entity.id}.md`;
}

// ── build steps ──────────────────────────────────────────────────────────────

function storeInto(stores: EntityStores, entity: Entity, relpath: string, problems: VaultProblem[]): void {
  switch (entity.kind) {
    case "person": putUnique(stores.people, entity, relpath, problems); break;
    case "handshake": putUnique(stores.handshakes, entity, relpath, problems); break;
    case "goal": putUnique(stores.goals, entity, relpath, problems); break;
    case "interaction": putUnique(stores.interactions, entity, relpath, problems); break;
  }
}

function putUnique<T extends Entity>(
  map: Map<string, T>, entity: T, relpath: string, problems: VaultProblem[],
): void {
  if (map.has(entity.id)) {
    problems.push(warn(relpath, `duplicate ${entity.kind} id "${entity.id}"; keeping the first, ignoring this`));
    return;
  }
  map.set(entity.id, entity);
}

function resolveSelf(sb: Switchboard): void {
  const selves = [...sb.people.values()].filter((p) => p.isSelf).sort((a, b) => cmp(a.id, b.id));
  if (selves.length === 0) {
    if (sb.people.size > 0) {
      sb.problems.push(warn("(vault)", "no self node (isSelf: true) - pathfinding has no root"));
    }
    return;
  }
  sb.self = selves[0];
  if (selves.length > 1) {
    const ids = selves.map((s) => s.id).join(", ");
    sb.problems.push(warn("(vault)", `multiple self nodes (${ids}); using "${selves[0].id}"`));
  }
}

function buildAdjacency(sb: Switchboard): void {
  const seenPairs = new Set<string>();
  for (const h of sb.handshakes.values()) {
    const rel = relpathOf(h);
    const [a, b] = h.people;
    const canon = canonicalHandshakeId(a, b);

    if (h.id !== canon) {
      sb.problems.push(warn(rel, `non-canonical filename; this pair's canonical file is "${canon}.md"`));
    }
    if (a === b) {
      sb.problems.push(warn(rel, `handshake links "${a}" to itself`));
      continue;
    }
    if (seenPairs.has(canon)) {
      sb.problems.push(warn(rel, `duplicate handshake for pair "${canon}"; ignoring this one`));
      continue;
    }
    seenPairs.add(canon);

    const aKnown = sb.people.has(a);
    const bKnown = sb.people.has(b);
    if (!aKnown) sb.problems.push(warn(rel, `references unknown person "${a}"`));
    if (!bKnown) sb.problems.push(warn(rel, `references unknown person "${b}"`));
    if (aKnown && bKnown) {
      addEdge(sb.adjacency, a, b);
      addEdge(sb.adjacency, b, a);
    }
    if (h.establishedVia && !sb.people.has(h.establishedVia)) {
      sb.problems.push(warn(rel, `establishedVia references unknown person "${h.establishedVia}"`));
    }
  }
}

function buildInteractionsByPerson(sb: Switchboard): void {
  for (const interaction of sb.interactions.values()) {
    const rel = relpathOf(interaction);
    for (const pid of new Set(interaction.people)) {
      if (!sb.people.has(pid)) {
        sb.problems.push(warn(rel, `references unknown person "${pid}"`));
        continue;
      }
      let list = sb.interactionsByPerson.get(pid);
      if (!list) {
        list = [];
        sb.interactionsByPerson.set(pid, list);
      }
      list.push(interaction);
    }
  }
  for (const list of sb.interactionsByPerson.values()) {
    list.sort((x, y) => cmp(y.date, x.date) || cmp(y.id, x.id)); // newest first, deterministic
  }
}

// ── small pure helpers ───────────────────────────────────────────────────────

function addEdge(adjacency: Map<string, Set<string>>, from: string, to: string): void {
  let set = adjacency.get(from);
  if (!set) {
    set = new Set();
    adjacency.set(from, set);
  }
  set.add(to);
}

function warn(relpath: string, message: string): VaultProblem {
  return { relpath, severity: "warning", message };
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
