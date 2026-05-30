import { cn } from "@/lib/utils";
import type { BoardCard } from "@/board/tree";

function monogram(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * A polaroid-style person card: a square photo (or placeholder) on top, name + role on
 * the caption strip below. Clean, not skeuomorphic. Opacity encodes staleness; self
 * carries the rose accent. (Real photos load once the Tauri asset protocol is wired.)
 */
export function PersonCard({ card }: { card: BoardCard }) {
  const subtitle = [card.role, card.company].filter(Boolean).join(" · ");
  return (
    <div
      style={{ opacity: card.freshness }}
      className={cn(
        "w-36 select-none overflow-hidden rounded-md border bg-card shadow-sm",
        card.isSelf ? "border-primary" : "border-border",
      )}
    >
      <div className="flex aspect-square w-full items-center justify-center bg-muted">
        <span
          className={cn(
            "text-2xl font-semibold",
            card.isSelf ? "text-primary" : "text-muted-foreground/70",
          )}
        >
          {monogram(card.name)}
        </span>
      </div>
      <div className="px-2.5 py-2">
        <div className="truncate text-sm font-medium leading-tight text-card-foreground">{card.name}</div>
        {subtitle && <div className="truncate text-xs leading-tight text-muted-foreground">{subtitle}</div>}
      </div>
    </div>
  );
}
