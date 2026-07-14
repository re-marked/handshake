import { memo } from "react";
import { Target, User } from "lucide-react";

/**
 * A target goal on the board – a faint, dashed polaroid with a person silhouette (someone
 * you want to meet but haven't), tagged as a goal in the caption. A dashed tie to you is
 * drawn by the board. Ticking it promotes it into a real connected person.
 */
export const GoalCard = memo(function GoalCard({ title }: { title: string }) {
  return (
    <div className="w-36 select-none overflow-hidden rounded-md border border-dashed border-primary/50 bg-card/50 opacity-85 shadow-sm">
      <div className="flex aspect-square w-full items-center justify-center bg-muted/40">
        <User strokeWidth={1.5} className="h-1/2 w-1/2 text-muted-foreground/40" />
      </div>
      <div className="px-2.5 py-2">
        <div className="truncate text-sm font-medium leading-tight text-card-foreground/90">{title}</div>
        <div className="flex items-center gap-1 text-xs leading-tight text-primary/55">
          <Target className="size-3 shrink-0" strokeWidth={2} />
          <span className="truncate">goal</span>
        </div>
      </div>
    </div>
  );
});
