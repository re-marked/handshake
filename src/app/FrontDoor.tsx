import { FolderOpen, Plus, Share2, X } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/app/store";
import { pickFolder, vaultName } from "@/vault/appState";

/**
 * The front door: shown when no network is open (first run, or the last one couldn't be found).
 * Start a new network, open an existing folder, or jump back into a recent one.
 */
export function FrontDoor() {
  const recents = useApp((s) => s.recents);
  const error = useApp((s) => s.error);

  async function openExisting() {
    const path = await pickFolder("Open a network folder");
    if (path) void useApp.getState().switchVault(path);
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-background p-8 text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <Share2 className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Handshake</h1>
            <p className="text-sm text-muted-foreground">Open a network, or start a new one.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => useApp.getState().setNewNetworkOpen(true)}>
            <Plus /> New network
          </Button>
          <Button variant="outline" className="flex-1" onClick={openExisting}>
            <FolderOpen /> Open network
          </Button>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {recents.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Recent</div>
            <div className="flex flex-col gap-1">
              {recents.map((path) => (
                <div key={path} className="group flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/50">
                  <button
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    onClick={() => useApp.getState().switchVault(path)}
                  >
                    <Share2 className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{vaultName(path)}</span>
                      <span className="block truncate text-xs text-muted-foreground">{path}</span>
                    </span>
                  </button>
                  <button
                    aria-label="Remove from recents"
                    onClick={() => useApp.getState().forgetVault(path)}
                    className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground/60 opacity-0 transition hover:bg-background hover:text-foreground group-hover:opacity-100"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
