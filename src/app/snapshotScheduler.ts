// Automatic Time Machine snapshots, in "auto" mode only. Triggers: a short quiet period after
// edits settle, when leaving a network, and on app close. Rate-limited to the chosen cadence and
// skipped when the repo is clean. An imperative singleton – reads useApp.getState() at fire time
// (no stale closures), so the store/UI never depend on it being a React component.

import { useApp } from "@/app/store";
import { logEvent } from "@/app/debug";
import type { VaultSession } from "@/vault/session";
import type { TimeMachineSettings } from "@/vault/settings";

const QUIET_MS = 8_000; // snapshot this long after the last edit

let quietTimer: ReturnType<typeof setTimeout> | null = null;
let lastSnapshotAt = 0; // in-memory mirror of settings.timeMachine.lastSnapshotAt
let busy = false;

function clearTimer() {
  if (quietTimer) {
    clearTimeout(quietTimer);
    quietTimer = null;
  }
}

/** Seed the rate-limiter from the freshly-loaded network (call right after a vault switch). */
export function seedFromSettings(): void {
  clearTimer();
  lastSnapshotAt = useApp.getState().settings.timeMachine.lastSnapshotAt || 0;
}

/** A data mutation happened – in auto mode, snapshot once edits go quiet. */
export function noteDataMutation(): void {
  const tm = useApp.getState().settings.timeMachine;
  if (!tm.enabled || tm.mode !== "auto") return;
  clearTimer();
  quietTimer = setTimeout(() => {
    quietTimer = null;
    void maybeSnapshot("Auto snapshot");
  }, QUIET_MS);
}

/** Snapshot if enabled + in auto mode + past the cadence + dirty. Re-arms when it's just too soon. */
async function maybeSnapshot(message: string): Promise<void> {
  if (busy) return;
  const s = useApp.getState();
  const tm = s.settings.timeMachine;
  const session = s.session;
  if (!session || !tm.enabled || tm.mode !== "auto") return;

  const remaining = tm.cadenceMin * 60_000 - (Date.now() - lastSnapshotAt);
  if (remaining > 0) {
    clearTimer(); // too soon – try again once the cadence elapses
    quietTimer = setTimeout(() => {
      quietTimer = null;
      void maybeSnapshot(message);
    }, remaining + 100);
    return;
  }

  busy = true;
  try {
    const status = await session.tmStatus();
    if (!status.isRepo || !status.dirty) return;
    const id = await session.tmSnapshot(message);
    if (id) markSnapshotted();
  } catch {
    // best-effort; never disrupt editing
  } finally {
    busy = false;
  }
}

/** Snapshot the OUTGOING network before a vault switch tears it down (ignores cadence). */
export async function flushOnLeave(session: VaultSession | null, tm: TimeMachineSettings): Promise<void> {
  clearTimer();
  if (!session || !tm.enabled || tm.mode !== "auto") return;
  await snapshotIfDirty(session, "Auto snapshot (on leave)");
}

/** Best-effort final snapshot when the app is closing (callers bound this with a timeout). */
export async function snapshotOnClose(): Promise<void> {
  const s = useApp.getState();
  const tm = s.settings.timeMachine;
  if (!s.session || !tm.enabled || tm.mode !== "auto") return;
  await snapshotIfDirty(s.session, "Auto snapshot (on close)");
}

/** Record that an auto-snapshot just happened: bump the in-memory clock + persist it. */
function markSnapshotted(): void {
  lastSnapshotAt = Date.now();
  const tm = useApp.getState().settings.timeMachine;
  useApp.getState().updateSettings({ timeMachine: { ...tm, lastSnapshotAt } });
  useApp.getState().refreshLastSnapshot(); // keep the ambient "last snapshot" line current
  logEvent("snapshot", "auto");
}

// Used by flushOnLeave / snapshotOnClose – these operate on the OUTGOING/closing session, so they
// must NOT call markSnapshotted() (which reads useApp.getState() and would write the old vault's
// timestamp into the just-swapped new network – see #30). Just snapshot the captured session.
async function snapshotIfDirty(session: VaultSession, message: string): Promise<void> {
  try {
    const status = await session.tmStatus();
    if (status.isRepo && status.dirty) {
      const id = await session.tmSnapshot(message);
      if (id) logEvent("snapshot", message);
    }
  } catch {
    // best-effort
  }
}
