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

/** A clean person card on the board. Opacity encodes staleness; self carries the accent. */
export function PersonCard({ card, selected }: { card: BoardCard; selected: boolean }) {
  const subtitle = [card.role, card.company].filter(Boolean).join(" · ");
  return (
    <div
      style={{ opacity: card.freshness }}
      className={cn(
        "flex w-40 items-center gap-2.5 rounded-lg border bg-card px-3 py-2 text-card-foreground shadow-sm",
        card.isSelf ? "border-primary" : "border-border",
        selected && "ring-2 ring-ring",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          card.isSelf ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {monogram(card.name)}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium leading-tight">{card.name}</div>
        {subtitle && <div className="truncate text-xs leading-tight text-muted-foreground">{subtitle}</div>}
      </div>
    </div>
  );
}
