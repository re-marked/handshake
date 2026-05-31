import { useEffect } from "react";
import { useApp } from "@/app/store";
import { Shell } from "@/app/Shell";
import { FrontDoor } from "@/app/FrontDoor";
import { NewNetworkDialog } from "@/app/NewNetworkDialog";
import { WorkspaceBoundary } from "@/app/WorkspaceBoundary";

// Dev convenience: VITE_VAULT_PATH seeds the very first open when there are no recents yet.
// Normal launches reopen the last network; the front door handles everything else.
const DEV_VAULT = import.meta.env.VITE_VAULT_PATH as string | undefined;

export default function App() {
  const status = useApp((s) => s.status);

  useEffect(() => {
    void useApp.getState().init(DEV_VAULT);
  }, []);

  return (
    <>
      {status === "no-vault" ? (
        <FrontDoor />
      ) : (
        <WorkspaceBoundary>
          <Shell />
        </WorkspaceBoundary>
      )}
      <NewNetworkDialog />
    </>
  );
}
