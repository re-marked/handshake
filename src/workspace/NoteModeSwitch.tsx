import { AppWindow, PanelRight, PictureInPicture2, Pin, type LucideIcon } from "lucide-react";
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
 * The inline note-mode switch — flip a person's note between panel ⇄ float ⇄ tab anytime
 * (a move, not a copy). The pin remembers which mode new notes open in. `current` is the mode
 * of the container this switch is rendered in, so it lights up its own slot.
 */
export function NoteModeSwitch({ id, current }: { id: string; current: NoteMode }) {
  const noteDefault = useApp((s) => s.workspace.noteDefault);
  const isDefault = noteDefault === current;

  return (
    <div className="flex items-center gap-1">
      <ToggleGroup
        type="single"
        value={current}
        variant="outline"
        size="sm"
        onValueChange={(v) => {
          if (v && v !== current) useApp.getState().setNoteMode(id, v as NoteMode);
        }}
      >
        {MODES.map(({ value, icon: Icon, label }) => (
          <ToggleGroupItem key={value} value={value} aria-label={label} title={label}>
            <Icon />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-pressed={isDefault}
        title={isDefault ? "New notes open like this" : "Open new notes like this"}
        onClick={() => useApp.getState().setNoteDefault(current)}
      >
        <Pin className={cn("transition-colors", isDefault && "fill-primary text-primary")} />
      </Button>
    </div>
  );
}
