// ── Switchboard: the pure vault engine ──────────────────────────────────────
// Domain types for the four entities. These map 1:1 to markdown files on disk.
// `kind` is the in-memory discriminant (derived from the folder, never stored).

export type KnownChannel =
  | "twitter" | "linkedin" | "email" | "telegram"
  | "discord" | "github" | "zoom" | "irl";

/** Known channels, but open – the vault may use others. */
export type Channel = KnownChannel | (string & {});

export type Strength = "close" | "warm" | "cold" | "dormant";
export type GoalType = "target" | "class";
export type GoalStatus = "open" | "active" | "done" | "abandoned";
export type SuggestedAction = "reply" | "dm" | "email" | "post" | "irl";
export type InteractionType =
  | "dm" | "email" | "call" | "thread"
  | "reply" | "mention" | "intro" | "irl" | "note";

/** A full calendar date, e.g. "2026-05-26". */
export type IsoDate = string;
/** Intentionally coarse, e.g. "2025" or "2025-08" (handshake.establishedAt). */
export type PartialDate = string;

export type EntityKind = "person" | "handshake" | "goal" | "interaction";

/** One position a person holds – a role at a company. Either field may stand alone. */
export interface Affiliation {
  role?: string;
  company?: string;
}

export interface Person {
  kind: "person";
  /** = filename slug. Immutable; renaming `name` never moves the file. */
  id: string;
  name: string;
  isSelf: boolean;
  /** relpath into attachments/, e.g. "attachments/sarah-chen.jpg" */
  photo?: string;
  tags: string[];
  /** Roles/companies held, in order; the first is the headline shown on cards. [] = unknown. */
  affiliations: Affiliation[];
  handles: Partial<Record<Channel, string>>;
  primaryChannel?: Channel;
  howWeMet?: string;
  howWeMetUrl?: string;
  createdAt?: IsoDate;
  /** Free-form markdown scratchpad. Preserved verbatim across writes. */
  body: string;
}

export interface HandshakeOrigin {
  channel?: Channel;
  /** URL to the originating tweet / thread / message. */
  artifact?: string;
  context?: string;
}

export interface Handshake {
  kind: "handshake";
  /** Canonical "alice__bob" (slugs sorted) – one file per pair. */
  id: string;
  people: [string, string];
  strength: Strength;
  establishedAt?: PartialDate;
  /** Person id, if one introduced the other. */
  establishedVia?: string;
  origin?: HandshakeOrigin;
  body: string;
}

export interface GoalCriteria {
  tags?: string[];
  count?: number;
}

export interface Goal {
  kind: "goal";
  id: string;
  type: GoalType;
  title: string;
  /** Person id (type=target). */
  target?: string;
  /** Saved-search criteria (type=class). */
  criteria?: GoalCriteria;
  deadline?: IsoDate;
  status: GoalStatus;
  suggestedAction?: SuggestedAction;
  body: string;
}

export interface Interaction {
  kind: "interaction";
  /** From the date-prefixed filename, e.g. "2026-05-26-coffee-sarah". */
  id: string;
  date: IsoDate;
  type: InteractionType;
  channel?: Channel;
  /** Person ids involved. */
  people: string[];
  body: string;
}

export type Entity = Person | Handshake | Goal | Interaction;

/** A problem found while reading the vault. Never fatal – surfaced, not thrown. */
export interface VaultProblem {
  relpath: string;
  severity: "error" | "warning";
  message: string;
}
