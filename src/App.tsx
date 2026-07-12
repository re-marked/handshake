import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useApp } from "@/app/store";
import * as undo from "@/app/undo";
import * as scheduler from "@/app/snapshotScheduler";
import { initDebug, writeReport } from "@/app/debug";
import { notify } from "@/app/toast";
import { Bug } from "lucide-react";
import { Shell } from "@/app/Shell";
import { FrontDoor } from "@/app/FrontDoor";
import { NewNetworkDialog } from "@/app/NewNetworkDialog";
import { SettingsDialog } from "@/app/SettingsDialog";
import { Toaster } from "@/app/Toaster";
import { UpdateBanner, scheduleUpdateCheck } from "@/update/UpdateBanner";
import { WorkspaceBoundary } from "@/app/WorkspaceBoundary";

// Dev convenience: VITE_VAULT_PATH seeds the very first open when there are no recents yet.
// Normal launches reopen the last network; the front door handles everything else.
const DEV_VAULT = import.meta.env.VITE_VAULT_PATH as string | undefined;

type ThemeClass = "dark" | "paper" | "paper-vintage" | null;

/** Reflect the `theme` (+ paper variant) onto <html>. `light` = no class (the :root tokens);
 *  `system` follows the OS between dark and light. */
function applyThemeClass(cls: ThemeClass) {
  const root = document.documentElement;
  root.classList.remove("dark", "paper", "paper-vintage");
  if (cls) root.classList.add(cls);
}

function useTheme() {
  const theme = useApp((s) => s.settings.theme);
  const paperVariant = useApp((s) => s.settings.paperVariant);
  useEffect(() => {
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const sync = () => applyThemeClass(mq.matches ? "dark" : null);
      sync();
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }
    if (theme === "paper") applyThemeClass(paperVariant === "vintage" ? "paper-vintage" : "paper");
    else if (theme === "dark") applyThemeClass("dark");
    else applyThemeClass(null); // light
  }, [theme, paperVariant]);
}

const FONT_STACK: Record<string, string> = {
  system: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  serif: "'Fraunces Variable', Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, ui-serif, serif",
  mono: "ui-monospace, 'SF Mono', 'Cascadia Code', 'Roboto Mono', Menlo, Consolas, monospace",
};
const WEIGHT: Record<string, string> = { light: "300", normal: "400", medium: "500" };

/** Apply the flavor knobs (scale / font / weight) to the document. */
function useAppearance() {
  const appScale = useApp((s) => s.settings.appScale);
  const font = useApp((s) => s.settings.font);
  const textWeight = useApp((s) => s.settings.textWeight);
  useEffect(() => {
    const root = document.documentElement;
    const pct = typeof appScale === "number" && isFinite(appScale) ? appScale : 100;
    root.style.fontSize = `${pct}%`; // rem-based layout scales with this
    root.style.setProperty("--app-font", FONT_STACK[font] ?? FONT_STACK.system);
    root.style.setProperty("--app-weight", WEIGHT[textWeight] ?? "400");
  }, [appScale, font, textWeight]);
}

/** Global Ctrl/Cmd-Z (undo) + Shift / Ctrl-Y (redo), gated so text editors keep their own undo. */
function useGlobalUndo() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      const isUndo = k === "z" && !e.shiftKey;
      const isRedo = (k === "z" && e.shiftKey) || k === "y";
      if ((!isUndo && !isRedo) || undo.isEditableTarget(e.target)) return;
      e.preventDefault();
      if (isRedo) void undo.redo();
      else void undo.undo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

/** Take a best-effort Time Machine snapshot when the window is closing – bounded so close never hangs. */
function useSnapshotOnClose() {
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let closing = false;
    const win = getCurrentWindow();
    void win
      .onCloseRequested(async (event) => {
        if (closing) return;
        closing = true;
        event.preventDefault();
        const cap = new Promise((resolve) => setTimeout(resolve, 2500));
        await Promise.race([scheduler.snapshotOnClose().catch(() => {}), cap]);
        await win.destroy();
      })
      .then((u) => {
        unlisten = u;
      });
    return () => unlisten?.();
  }, []);
}

/** Ctrl/Cmd-Shift-D writes a debug report to .handshake/debug/ (a file Claude can read). */
function useDebugHotkey() {
  useEffect(() => {
    initDebug();
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        void writeReport("hotkey").then((path) =>
          notify(path ? "Debug report written" : "Couldn't write report", {
            body: path ?? undefined,
            icon: Bug,
            tone: path ? "default" : "muted",
          }),
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export default function App() {
  const status = useApp((s) => s.status);
  const reduceMotion = useApp((s) => s.settings.reduceMotion);
  useTheme();
  useAppearance();
  useGlobalUndo();
  useSnapshotOnClose();
  useDebugHotkey();

  useEffect(() => {
    void useApp.getState().init(DEV_VAULT);
    scheduleUpdateCheck();
  }, []);

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "never"}>
      {status === "no-vault" ? (
        <FrontDoor />
      ) : (
        <WorkspaceBoundary>
          <Shell />
        </WorkspaceBoundary>
      )}
      <NewNetworkDialog />
      <SettingsDialog />
      <Toaster />
      <UpdateBanner />
    </MotionConfig>
  );
}
