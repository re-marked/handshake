import { X } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { HL_COLORS, type HlColor } from "@/views/remarkHighlight";

const COLOR_LABEL: Record<HlColor, string> = {
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
  pink: "Pink",
  purple: "Purple",
};

// Solid, clearly-visible versions of each pastel for the picker chips (the in-text washes are
// translucent and would be near-invisible as little swatches).
const SWATCH: Record<HlColor, string> = {
  yellow: "oklch(0.86 0.14 95)",
  green: "oklch(0.82 0.15 150)",
  blue: "oklch(0.78 0.13 235)",
  pink: "oklch(0.8 0.14 5)",
  purple: "oklch(0.74 0.15 305)",
};

/** Where the palette anchors (viewport coords) + which color is currently applied. */
export type PaletteTarget = { x: number; y: number; current: HlColor };

/**
 * The recolor palette — a small popover of pastel swatches + a remove button, anchored at a point
 * and opening below it (so it never covers the highlighted text). Shared by the rendered preview
 * (MarkdownView) and the CodeMirror editor (NoteEditor); each owns the splice the pick triggers.
 */
export function HighlightPalette({
  target,
  onPick,
  onClose,
}: {
  target: PaletteTarget | null;
  onPick: (color: HlColor | "remove") => void;
  onClose: () => void;
}) {
  return (
    <Popover open={!!target} onOpenChange={(o) => !o && onClose()}>
      {target && <PopoverAnchor style={{ position: "fixed", left: target.x, top: target.y }} />}
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-auto p-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-1.5">
          {HL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title={COLOR_LABEL[c]}
              onClick={() => onPick(c)}
              className={cn(
                "size-7 overflow-hidden rounded-md ring-1 ring-inset transition-all hover:scale-110",
                target?.current === c ? "ring-2 ring-primary" : "ring-border/70",
              )}
            >
              <span className="block size-full rounded-[5px]" style={{ backgroundColor: SWATCH[c] }} />
            </button>
          ))}
          <div className="mx-0.5 h-6 w-px bg-border" />
          <button
            type="button"
            title="Remove highlight"
            onClick={() => onPick("remove")}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground ring-1 ring-inset ring-border/70 transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
