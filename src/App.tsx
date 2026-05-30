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
  const [photos, setPhotos] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!VAULT) {
      setError("No vault configured — set VITE_VAULT_PATH to a vault folder for dev.");
      return;
    }
    const session = new VaultSession(createTauriIO(VAULT));
    let cancelled = false;

    (async () => {
      const sb = await session.load();
      if (cancelled) return;
      setSwitchboard(sb);

      // Resolve photos for anyone who has one; missing files just stay silhouettes.
      const resolved = await Promise.all(
        [...sb.people.values()]
          .filter((p) => p.photo)
          .map(async (p) => {
            try {
              return [p.id, await session.readAttachment(p.photo!)] as const;
            } catch {
              return null;
            }
          }),
      );
      if (cancelled) return;
      setPhotos(new Map(resolved.filter((e): e is readonly [string, string] => e !== null)));
    })().catch((e: unknown) => {
      if (!cancelled) setError(String(e));
    });

    return () => {
      cancelled = true;
    };
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
  return <BoardView switchboard={switchboard} photos={photos} />;
}
