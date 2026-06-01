import { useEffect, useState } from "react";
import { Camera, FolderOpen, Plus, Redo2, Settings, Share2, Undo2, User } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useApp } from "@/app/store";
import * as undo from "@/app/undo";
import { useUndoStore } from "@/app/undo";
import { pickFolder, vaultName } from "@/vault/appState";
import {
  canonicalHandshakeId,
  canonicalPair,
  mintPersonId,
  type Diff,
  type Handshake,
  type Person,
} from "@/switchboard";

/**
 * Ctrl/⌘-P (or the rail's search) → jump to anyone, or type a fresh name to create them
 * (connected to you). The Obsidian-grade quick surface; more commands slot in over time.
 */
export function CommandPalette() {
  const open = useApp((s) => s.commandOpen);
  const setOpen = useApp((s) => s.setCommandOpen);
  const people = useApp((s) => s.switchboard.people);
  const self = useApp((s) => s.switchboard.self);
  const vaultPath = useApp((s) => s.vaultPath);
  const recents = useApp((s) => s.recents);
  const tmEnabled = useApp((s) => s.settings.timeMachine.enabled);
  const { canUndo, canRedo } = useUndoStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if ((k === "p" || k === "k") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const s = useApp.getState();
        s.setCommandOpen(!s.commandOpen);
      }
    }
    // Right-click anywhere → the command palette, instead of the webview's browser menu.
    // Text fields keep their native menu (copy/paste/spellcheck); highlights handle their own
    // right-click (recolor) and stop propagation, so this never fires for them.
    function onContext(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      // Highlights own their right-click (recolor) — suppress the browser menu, let them handle it.
      if (t?.closest("mark.hl")) {
        e.preventDefault();
        return;
      }
      if (t?.closest("input, textarea, [contenteditable='true'], [contenteditable='']")) return;
      e.preventDefault();
      useApp.getState().setCommandOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("contextmenu", onContext);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("contextmenu", onContext);
    };
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const roster = [...people.values()].sort((a, b) => a.name.localeCompare(b.name));
  const q = query.trim().toLowerCase();
  const exact = q.length > 0 && roster.some((p) => p.name.trim().toLowerCase() === q);

  function jump(id: string) {
    setOpen(false);
    useApp.getState().revealPerson(id);
  }

  async function create(name: string) {
    setOpen(false);
    const sb = useApp.getState().switchboard;
    const id = mintPersonId(sb.people, name);
    const person: Person = { kind: "person", id, name: name.trim(), isSelf: false, tags: [], handles: {}, body: "" };
    const diff: Diff = [{ op: "createPerson", person }];
    const selfId = sb.self?.id;
    if (selfId && selfId !== id) {
      const [pa, pb] = canonicalPair(selfId, id);
      const handshake: Handshake = {
        kind: "handshake",
        id: canonicalHandshakeId(selfId, id),
        people: [pa, pb],
        strength: useApp.getState().settings.defaultTieStrength,
        body: "",
      };
      diff.push({ op: "createHandshake", handshake });
    }
    const res = await useApp.getState().commit(diff);
    if (res.ok) useApp.getState().revealPerson(id);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Jump to someone, or type a new name…"
      />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>
        <CommandGroup heading="People">
          {roster.map((p) => (
            <CommandItem
              key={p.id}
              value={`${p.name} ${p.id}`}
              keywords={[p.role, p.company, ...p.tags].filter(Boolean) as string[]}
              onSelect={() => jump(p.id)}
            >
              <User />
              <span className="truncate">{p.name}</span>
              {(p.role || p.company) && (
                <span className="ml-auto truncate text-xs text-muted-foreground">
                  {[p.role, p.company].filter(Boolean).join(" · ")}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
        {q.length > 0 && !exact && (
          <CommandGroup heading="Create">
            <CommandItem value={`create ${query}`} onSelect={() => create(query)}>
              <Plus />
              <span className="truncate">
                Create “{query.trim()}”{self ? " — connected to you" : ""}
              </span>
            </CommandItem>
          </CommandGroup>
        )}
        {(tmEnabled || canUndo || canRedo) && (
          <CommandGroup heading="Time Machine">
            {tmEnabled && (
              <CommandItem
                value="snapshot now time machine backup"
                onSelect={() => {
                  setOpen(false);
                  void useApp.getState().session?.tmSnapshot("Manual snapshot");
                }}
              >
                <Camera /> Snapshot now
              </CommandItem>
            )}
            {canUndo && (
              <CommandItem
                value="undo"
                onSelect={() => {
                  setOpen(false);
                  void undo.undo();
                }}
              >
                <Undo2 /> Undo
              </CommandItem>
            )}
            {canRedo && (
              <CommandItem
                value="redo"
                onSelect={() => {
                  setOpen(false);
                  void undo.redo();
                }}
              >
                <Redo2 /> Redo
              </CommandItem>
            )}
          </CommandGroup>
        )}
        <CommandGroup heading="Networks">
          <CommandItem
            value="new network"
            onSelect={() => {
              setOpen(false);
              useApp.getState().setNewNetworkOpen(true);
            }}
          >
            <Plus /> New network…
          </CommandItem>
          <CommandItem
            value="open network"
            onSelect={async () => {
              setOpen(false);
              const path = await pickFolder("Open a network folder");
              if (path) void useApp.getState().switchVault(path);
            }}
          >
            <FolderOpen /> Open network…
          </CommandItem>
          <CommandItem
            value="settings preferences"
            onSelect={() => {
              setOpen(false);
              useApp.getState().setSettingsOpen(true);
            }}
          >
            <Settings /> Settings…
          </CommandItem>
          {recents
            .filter((p) => p !== vaultPath)
            .map((path) => (
              <CommandItem
                key={path}
                value={`switch network ${vaultName(path)} ${path}`}
                onSelect={() => {
                  setOpen(false);
                  void useApp.getState().switchVault(path);
                }}
              >
                <Share2 />
                <span className="truncate">Switch to {vaultName(path)}</span>
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
