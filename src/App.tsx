import { useEffect, useState } from "react";
import { createTauriIO } from "@/vault/tauriIo";
import { VaultSession } from "@/vault/session";
import { BoardView } from "@/board/BoardView";
import type { Switchboard } from "@/switchboard";

// Dev: point at a vault folder via VITE_VAULT_PATH. A real folder-picker / settings
// flow replaces this later.
const VAULT = import.meta.env.VITE_VAULT_PATH as string | undefined;

export default function App() {
  const [switchboard, setSwitchboard] = useState<Switchboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!VAULT) {
      setError("No vault configured — set VITE_VAULT_PATH to a vault folder for dev.");
      return;
    }
    const session = new VaultSession(createTauriIO(VAULT));
    session.load().then(setSwitchboard).catch((e: unknown) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }
  if (!switchboard) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        Loading vault…
      </div>
    );
  }
  return <BoardView switchboard={switchboard} />;
}
