// Pure display/normalization helpers for a person's affiliations (role + company pairs).
// Kept tiny and import-free so both the engine (serialize/parse) and the UI can share them.

import type { Affiliation, Person } from "./types";

/** The headline affiliation (the first one), if any. */
export function primaryAffiliation(p: Person): Affiliation | undefined {
  return p.affiliations[0];
}

/** One affiliation as a single line, e.g. "Head of Growth · Linear". Empty if both fields blank. */
export function affiliationLabel(a: Affiliation | undefined): string {
  if (!a) return "";
  return [a.role, a.company].filter(Boolean).join(" · ");
}

/** All affiliations on one line, positions separated by a bullet: "Founder · Acme • Advisor · Beta". */
export function summarizeAffiliations(affs: Affiliation[]): string {
  return affs.map(affiliationLabel).filter(Boolean).join(" • ");
}

/** Drop affiliations where both fields are blank, and trim the rest. Used before persisting. */
export function pruneAffiliations(affs: Affiliation[]): Affiliation[] {
  return affs
    .map((a) => {
      const role = a.role?.trim();
      const company = a.company?.trim();
      const out: Affiliation = {};
      if (role) out.role = role;
      if (company) out.company = company;
      return out;
    })
    .filter((a) => a.role || a.company);
}

/** Every role + company across all affiliations – for search/filter keyword sets. */
export function affiliationTerms(affs: Affiliation[]): string[] {
  return affs.flatMap((a) => [a.role, a.company]).filter((x): x is string => !!x);
}
