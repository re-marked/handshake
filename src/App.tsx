import { useEffect } from "react";
import { useApp } from "@/app/store";
import { Shell } from "@/app/Shell";
import { WorkspaceBoundary } from "@/app/WorkspaceBoundary";

// Dev: point at a vault folder via VITE_VAULT_PATH. A real folder-picker / settings
// flow replaces this later.
const VAULT = import.meta.env.VITE_VAULT_PATH as string | undefined;

export default function App() {
  useEffect(() => {
    if (!VAULT) {
      useApp.setState({ status: "error", error: "No vault configured — set VITE_VAULT_PATH for dev." });
      return;
    }
    void useApp.getState().init(VAULT);
  }, []);

  return (
    <WorkspaceBoundary>
      <Shell />
    </WorkspaceBoundary>
  );
}
