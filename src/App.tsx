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

/** Reflect the `theme` setting onto <html> (toggling `.dark`); follow the OS for "system". */
function useTheme() {
  const theme = useApp((s) => s.settings.theme);
  useEffect(() => {
    const root = document.documentElement;
    const apply = (dark: boolean) => root.classList.toggle("dark", dark);
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches);
      const onChange = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    apply(theme === "dark");
  }, [theme]);
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
