// Id helpers. Pure and deterministic (code-unit order, never locale-dependent).

/** The two ids in canonical (alphabetical) order. */
export function canonicalPair(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a];
}

/**
 * The one canonical file id for an undirected pair: the two slugs joined
 * alphabetically, so a relationship has exactly one file. e.g. ("self",
 * "sarah-chen") -> "sarah-chen__self".
 */
export function canonicalHandshakeId(a: string, b: string): string {
  return canonicalPair(a, b).join("__");
}

/** "Sarah Chen" -> "sarah-chen". Strips diacritics, lowercases, hyphenates. */
export function slugify(input: string): string {
  const slug = input
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // strip combining marks left by NFKD (e.g. accents)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "untitled";
}

/** Anything with a `.has(id)` check - pass a store Map directly. */
interface Taken {
  has(id: string): boolean;
}

/** Returns `base`, or `base-2`, `base-3`... until one is free. */
function decollide(base: string, taken: Taken): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** Mint a free person id from a name. Pass the current `people` map as `taken`. */
export function mintPersonId(taken: Taken, name: string): string {
  return decollide(slugify(name), taken);
}

/** Mint a free goal id from a title. Pass the current `goals` map as `taken`. */
export function mintGoalId(taken: Taken, title: string): string {
  return decollide(slugify(title), taken);
}

/**
 * Mint a free, date-prefixed interaction id, e.g. "2026-05-29-dm-sarah-chen".
 * Pass the current `interactions` map as `taken`.
 */
export function mintInteractionId(taken: Taken, date: string, type: string, people: string[]): string {
  const who = people[0] ?? type;
  return decollide(`${date}-${slugify(`${type}-${who}`)}`, taken);
}
