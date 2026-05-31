import { AppWindow, Columns2, PanelRight, PictureInPicture2, Pin, type LucideIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import type { NoteMode } from "@/workspace/model";

const MODES: { value: NoteMode; icon: LucideIcon; label: string }[] = [
  { value: "panel", icon: PanelRight, label: "Side panel" },
  { value: "float", icon: PictureInPicture2, label: "Floating window" },
  { value: "tab", icon: AppWindow, label: "Docked tab" },
];

/**
 * The inline note controls. A quick-split button (note left, board right) leads; then a light
 * 3-way switch to move the note between panel ⇄ float ⇄ tab (a move, not a copy); then a pin
 * that remembers which mode new notes open in. `current` is the mode of the container this is
 * rendered in, so it lights up its own slot.
 */
export function NoteModeSwitch({ id, current }: { id: string; current: NoteMode }) {
  const noteDefault = useApp((s) => s.workspace.noteDefault);
  const isDefault = noteDefault === current;

  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Split: note left, board right"
        title="Note left, board right"
        onClick={() => useApp.getState().splitNoteWithBoard(id)}
      >
        <Columns2 />
      </Button>
      <ToggleGroup
        type="single"
        value={current}
        size="sm"
        className="gap-0.5"
        onValueChange={(v) => {
          if (v && v !== current) useApp.getState().setNoteMode(id, v as NoteMode);
        }}
      >
        {MODES.map(({ value, icon: Icon, label }) => (
          <ToggleGroupItem key={value} value={value} aria-label={label} title={label} className="rounded-md">
            <Icon />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-pressed={isDefault}
        title={isDefault ? "New notes open like this — click to unpin" : "Open new notes like this"}
        onClick={() => useApp.getState().setNoteDefault(isDefault ? "panel" : current)}
      >
        <Pin className={cn(isDefault ? "fill-primary text-primary" : "text-muted-foreground/50")} />
      </Button>
    </div>
  );
}
