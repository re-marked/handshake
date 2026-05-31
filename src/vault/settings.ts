// Per-network settings, persisted to `.handshake/settings.json`. The canonical store of
// preferences; the Settings modal and inline controls (density toggle, note-mode pin) both
// read/write these. Defensive like vault/layout.ts + vault/workspace.ts: every field falls back
// to its default rather than throwing.

import type { Strength } from "@/switchboard";
import type { NoteMode } from "@/workspace/model";

export type Theme = "dark" | "light" | "system";
export type Density = "compact" | "comfortable" | "spacious";

export interface Settings {
  /** App appearance. `system` follows the OS color scheme. */
  theme: Theme;
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
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  density: "comfortable",
  reduceMotion: false,
  noteDefault: "panel",
  showGoalsOnBoard: true,
  defaultTieStrength: "cold",
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
    theme: oneOf(o.theme, ["dark", "light", "system"] as const, DEFAULT_SETTINGS.theme),
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
  };
}
