import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BoardCard } from "@/board/tree";

/**
 * A polaroid-style person card: a square photo (or a silhouette placeholder) on top,
 * name + role on the caption strip below. Solid/opaque. Self carries the rose accent.
 */
export function PersonCard({ card, photoSrc }: { card: BoardCard; photoSrc?: string }) {
  const subtitle = [card.role, card.company].filter(Boolean).join(" · ");
  return (
    <div
      className={cn(
        "w-36 select-none overflow-hidden rounded-md border bg-card shadow-sm",
        card.isSelf ? "border-primary" : "border-border",
      )}
    >
      <div className="flex aspect-square w-full items-center justify-center bg-muted">
        {photoSrc ? (
          <img src={photoSrc} alt="" draggable={false} className="h-full w-full object-cover" />
        ) : (
          <User
            strokeWidth={1.5}
            className={cn("h-1/2 w-1/2", card.isSelf ? "text-primary/80" : "text-muted-foreground/50")}
          />
        )}
      </div>
      <div className="px-2.5 py-2">
        <div className="truncate text-sm font-medium leading-tight text-card-foreground">{card.name}</div>
        {subtitle && <div className="truncate text-xs leading-tight text-muted-foreground">{subtitle}</div>}
      </div>
    </div>
  );
}
