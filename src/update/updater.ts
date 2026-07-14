// Update checking. Two paths, keyed by how this build was installed (Rust `update_kind`):
//   • "auto"   – macOS, Windows, or a Linux AppImage → the Tauri updater downloads a signed
//                bundle and relaunches in place. Seamless.
//   • "manual" – a Linux .deb/.rpm, which the updater can't replace → we just compare versions
//                against the latest GitHub release and nudge the user to the download page.
// Everything is best-effort: a failed silent check never surfaces; only an explicit "Check for
// updates" reports "up to date" or an error.

import { create } from "zustand";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { CheckCircle2 } from "lucide-react";
import { appVersion } from "@/lib/buildInfo";
import { notify } from "@/app/toast";

const DOWNLOAD_URL = "https://handshake.wtf/download/";
const LATEST_API = "https://api.github.com/repos/re-marked/handshake/releases/latest";

type UpdateState =
  | { phase: "idle" }
  | { phase: "available"; mode: "auto" | "manual"; version: string }
  | { phase: "downloading"; version: string; pct: number };

/** Shared so a Settings button and the banner see the same status. */
export const useUpdate = create<{ state: UpdateState; dismissed: boolean }>(() => ({
  state: { phase: "idle" },
  dismissed: false,
}));

// The live Update handle can't live in the store (it carries methods), so keep it module-local.
let pending: Update | null = null;

/** Numeric semver-ish compare of "1.2.3" / "v1.2.3" – true when `remote` is strictly newer. */
function isNewer(remote: string, local: string): boolean {
  const parse = (v: string) => v.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const r = parse(remote);
  const l = parse(local);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const a = r[i] ?? 0;
    const b = l[i] ?? 0;
    if (a !== b) return a > b;
  }
  return false;
}

/**
 * Check for a newer version. `manual` = triggered by the user (report the "up to date" / error
 * outcome); otherwise silent unless an update is found.
 */
export async function checkForUpdates(manual = false): Promise<void> {
  try {
    const kind = await invoke<string>("update_kind");

    if (kind === "auto") {
      const update = await check();
      if (update) {
        pending = update;
        useUpdate.setState({
          state: { phase: "available", mode: "auto", version: update.version },
          dismissed: false,
        });
      } else if (manual) {
        notify("You're up to date", { tone: "success", icon: CheckCircle2 });
      }
      return;
    }

    // manual install kind (.deb/.rpm): compare against the latest GitHub release.
    const res = await fetch(LATEST_API, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const data = (await res.json()) as { tag_name: string };
    if (isNewer(data.tag_name, appVersion())) {
      useUpdate.setState({
        state: { phase: "available", mode: "manual", version: data.tag_name.replace(/^v/, "") },
        dismissed: false,
      });
    } else if (manual) {
      notify("You're up to date", { tone: "success", icon: CheckCircle2 });
    }
  } catch (err) {
    if (manual) notify("Couldn't check for updates", { body: String(err), tone: "muted" });
    // Silent on the background check – no network is a normal state for a local-first app.
  }
}

/** Download + install the pending auto-update, then relaunch into it. */
export async function installUpdate(): Promise<void> {
  if (!pending) return;
  const version = pending.version;
  try {
    let total = 0;
    let got = 0;
    useUpdate.setState({ state: { phase: "downloading", version, pct: 0 } });
    await pending.downloadAndInstall((e) => {
      if (e.event === "Started") total = e.data.contentLength ?? 0;
      else if (e.event === "Progress") {
        got += e.data.chunkLength;
        useUpdate.setState({
          state: { phase: "downloading", version, pct: total ? Math.round((got / total) * 100) : 0 },
        });
      }
    });
    await relaunch();
  } catch (err) {
    notify("Update failed", { body: String(err), tone: "muted" });
    useUpdate.setState({ state: { phase: "available", mode: "auto", version } });
  }
}

/** Open the download page in the browser (the .deb/.rpm fallback path). */
export function openDownloadPage(): void {
  void openUrl(DOWNLOAD_URL);
}

export function dismissUpdate(): void {
  useUpdate.setState({ dismissed: true });
}
