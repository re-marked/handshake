import { canonicalHandshakeId } from "./ids";
import { serializeEntity } from "./serialize";
import { deriveSwitchboard, relpathOf, type EntityStores, type Switchboard } from "./build";
import type { Entity, EntityKind, Goal, Handshake, Interaction, Person } from "./types";

// Patches exclude identity fields. Changing a handshake's `people` or any
// entity's `id` is a delete+create, not an update.
export type PersonPatch = Partial<Omit<Person, "kind" | "id">>;
export type HandshakePatch = Partial<Omit<Handshake, "kind" | "id" | "people">>;
export type GoalPatch = Partial<Omit<Goal, "kind" | "id">>;
export type InteractionPatch = Partial<Omit<Interaction, "kind" | "id">>;

/**
 * A single intended change. Create mutations carry the *whole* entity (the
 * producer mints its id first, via the helpers in ids.ts), which keeps applyDiff
 * pure and makes every create/delete an exact inverse of the other.
 */
export type Mutation =
  | { op: "createPerson"; person: Person }
  | { op: "updatePerson"; id: string; patch: PersonPatch }
  | { op: "deletePerson"; id: string }
  | { op: "createHandshake"; handshake: Handshake }
  | { op: "updateHandshake"; id: string; patch: HandshakePatch }
  | { op: "deleteHandshake"; id: string }
  | { op: "createGoal"; goal: Goal }
  | { op: "updateGoal"; id: string; patch: GoalPatch }
  | { op: "deleteGoal"; id: string }
  | { op: "logInteraction"; interaction: Interaction }
  | { op: "updateInteraction"; id: string; patch: InteractionPatch }
  | { op: "deleteInteraction"; id: string };

export type Diff = Mutation[];

/** A file operation for the Rust shell to perform: write/overwrite, or delete. */
export type FileWrite =
  | { relpath: string; text: string }
  | { relpath: string; delete: true };

export interface ApplyResult {
  ok: boolean;
  /** File operations to perform on disk (empty when !ok). */
  writes: FileWrite[];
  /** The diff that undoes this one (empty when !ok). */
  inverse: Diff;
  /** Ids of entities created, for the caller to act on (e.g. select the new card). */
  created: Array<{ kind: EntityKind; id: string }>;
  /** Resulting state on success; the unchanged input state on failure. */
  next: Switchboard;
  errors: string[];
}

/**
 * The one and only writer. Pure: validates the whole diff against a working copy
 * and either applies all of it or none of it, returning the file writes to make,
 * the inverse (undo), and the resulting state. The Rust shell performs the writes.
 */
export function applyDiff(sb: Switchboard, diff: Diff): ApplyResult {
  const stores: EntityStores = {
    people: new Map(sb.people),
    handshakes: new Map(sb.handshakes),
    goals: new Map(sb.goals),
    interactions: new Map(sb.interactions),
  };
  const writes: FileWrite[] = [];
  const inverse: Diff = [];
  const created: ApplyResult["created"] = [];

  for (const mutation of diff) {
    const step = applyOne(stores, mutation);
    if ("error" in step) {
      return { ok: false, writes: [], inverse: [], created: [], next: sb, errors: [step.error] };
    }
    writes.push(step.write);
    inverse.unshift(step.inverse); // reverse order: undo last-applied first
    if (step.created) created.push(step.created);
  }

  return { ok: true, writes, inverse, created, next: deriveSwitchboard(stores), errors: [] };
}

// ── per-mutation application ─────────────────────────────────────────────────

type Step =
  | { error: string }
  | { write: FileWrite; inverse: Mutation; created?: { kind: EntityKind; id: string } };

