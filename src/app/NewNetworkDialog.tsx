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
import { joinPath, pickFolder, sanitizeFolderName, vaultName } from "@/vault/appState";

/**
 * Create a new network: name it, name yourself, pick where it lives. By default the app makes a
 * dedicated folder (named after the network) inside the location you choose and sets everything
 * up – you can override to use the chosen folder directly. We seed your "self" card so the board
 * has its root. Driven by the store's `newNetworkOpen` flag.
 */
export function NewNetworkDialog() {
  const open = useApp((s) => s.newNetworkOpen);
  const [netName, setNetName] = useState("");
  const [yourName, setYourName] = useState("");
  const [parent, setParent] = useState<string | null>(null);
  const [dedicated, setDedicated] = useState(true);

  const folderName = sanitizeFolderName(netName);
  const target = parent ? (dedicated ? joinPath(parent, folderName) : parent) : null;
  const canCreate = Boolean(netName.trim() && yourName.trim() && parent && (!dedicated || folderName));

  function close() {
    useApp.getState().setNewNetworkOpen(false);
    setNetName("");
    setYourName("");
    setParent(null);
    setDedicated(true);
  }

  async function choose() {
    const picked = await pickFolder(dedicated ? "Choose where to create the network" : "Choose the network folder");
    if (picked) setParent(picked);
  }

  function create() {
    if (!canCreate || !target) return;
    const who = yourName.trim();
    close();
    void useApp.getState().createNetwork(target, who);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? useApp.getState().setNewNetworkOpen(true) : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New network</DialogTitle>
          <DialogDescription>
            A network is a folder of Markdown files. Name it, add yourself, and pick where it lives.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium">Network name</label>
            <Input
              autoFocus
              value={netName}
              onChange={(e) => setNetName(e.target.value)}
              placeholder="Personal, Work, …"
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Your name</label>
            <Input
              value={yourName}
              onChange={(e) => setYourName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canCreate) create();
              }}
              placeholder="Your name"
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Location</label>
            <Button variant="outline" onClick={choose} className="mt-1.5 w-full justify-start font-normal">
              <FolderOpen /> {parent ? vaultName(parent) : "Choose a folder…"}
            </Button>
            <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={dedicated}
                onChange={(e) => setDedicated(e.target.checked)}
                className="size-3.5 accent-primary"
              />
              Create a dedicated folder
            </label>
            {target && <p className="mt-1 truncate text-xs text-muted-foreground">{target}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button disabled={!canCreate} onClick={create}>
            Create network
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
