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

/** Reflect the `theme` setting onto <html> (the `.dark` / `.paper` class); `system` follows the
 *  OS between dark and light. `light` and `paper` are manual choices. */
function applyThemeClass(resolved: "dark" | "light" | "paper") {
  const root = document.documentElement;
  root.classList.remove("dark", "paper");
  if (resolved === "dark") root.classList.add("dark");
  else if (resolved === "paper") root.classList.add("paper");
  // light → no class (the :root tokens)
}

function useTheme() {
  const theme = useApp((s) => s.settings.theme);
  useEffect(() => {
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const sync = () => applyThemeClass(mq.matches ? "dark" : "light");
      sync();
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }
    applyThemeClass(theme);
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