function applyOne(stores: EntityStores, m: Mutation): Step {
  switch (m.op) {
    case "createPerson": {
      if (stores.people.has(m.person.id)) return { error: `person "${m.person.id}" already exists` };
      stores.people.set(m.person.id, m.person);
      return creation(m.person);
    }
    case "createHandshake": {
      const problem = validateHandshake(stores, m.handshake);
      if (problem) return { error: problem };
      stores.handshakes.set(m.handshake.id, m.handshake);
      return creation(m.handshake);
    }
    case "createGoal": {
      if (stores.goals.has(m.goal.id)) return { error: `goal "${m.goal.id}" already exists` };
      stores.goals.set(m.goal.id, m.goal);
      return creation(m.goal);
    }
    case "logInteraction": {
      const problem = validateInteraction(stores, m.interaction);
      if (problem) return { error: problem };
      stores.interactions.set(m.interaction.id, m.interaction);
      return creation(m.interaction);
    }

    case "deletePerson": return remove(stores.people, "person", m.id);
    case "deleteHandshake": return remove(stores.handshakes, "handshake", m.id);
    case "deleteGoal": return remove(stores.goals, "goal", m.id);
    case "deleteInteraction": return remove(stores.interactions, "interaction", m.id);

    case "updatePerson":
      return update(stores.people, "person", m.id, m.patch,
        (id, patch) => ({ op: "updatePerson", id, patch: patch as PersonPatch }));
    case "updateHandshake":
      return update(stores.handshakes, "handshake", m.id, m.patch,
        (id, patch) => ({ op: "updateHandshake", id, patch: patch as HandshakePatch }));
    case "updateGoal":
      return update(stores.goals, "goal", m.id, m.patch,
        (id, patch) => ({ op: "updateGoal", id, patch: patch as GoalPatch }));
    case "updateInteraction":
      return update(stores.interactions, "interaction", m.id, m.patch,
        (id, patch) => ({ op: "updateInteraction", id, patch: patch as InteractionPatch }));
  }
}

// ── shared steps ─────────────────────────────────────────────────────────────

function creation(entity: Entity): Step {
  return {
    write: { relpath: relpathOf(entity), text: serializeEntity(entity) },
    inverse: deleteMutation(entity.kind, entity.id),
    created: { kind: entity.kind, id: entity.id },
  };
}

function remove<T extends Entity>(map: Map<string, T>, kind: EntityKind, id: string): Step {
  const existing = map.get(id);
  if (!existing) return { error: `cannot delete missing ${kind} "${id}"` };
  map.delete(id);
  return { write: { relpath: relpathOf(existing), delete: true }, inverse: createMutation(existing) };
}

function update<T extends Entity>(
  map: Map<string, T>,
  kind: EntityKind,
  id: string,
  patch: Partial<T>,
  mkInverse: (id: string, oldPatch: Partial<T>) => Mutation,
): Step {
  const old = map.get(id);
  if (!old) return { error: `cannot update missing ${kind} "${id}"` };
  const keys = Object.keys(patch) as (keyof T)[];
  const oldPatch: Partial<T> = {};
  for (const k of keys) oldPatch[k] = old[k];
  const updated = { ...old, ...patch } as T;
  map.set(id, updated);
  return { write: { relpath: relpathOf(updated), text: serializeEntity(updated) }, inverse: mkInverse(id, oldPatch) };
}

// ── validation ───────────────────────────────────────────────────────────────

function validateHandshake(stores: EntityStores, h: Handshake): string | null {
  const [a, b] = h.people;
  if (a === b) return `handshake "${h.id}" links a person to themselves`;
  if (h.id !== canonicalHandshakeId(a, b)) return `handshake "${h.id}" is not the canonical id for [${a}, ${b}]`;
  if (stores.handshakes.has(h.id)) return `handshake "${h.id}" already exists`;
  if (!stores.people.has(a)) return `handshake "${h.id}" references unknown person "${a}"`;
  if (!stores.people.has(b)) return `handshake "${h.id}" references unknown person "${b}"`;
  return null;
}

function validateInteraction(stores: EntityStores, i: Interaction): string | null {
  if (stores.interactions.has(i.id)) return `interaction "${i.id}" already exists`;
  for (const pid of new Set(i.people)) {
    if (!stores.people.has(pid)) return `interaction "${i.id}" references unknown person "${pid}"`;
  }
  return null;
}

// ── inverse builders ─────────────────────────────────────────────────────────

function deleteMutation(kind: EntityKind, id: string): Mutation {
  switch (kind) {
    case "person": return { op: "deletePerson", id };
    case "handshake": return { op: "deleteHandshake", id };
    case "goal": return { op: "deleteGoal", id };
    case "interaction": return { op: "deleteInteraction", id };
  }
}

function createMutation(entity: Entity): Mutation {
  switch (entity.kind) {
    case "person": return { op: "createPerson", person: entity };
    case "handshake": return { op: "createHandshake", handshake: entity };
    case "goal": return { op: "createGoal", goal: entity };
    case "interaction": return { op: "logInteraction", interaction: entity };
  }
}
