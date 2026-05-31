import { FolderOpen, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/app/store";
import { pickFolder, vaultName } from "@/vault/appState";

/** The current network, top of the rail. Click → switch (recents), open, or create. */
export function NetworkChip() {
  const vaultPath = useApp((s) => s.vaultPath);
  const recents = useApp((s) => s.recents);
  const current = vaultPath ? vaultName(vaultPath) : "—";
  const others = recents.filter((p) => p !== vaultPath);

  async function openExisting() {
    const path = await pickFolder("Open a network folder");
    if (path) void useApp.getState().switchVault(path);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title={`Network: ${current}`}
          aria-label={`Network: ${current} — switch`}
          className="grid size-9 place-items-center rounded-lg bg-primary/15 text-sm font-semibold text-primary uppercase transition-colors hover:bg-primary/25"
        >
          {current.charAt(0)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" sideOffset={8} className="w-56">
        <DropdownMenuLabel className="truncate">{current}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {others.length > 0 && (
          <>
            {others.map((path) => (
              <DropdownMenuItem key={path} className="truncate" onSelect={() => useApp.getState().switchVault(path)}>
                {vaultName(path)}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={() => useApp.getState().setNewNetworkOpen(true)}>
          <Plus /> New network…
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void openExisting()}>
          <FolderOpen /> Open network…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
