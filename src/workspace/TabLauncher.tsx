import { useState } from "react";
import { Plus, Share2, SplitSquareHorizontal, Target, User, Users } from "lucide-react";
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
import { newId, type View } from "@/workspace/model";

/**
 * Open any view (or a person) freestyle — as a new tab (`+`) or beside the leaf (`split`).
 * Board is excluded from split (it's a singleton — only one board, ever).
 */
export function TabLauncher({ leafId, mode = "tab" }: { leafId: string; mode?: "tab" | "split" }) {
  const [open, setOpen] = useState(false);
  const people = useApp((s) => s.switchboard.people);
  const split = mode === "split";

  function pick(view: View) {
    setOpen(false);
    useApp.getState().setActiveLeaf(leafId);
    if (split) useApp.getState().splitLeaf(leafId, "row", view);
    else useApp.getState().openView(view, "tab");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={split ? "Split right" : "New tab"}
          title={split ? "Split right" : "New tab"}
          className="shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
        >
          {split ? <SplitSquareHorizontal /> : <Plus />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <Command>
          <CommandInput placeholder={split ? "Split with…" : "Open a view or person…"} />
          <CommandList>
            <CommandEmpty>Nothing found.</CommandEmpty>
            <CommandGroup heading="Views">
              <CommandItem value="new board" onSelect={() => pick({ type: "board", id: newId() })}>
                <Share2 /> New board
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
