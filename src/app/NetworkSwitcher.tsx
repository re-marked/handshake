import { Check, ChevronsUpDown, FolderOpen, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { pickFolder, vaultName } from "@/vault/appState";

/**
 * The network switcher, top-left: the current network's name with a chevrons-up-down affordance;
 * the dropdown lists your networks (a check on the current one), with New / Open at the bottom.
 */
export function NetworkSwitcher() {
  const vaultPath = useApp((s) => s.vaultPath);
  const recents = useApp((s) => s.recents);
  const current = vaultPath ? vaultName(vaultPath) : "—";

  async function openExisting() {
    const path = await pickFolder("Open a network folder");
    if (path) void useApp.getState().switchVault(path);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Switch network"
          className="flex max-w-64 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-foreground/90 outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
        >
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{current}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" sideOffset={6} className="w-60">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Networks</DropdownMenuLabel>
        {recents.map((path) => (
          <DropdownMenuItem
            key={path}
            onSelect={() => {
              if (path !== vaultPath) void useApp.getState().switchVault(path);
            }}
          >
            <Check className={cn("size-4", path === vaultPath ? "opacity-100" : "opacity-0")} />
            <span className="truncate">{vaultName(path)}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
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
