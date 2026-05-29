import { dump as yamlDump, JSON_SCHEMA } from "js-yaml";
import type { Entity, Goal, Handshake, Interaction, Person } from "./types";

const DUMP_OPTS = {
  schema: JSON_SCHEMA,
  lineWidth: -1, // never fold long strings (URLs, notes) across lines
  noRefs: true,
  quotingType: '"' as const,
  forceQuotes: false,
};

/**
 * Entity → markdown file text. The body is preserved verbatim; frontmatter is
 * emitted in a fixed key order with empty fields omitted, so re-writing a file
 * the app already owns produces a byte-identical result (clean git diffs).
 */
export function serializeEntity(entity: Entity): string {
  const yamlText = yamlDump(frontmatterOf(entity), DUMP_OPTS).trimEnd();
  const head = `---\n${yamlText}\n---\n`;
  const body = entity.body.trim();
  return body ? `${head}${body}\n` : head;
}

function frontmatterOf(e: Entity): Record<string, unknown> {
  switch (e.kind) {
    case "person": return personFrontmatter(e);
    case "handshake": return handshakeFrontmatter(e);
    case "goal": return goalFrontmatter(e);
    case "interaction": return interactionFrontmatter(e);
  }
}

function personFrontmatter(p: Person): Record<string, unknown> {
  const fm: Record<string, unknown> = { id: p.id, name: p.name, isSelf: p.isSelf };
  if (p.photo) fm.photo = p.photo;
  if (p.tags.length) fm.tags = p.tags;
  if (p.role) fm.role = p.role;
  if (p.company) fm.company = p.company;
  if (Object.keys(p.handles).length) fm.handles = p.handles;
  if (p.primaryChannel) fm.primaryChannel = p.primaryChannel;
  if (p.howWeMet) fm.howWeMet = p.howWeMet;
  if (p.howWeMetUrl) fm.howWeMetUrl = p.howWeMetUrl;
  if (p.createdAt) fm.createdAt = p.createdAt;
  return fm;
}

function handshakeFrontmatter(h: Handshake): Record<string, unknown> {
  const fm: Record<string, unknown> = { people: h.people, strength: h.strength };
  if (h.establishedAt) fm.establishedAt = h.establishedAt;
  if (h.establishedVia) fm.establishedVia = h.establishedVia;
  if (h.origin) fm.origin = h.origin;
  return fm;
}

function goalFrontmatter(g: Goal): Record<string, unknown> {
  const fm: Record<string, unknown> = { id: g.id, type: g.type, title: g.title };
  if (g.target) fm.target = g.target;
  if (g.criteria) fm.criteria = g.criteria;
  if (g.deadline) fm.deadline = g.deadline;
  fm.status = g.status;
  if (g.suggestedAction) fm.suggestedAction = g.suggestedAction;
  return fm;
}

function interactionFrontmatter(i: Interaction): Record<string, unknown> {
  const fm: Record<string, unknown> = { date: i.date, type: i.type };
  if (i.channel) fm.channel = i.channel;
  fm.people = i.people;
  return fm;
}
