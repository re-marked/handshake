import { Target } from "lucide-react";

/**
 * A target goal on the board — a faint, dashed polaroid (someone you want to meet but
 * haven't). Ticking it (handled by the board) promotes it into a real connected person.
 */
export function GoalCard({ title }: { title: string }) {
  return (
    <div className="w-36 select-none overflow-hidden rounded-md border border-dashed border-primary/50 bg-card/50 opacity-80 shadow-sm">
      <div className="flex aspect-square w-full items-center justify-center bg-muted/40">
        <Target strokeWidth={1.5} className="h-1/2 w-1/2 text-primary/35" />
      </div>
      <div className="px-2.5 py-2">
        <div className="truncate text-sm font-medium leading-tight text-card-foreground/90">{title}</div>
        <div className="truncate text-xs leading-tight text-primary/50">goal</div>
      </div>
    </div>
  );
}
