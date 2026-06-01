// Per-network settings, persisted to `.handshake/settings.json`. The canonical store of
// preferences; the Settings modal and inline controls (density toggle, note-mode pin) both
// read/write these. Defensive like vault/layout.ts + vault/workspace.ts: every field falls back
// to its default rather than throwing.

import type { Strength } from "@/switchboard";
import type { NoteMode } from "@/workspace/model";
import { HL_COLORS, type HlColor } from "@/views/remarkHighlight";

/** A note keyword that's auto-highlighted in its chosen color wherever it appears (#17). */
export interface HighlightKeyword {
  text: string;
  color: HlColor;
}

export type Theme = "dark" | "light" | "paper" | "system";
export type PaperVariant = "soft" | "vintage";
export type Density = "compact" | "comfortable" | "spacious";
export type AppScale = "small" | "default" | "large" | "larger";
export type AppFont = "system" | "serif" | "mono";
export type TextWeight = "light" | "normal" | "medium";
export type TimeMachineMode = "manual" | "auto";
/** How hard stale cards dim when the fade is on. */
export type FadeStrength = "subtle" | "medium" | "strong";
export const CADENCE_MIN = 1;
export const CADENCE_MAX = 1440; // 1 day

/** Developer / debug preferences (off by default; surfaced in the Developer Settings section). */
export interface DevSettings {
  /** Show the ambient "Last snapshot" status line in the board corner. */
  showStatusLine: boolean;
  /** Automatically write a debug report when an error is captured. */
  autoReportOnError: boolean;
  /** Mask personal content (names / notes / handles / vault path) in debug reports. */
  redact: boolean;
}

/** Time Machine (git versioning) preferences for this network. */
export interface TimeMachineSettings {
  /** Whether the network is git-versioned at all. */
  enabled: boolean;
  /** `manual` = snapshot only on demand; `auto` = also snapshot after edits + on switch/close. */
  mode: TimeMachineMode;
  /** In `auto` mode, the shortest interval between automatic snapshots, in minutes (1–1440). */
  cadenceMin: number;
  /** Bookkeeping: when the last auto-snapshot ran (unix ms). Not user-facing. */
  lastSnapshotAt: number;
}

export interface Settings {
  /** App appearance. `system` follows the OS color scheme. */
  theme: Theme;
  /** Which paper look, when `theme` is `paper`. `soft` = gentle ivory; `vintage` = aged sepia + grain. */
  paperVariant: PaperVariant;
  /** Overall UI scale (drives the root font size; rem-based layout scales with it). */
  appScale: AppScale;
  /** UI font family. */
  font: AppFont;
  /** Base text weight. */
  textWeight: TextWeight;
  /** Row density for list views (People). */
  density: Density;
  /** Tone down motion (springs/transitions) — respects framer's MotionConfig. */
  reduceMotion: boolean;
  /** Which mode a person's note opens in by default (panel / float / tab). */
  noteDefault: NoteMode;
  /** Show aspirational goal cards on the board. */
  showGoalsOnBoard: boolean;
  /** Strength a freshly-created connection starts at. */
  defaultTieStrength: Strength;
  /** Draw the faint dotted "introduced by" lines on the board. */
  showIntroducedBy: boolean;
  /** Fade cards by how long since you last interacted (staleness). Off = all cards full strength. */
  fadeStaleCards: boolean;
  /** How hard the staleness fade dims (when `fadeStaleCards` is on). */
  fadeStrength: FadeStrength;
  /** Time Machine (git versioning) preferences. */
  timeMachine: TimeMachineSettings;
  /** Developer / debug preferences. */
  dev: DevSettings;
  /** Note keywords auto-highlighted in the preview, in their chosen color. */
  highlightKeywords: HighlightKeyword[];
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  paperVariant: "soft",
  appScale: "default",
  font: "system",
  textWeight: "normal",
  density: "comfortable",
  reduceMotion: false,
  noteDefault: "panel",
  showGoalsOnBoard: true,
  defaultTieStrength: "cold",
  showIntroducedBy: true,
  fadeStaleCards: true,
  fadeStrength: "medium",
  // Frequent by default — snapshots are tiny, and dense history makes the best visuals over time.
  timeMachine: { enabled: true, mode: "auto", cadenceMin: 5, lastSnapshotAt: 0 },
  dev: { showStatusLine: false, autoReportOnError: false, redact: false },
  highlightKeywords: [],
};

