// Backlinks: `[[Person Name]]` references written in a note body. They are DERIVED, never stored —
// scanned out of bodies at build time (like introduced-by edges from `establishedVia`), so they
// cost no schema, no extra files, and update on every commit. This module is the shared, pure
// resolver used by the engine (build.ts), the renderer (remarkBacklinks), and the editor.

import { slugify } from "./ids";
import type { Person } from "./types";

/** Matches `[[anything on one line]]`. A factory so each scan gets its own `lastIndex`. */
export const backlinkRegex = (): RegExp => /\[\[([^\]\n]+?)\]\]/g;

/** A lowercased+trimmed display name → person id index. First occurrence wins (deterministic). */
export function buildNameIndex(people: ReadonlyMap<string, Person>): Map<string, string> {
  const index = new Map<string, string>();
  for (const p of people.values()) {
    const key = p.name.trim().toLowerCase();
    if (key && !index.has(key)) index.set(key, p.id);
  }
  return index;
}

/**
 * Resolve a `[[ref]]`'s inner text to a person id: by display name first, then by slug
 * (so `[[Sarah Chen]]` finds the `sarah-chen` file even if the display name was edited).
 * Returns null when nothing matches — an "unresolved" link.
 */
export function resolvePersonRef(
  text: string,
  nameIndex: ReadonlyMap<string, string>,
  people: { has(id: string): boolean },
): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const byName = nameIndex.get(trimmed.toLowerCase());
  if (byName) return byName;
  const slug = slugify(trimmed);
  return people.has(slug) ? slug : null;
}
