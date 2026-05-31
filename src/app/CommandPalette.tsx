import { useEffect, useState } from "react";
import { Plus, User } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useApp } from "@/app/store";
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
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
        strength: "cold",
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
      </CommandList>
    </CommandDialog>
  );
}