export function serializeSettings(s: Settings): string {
  return JSON.stringify(s, null, 2);
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

export function parseSettings(json: string): Settings {
  if (!json.trim()) return { ...DEFAULT_SETTINGS };
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
  if (!data || typeof data !== "object") return { ...DEFAULT_SETTINGS };
  const o = data as Record<string, unknown>;
  return {
    theme: oneOf(o.theme, ["dark", "light", "paper", "system"] as const, DEFAULT_SETTINGS.theme),
    paperVariant: oneOf(o.paperVariant, ["soft", "vintage"] as const, DEFAULT_SETTINGS.paperVariant),
    appScale: oneOf(o.appScale, ["small", "default", "large", "larger"] as const, DEFAULT_SETTINGS.appScale),
    font: oneOf(o.font, ["system", "serif", "mono"] as const, DEFAULT_SETTINGS.font),
    textWeight: oneOf(o.textWeight, ["light", "normal", "medium"] as const, DEFAULT_SETTINGS.textWeight),
    density: oneOf(o.density, ["compact", "comfortable", "spacious"] as const, DEFAULT_SETTINGS.density),
    reduceMotion: typeof o.reduceMotion === "boolean" ? o.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
    noteDefault: oneOf(o.noteDefault, ["panel", "float", "tab"] as const, DEFAULT_SETTINGS.noteDefault),
    showGoalsOnBoard:
      typeof o.showGoalsOnBoard === "boolean" ? o.showGoalsOnBoard : DEFAULT_SETTINGS.showGoalsOnBoard,
    defaultTieStrength: oneOf(
      o.defaultTieStrength,
      ["close", "warm", "cold", "dormant"] as const,
      DEFAULT_SETTINGS.defaultTieStrength,
    ),
    showIntroducedBy:
      typeof o.showIntroducedBy === "boolean" ? o.showIntroducedBy : DEFAULT_SETTINGS.showIntroducedBy,
    fadeStaleCards: typeof o.fadeStaleCards === "boolean" ? o.fadeStaleCards : DEFAULT_SETTINGS.fadeStaleCards,
    fadeStrength: oneOf(o.fadeStrength, ["subtle", "medium", "strong"] as const, DEFAULT_SETTINGS.fadeStrength),
    timeMachine: parseTimeMachine(o.timeMachine),
    dev: parseDev(o.dev),
    highlightKeywords: parseKeywords(o.highlightKeywords),
  };
}

function parseKeywords(v: unknown): HighlightKeyword[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({ text: typeof x.text === "string" ? x.text : "", color: oneOf(x.color, HL_COLORS, "yellow") }))
    .filter((k) => k.text.trim())
    .slice(0, 50);
}

function parseDev(v: unknown): DevSettings {
  const d = DEFAULT_SETTINGS.dev;
  if (!v || typeof v !== "object") return { ...d };
  const o = v as Record<string, unknown>;
  const bool = (x: unknown, fb: boolean) => (typeof x === "boolean" ? x : fb);
  return {
    showStatusLine: bool(o.showStatusLine, d.showStatusLine),
    autoReportOnError: bool(o.autoReportOnError, d.autoReportOnError),
    redact: bool(o.redact, d.redact),
  };
}

function parseTimeMachine(v: unknown): TimeMachineSettings {
  const d = DEFAULT_SETTINGS.timeMachine;
  if (!v || typeof v !== "object") return { ...d };
  const o = v as Record<string, unknown>;
  return {
    enabled: typeof o.enabled === "boolean" ? o.enabled : d.enabled,
    mode: oneOf(o.mode, ["manual", "auto"] as const, d.mode),
    cadenceMin: parseCadence(o.cadenceMin ?? o.cadence, d.cadenceMin),
    lastSnapshotAt: typeof o.lastSnapshotAt === "number" && isFinite(o.lastSnapshotAt) ? o.lastSnapshotAt : 0,
  };
}

/** Cadence in minutes (1–1440). Accepts a number, or the legacy "15m"/"1h"/"1d" strings. */
function parseCadence(v: unknown, fallback: number): number {
  if (typeof v === "number" && isFinite(v)) return Math.max(CADENCE_MIN, Math.min(CADENCE_MAX, Math.round(v)));
  if (typeof v === "string") {
    const legacy: Record<string, number> = { "15m": 15, "1h": 60, "1d": 1440 };
    if (v in legacy) return legacy[v];
  }
  return fallback;
}
