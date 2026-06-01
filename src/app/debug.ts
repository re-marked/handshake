// Debug tooling — built primarily so Claude (who can't see the WebView2 runtime) can read the
// app's real state from a file on disk. A cheap always-on flight recorder + error capture feed a
// report written to `.handshake/debug/latest.md` (Markdown for humans + a JSON appendix that's
// precise for machines). Triggered manually, by hotkey, or auto-on-error (a dev setting).

import type { Settings } from "@/vault/settings";
import { leaves } from "@/workspace/ops";
import { viewKey } from "@/workspace/model";
import { buildLine } from "@/lib/buildInfo";
import { stackDepths } from "@/app/undo";
import { useApp } from "@/app/store";

export interface DebugEvent {
  t: number;
  kind: string;
  summary: string;
}
export interface DebugError {
  t: number;
  source: string;
  message: string;
  stack?: string;
}

const LOG_CAP = 200;
const ERR_CAP = 30;
const log: DebugEvent[] = [];
const errors: DebugError[] = [];

/** Record an app event into the in-memory flight recorder (cheap; no I/O). */
export function logEvent(kind: string, summary: string): void {
  log.push({ t: Date.now(), kind, summary });
  if (log.length > LOG_CAP) log.shift();
}

function recordError(source: string, message: string, stack?: string): void {
  errors.push({ t: Date.now(), source, message, stack });
  if (errors.length > ERR_CAP) errors.shift();
  const s = useApp.getState();
  if (s.settings.dev?.autoReportOnError && s.session) void writeReport("auto-on-error");
}

let installed = false;
/** Install global error capture (once). Cheap + always on — reports are only written on demand. */
export function initDebug(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (e) => recordError("window.onerror", e.message, e.error?.stack));
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason as { message?: string; stack?: string } | undefined;
    recordError("unhandledrejection", String(r?.message ?? r), r?.stack);
  });
  const orig = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    try {
      recordError("console.error", args.map((a) => (typeof a === "string" ? a : safeStr(a))).join(" "));
    } catch {
      /* never let logging break logging */
    }
    orig(...args);
  };
  logEvent("app", "debug capture initialised");
}

// ── report ───────────────────────────────────────────────────────────────────

interface ReportData {
  when: string;
  reason: string;
  version: string;
  build: string;
  platform: string;
  status: string;
  vault: string;
  counts: { people: number; handshakes: number; goals: number; interactions: number };
  self: string | null;
  openPersonId: string | null;
  deletingId: string | null;
  lastSnapshot: { id: string; time: number } | null;
  tmError: string | null;
  undo: { undo: number; redo: number };
  workspace: { activeLeafId: string; floats: number; leaves: { id: string; active: boolean; tabs: string[] }[] };
  settings: Settings;
  problems: { severity: string; relpath: string; message: string }[];
  events: DebugEvent[];
  errors: DebugError[];
}

/** Snapshot the live app state into a plain, serializable object. */
function gatherState(reason: string): ReportData {
  const s = useApp.getState();
  const sb = s.switchboard;
  const redact = s.settings.dev?.redact ?? false;
  const ls = leaves(s.workspace.root).map((l) => ({
    id: l.id,
    active: l.id === s.workspace.activeLeafId,
    tabs: l.tabs.map(viewKey),
  }));
  return {
    when: new Date().toISOString(),
    reason,
    version: __BUILD_INFO__.version,
    build: buildLine(),
    platform: redact ? "<redacted>" : typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    status: s.status,
    vault: redact ? "<redacted>" : (s.vaultPath ?? "—"),
    counts: {
      people: sb.people.size,
      handshakes: sb.handshakes.size,
      goals: sb.goals.size,
      interactions: sb.interactions.size,
    },
    self: sb.self?.id ?? null,
    openPersonId: s.openPersonId,
    deletingId: s.deletingId,
    lastSnapshot: s.lastSnapshot,
    tmError: s.tmError,
    undo: stackDepths(),
    workspace: {
      activeLeafId: s.workspace.activeLeafId,
      floats: s.workspace.floats.length,
      leaves: ls,
    },
    settings: s.settings,
    problems: sb.problems.slice(0, 50).map((p) => ({ severity: p.severity, relpath: p.relpath, message: p.message })),
    events: log.slice(-LOG_CAP),
    errors: errors.slice(-ERR_CAP),
  };
}

