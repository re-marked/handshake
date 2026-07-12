import { load as yamlLoad, JSON_SCHEMA } from "js-yaml";
import type {
  Affiliation,
  Channel,
  Entity,
  EntityKind,
  GoalCriteria,
  HandshakeOrigin,
  VaultProblem,
} from "./types";

// We split frontmatter by hand and parse it with js-yaml directly. We deliberately
// do NOT use gray-matter: it `require('fs')`s and uses Node's `Buffer`, neither of
// which exists in the WebView2 runtime – so it silently fails to parse anything in
// the real app (all entities vanish). js-yaml is browser-safe. JSON_SCHEMA also
// kills the YAML footguns: no auto-dates, no "Norway problem" (no→false), no octal.
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?([\s\S]*)$/;

function splitFrontmatter(text: string): { data: Record<string, unknown>; body: string } {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // strip BOM
  const match = FRONTMATTER.exec(clean);
  if (!match) return { data: {}, body: clean };
  const loaded = yamlLoad(match[1], { schema: JSON_SCHEMA });
  const data = loaded && typeof loaded === "object" ? (loaded as Record<string, unknown>) : {};
  return { data, body: match[2] ?? "" };
}

const KIND_BY_DIR: Record<string, EntityKind> = {
  people: "person",
  handshakes: "handshake",
  goals: "goal",
  interactions: "interaction",
};

const STRENGTHS = ["close", "warm", "cold", "dormant"] as const;
const GOAL_TYPES = ["target", "class"] as const;
const GOAL_STATUSES = ["open", "active", "done", "abandoned"] as const;
const INTERACTION_TYPES = [
  "dm", "email", "call", "thread", "reply", "mention", "intro", "irl", "note",
] as const;
const SUGGESTED_ACTIONS = ["reply", "dm", "email", "post", "irl"] as const;

export type ParseOutcome =
  | { ok: true; entity: Entity; warnings: VaultProblem[] }
  | { ok: false; problem: VaultProblem };

/** Maps "people/sarah-chen.md" → "person". Null if not in a known vault folder. */
export function kindFromRelpath(relpath: string): EntityKind | null {
  const top = relpath.split("/")[0];
  return KIND_BY_DIR[top] ?? null;
}

/** "people/sarah-chen.md" → "sarah-chen". The id is the filename. */
export function idFromRelpath(relpath: string): string {
  const base = relpath.split("/").pop() ?? relpath;
  return base.replace(/\.md$/i, "");
}

export function parseEntity(relpath: string, text: string): ParseOutcome {
  const kind = kindFromRelpath(relpath);
  if (!kind) return { ok: false, problem: err(relpath, "not inside a known vault folder") };

  let data: Record<string, unknown>;
  let body: string;
  try {
    const fm = splitFrontmatter(text);
    data = fm.data;
    body = normalizeBody(fm.body);
  } catch (e) {
    return { ok: false, problem: err(relpath, `invalid frontmatter: ${(e as Error).message}`) };
  }

  const id = idFromRelpath(relpath);
  const warnings: VaultProblem[] = [];

  switch (kind) {
    case "person": {
      const idField = str(data.id);
      if (idField && idField !== id) {
        warnings.push(warn(relpath, `frontmatter id "${idField}" != filename; using "${id}"`));
      }
      if (!str(data.name)) warnings.push(warn(relpath, `missing "name"; using id`));
      const entity: Entity = {
        kind: "person",
        id,
        name: str(data.name) ?? id,
        isSelf: data.isSelf === true,
        photo: str(data.photo),
        tags: strArray(data.tags),
        affiliations: parseAffiliations(data),
        handles: parseHandles(data.handles),
        primaryChannel: str(data.primaryChannel),
        howWeMet: str(data.howWeMet),
        howWeMetUrl: str(data.howWeMetUrl),
        createdAt: dateish(data.createdAt),
        body,
      };
      return { ok: true, entity, warnings };
    }

    case "handshake": {
      const ppl = strArray(data.people);
      if (ppl.length !== 2) {
        return { ok: false, problem: err(relpath, `handshake needs exactly 2 people, got ${ppl.length}`) };
      }
      const entity: Entity = {
        kind: "handshake",
        id,
        people: [ppl[0], ppl[1]],
        strength: enumOr(data.strength, STRENGTHS, "cold", "strength", relpath, warnings),
        establishedAt: dateish(data.establishedAt),
        establishedVia: str(data.establishedVia),
        origin: parseOrigin(data.origin),
        body,
      };
      return { ok: true, entity, warnings };
    }

    case "goal": {
      if (!str(data.title)) warnings.push(warn(relpath, `missing "title"; using id`));
      const entity: Entity = {
        kind: "goal",
        id,
        type: enumOr(data.type, GOAL_TYPES, "target", "type", relpath, warnings),
        title: str(data.title) ?? id,
        target: str(data.target),
        criteria: parseCriteria(data.criteria),
        deadline: dateish(data.deadline),
        status: enumOr(data.status, GOAL_STATUSES, "open", "status", relpath, warnings),
        suggestedAction: optEnum(data.suggestedAction, SUGGESTED_ACTIONS, "suggestedAction", relpath, warnings),
        body,
      };
      return { ok: true, entity, warnings };
    }

    case "interaction": {
      const date = dateish(data.date);
      if (!date) return { ok: false, problem: err(relpath, `interaction missing required "date"`) };
      const entity: Entity = {
        kind: "interaction",
        id,
        date,
        type: enumOr(data.type, INTERACTION_TYPES, "note", "type", relpath, warnings),
        channel: str(data.channel),
        people: strArray(data.people),
        body,
      };
      return { ok: true, entity, warnings };
    }
  }

  return { ok: false, problem: err(relpath, `unhandled kind "${kind}"`) };
}

