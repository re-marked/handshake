import { useState } from "react";
import { FolderOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/app/store";
import { pickFolder, vaultName } from "@/vault/appState";

/**
 * Create a new network: pick a folder, name yourself, and we seed your "self" card so the board
 * has its root. Driven by the store's `newNetworkOpen` flag so the front door and the rail chip
 * can both trigger it.
 */
export function NewNetworkDialog() {
  const open = useApp((s) => s.newNetworkOpen);
  const [name, setName] = useState("");
  const [folder, setFolder] = useState<string | null>(null);

  function close() {
    useApp.getState().setNewNetworkOpen(false);
    setName("");
    setFolder(null);
  }

  async function choose() {
    const picked = await pickFolder("Choose a folder for your new network");
    if (picked) setFolder(picked);
  }

  function create() {
    if (!name.trim() || !folder) return;
    const path = folder;
    const who = name.trim();
    close();
    void useApp.getState().createNetwork(path, who);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? useApp.getState().setNewNetworkOpen(true) : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New network</DialogTitle>
          <DialogDescription>
            A network is a folder of Markdown files. Pick where it lives and add yourself.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium">Your name</label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim() && folder) create();
              }}
              placeholder="Your name"
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Folder</label>
            <Button variant="outline" onClick={choose} className="mt-1.5 w-full justify-start font-normal">
              <FolderOpen /> {folder ? vaultName(folder) : "Choose a folder…"}
            </Button>
            {folder && <p className="mt-1 truncate text-xs text-muted-foreground">{folder}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || !folder} onClick={create}>
            Create network
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