/** Render report data as Markdown (human-readable) with a JSON appendix (machine-precise). Pure. */
export function renderReport(d: ReportData): string {
  const clock = (t: number) => new Date(t).toLocaleTimeString();
  const out: string[] = [];
  out.push(`# Handshake debug report`);
  out.push(`_${d.when} · v${d.version} · reason: ${d.reason}_`);
  out.push("");
  out.push(`**Build:** ${d.build}`);
  out.push(`**Platform:** ${d.platform}`);
  out.push("");
  out.push(`## State`);
  out.push(`- status: \`${d.status}\``);
  out.push(`- vault: ${d.vault}`);
  out.push(
    `- people **${d.counts.people}** · handshakes **${d.counts.handshakes}** · goals **${d.counts.goals}** · interactions **${d.counts.interactions}** · self \`${d.self ?? "—"}\``,
  );
  out.push(`- openPersonId: \`${d.openPersonId ?? "—"}\` · deletingId: \`${d.deletingId ?? "—"}\``);
  out.push(`- undo depth: ${d.undo.undo} · redo depth: ${d.undo.redo}`);
  out.push(
    `- last snapshot: ${d.lastSnapshot ? `${new Date(d.lastSnapshot.time * 1000).toLocaleString()} · \`${d.lastSnapshot.id}\`` : "none"}`,
  );
  if (d.tmError) out.push(`- ⚠️ **Time Machine error:** ${d.tmError}`);
  out.push("");
  out.push(`## Workspace (active \`${d.workspace.activeLeafId}\`, ${d.workspace.floats} floats)`);
  for (const l of d.workspace.leaves) out.push(`- ${l.active ? "▶ " : "· "}\`${l.id}\`: ${l.tabs.join(", ") || "—"}`);
  out.push("");
  if (d.problems.length) {
    out.push(`## Vault problems (${d.problems.length})`);
    for (const p of d.problems.slice(0, 20)) out.push(`- **${p.severity}** ${p.relpath} — ${p.message}`);
    out.push("");
  }
  out.push(`## Recent events (${d.events.length})`);
  for (const e of d.events.slice(-40)) out.push(`- \`${clock(e.t)}\` **${e.kind}** — ${e.summary}`);
  out.push("");
  out.push(`## Errors (${d.errors.length})`);
  if (d.errors.length === 0) {
    out.push(`_none captured_`);
  } else {
    for (const e of d.errors) {
      out.push(`- \`${clock(e.t)}\` (${e.source}) ${e.message}`);
      if (e.stack) out.push("  ```\n  " + e.stack.split("\n").slice(0, 6).join("\n  ") + "\n  ```");
    }
  }
  out.push("");
  out.push(`<details><summary>Full JSON</summary>\n\n\`\`\`json\n${JSON.stringify(d, null, 2)}\n\`\`\`\n</details>`);
  return out.join("\n");
}

/** Build the full report (gather state → render). */
export function buildReport(reason: string): string {
  return renderReport(gatherState(reason));
}

/** Write the report to `.handshake/debug/` — a timestamped copy + the canonical latest.md.
 *  Resolves to latest.md's absolute path (so the UI can show where it landed), or null. */
export async function writeReport(reason = "manual"): Promise<string | null> {
  const session = useApp.getState().session;
  if (!session) return null;
  const md = buildReport(reason);
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await session.writeDebug(`report-${stamp}.md`, md);
    const path = await session.writeDebug("latest.md", md);
    logEvent("debug", `report written (${reason})`);
    return path;
  } catch {
    return null;
  }
}

function safeStr(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
