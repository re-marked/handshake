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

const SCALE_PCT: Record<string, string> = {
  small: "90%",
  default: "100%",
  large: "110%",
  larger: "125%",
};
const FONT_STACK: Record<string, string> = {
  system: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  serif: "ui-serif, Georgia, Cambria, 'Times New Roman', serif",
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
    root.style.fontSize = SCALE_PCT[appScale] ?? "100%"; // rem-based layout scales with this
    root.style.setProperty("--app-font", FONT_STACK[font] ?? FONT_STACK.system);
    root.style.setProperty("--app-weight", WEIGHT[textWeight] ?? "400");
  }, [appScale, font, textWeight]);
}

export default function App() {
  const status = useApp((s) => s.status);
  const reduceMotion = useApp((s) => s.settings.reduceMotion);
  useTheme();
  useAppearance();

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
