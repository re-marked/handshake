import { useState } from "react";
import { Plus, Share2, Target, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApp } from "@/app/store";
import type { View } from "@/workspace/model";

/** The browser-style `+` — open any view (or a person) as a new tab, freestyle. */
export function TabLauncher({ leafId }: { leafId: string }) {
  const [open, setOpen] = useState(false);
  const people = useApp((s) => s.switchboard.people);

  function pick(view: View) {
    setOpen(false);
    useApp.getState().setActiveLeaf(leafId);
    useApp.getState().openView(view, "tab");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="New tab"
          title="New tab"
          className="shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <Plus />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Open a view or person…" />
          <CommandList>
            <CommandEmpty>Nothing found.</CommandEmpty>
            <CommandGroup heading="Views">
              <CommandItem value="board" onSelect={() => pick({ type: "board" })}>
                <Share2 /> Board
              </CommandItem>
              <CommandItem value="people" onSelect={() => pick({ type: "people" })}>
                <Users /> People
              </CommandItem>
              <CommandItem value="goals" onSelect={() => pick({ type: "goals" })}>
                <Target /> Goals
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="People">
              {[...people.values()]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`${p.name} ${p.id}`}
                    onSelect={() => pick({ type: "person", id: p.id })}
                  >
                    <User />
                    <span className="truncate">{p.name}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