// ── coercion helpers ─────────────────────────────────────────────────────────

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

/** Dates may arrive as strings ("2025-08") or, for bare years, numbers (2025). */
function dateish(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return undefined;
}

function strArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string") return [v];
  return [];
}

/**
 * A person's affiliations. Prefers the new `affiliations: [{role, company}]` list; falls back to
 * the legacy single `role`/`company` fields (so files written before 0.8.2 still read correctly).
 */
function parseAffiliations(data: Record<string, unknown>): Affiliation[] {
  if (Array.isArray(data.affiliations)) {
    const out: Affiliation[] = [];
    for (const item of data.affiliations) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const role = str(o.role);
      const company = str(o.company);
      if (role || company) out.push({ ...(role ? { role } : {}), ...(company ? { company } : {}) });
    }
    if (out.length) return out;
  }
  const role = str(data.role);
  const company = str(data.company);
  if (role || company) return [{ ...(role ? { role } : {}), ...(company ? { company } : {}) }];
  return [];
}

function parseHandles(v: unknown): Partial<Record<Channel, string>> {
  if (!v || typeof v !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "string") out[k] = val;
  }
  return out;
}

function parseOrigin(v: unknown): HandshakeOrigin | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const origin: HandshakeOrigin = {};
  if (str(o.channel)) origin.channel = str(o.channel);
  if (str(o.artifact)) origin.artifact = str(o.artifact);
  if (str(o.context)) origin.context = str(o.context);
  return Object.keys(origin).length ? origin : undefined;
}

function parseCriteria(v: unknown): GoalCriteria | undefined {
  if (!v || typeof v !== "object") return undefined;
  const c = v as Record<string, unknown>;
  const crit: GoalCriteria = {};
  const tags = strArray(c.tags);
  if (tags.length) crit.tags = tags;
  const count = num(c.count);
  if (count !== undefined) crit.count = count;
  return Object.keys(crit).length ? crit : undefined;
}

/** Required enum: falls back (and warns) if present-but-invalid; silent if absent. */
function enumOr<T extends string>(
  v: unknown, allowed: readonly T[], fallback: T,
  field: string, relpath: string, warnings: VaultProblem[],
): T {
  if (v === undefined || v === null) return fallback;
  if (typeof v === "string" && (allowed as readonly string[]).includes(v)) return v as T;
  warnings.push(warn(relpath, `invalid ${field} "${String(v)}"; defaulting to "${fallback}"`));
  return fallback;
}

/** Optional enum: undefined if absent; dropped (with a warning) if present-but-invalid. */
function optEnum<T extends string>(
  v: unknown, allowed: readonly T[],
  field: string, relpath: string, warnings: VaultProblem[],
): T | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string" && (allowed as readonly string[]).includes(v)) return v as T;
  warnings.push(warn(relpath, `invalid ${field} "${String(v)}"; dropping`));
  return undefined;
}

/** Strip leading blank lines and trailing whitespace; keep the prose between intact. */
function normalizeBody(content: string): string {
  return content.replace(/^(?:\r?\n)+/, "").replace(/\s+$/, "");
}

function err(relpath: string, message: string): VaultProblem {
  return { relpath, severity: "error", message };
}

function warn(relpath: string, message: string): VaultProblem {
  return { relpath, severity: "warning", message };
}
