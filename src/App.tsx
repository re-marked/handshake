import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { useApp } from "@/app/store";
import { Shell } from "@/app/Shell";
import { FrontDoor } from "@/app/FrontDoor";
import { NewNetworkDialog } from "@/app/NewNetworkDialog";
import { SettingsDialog } from "@/app/SettingsDialog";
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

export default function App() {
  const status = useApp((s) => s.status);
  const reduceMotion = useApp((s) => s.settings.reduceMotion);
  useTheme();

  useEffect(() => {
    void useApp.getState().init(DEV_VAULT);
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
    </MotionConfig>
  );
}
