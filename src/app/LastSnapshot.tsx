import { useApp } from "@/app/store";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * A tiny, always-visible Time Machine status line. Shows the last snapshot (date + full commit
 * hash), or "no snapshots yet" / "off", or a clear error if the engine failed – a quick way to
 * confirm the Time Machine is actually working. Rendered in the board corner + About + settings.
 */
export function LastSnapshot({ className }: { className?: string }) {
  const last = useApp((s) => s.lastSnapshot);
  const error = useApp((s) => s.tmError);
  const enabled = useApp((s) => s.settings.timeMachine.enabled);

  let body: React.ReactNode;
  if (error) {
    body = <span className="text-amber-600 dark:text-amber-500">Time Machine error · {error}</span>;
  } else if (!enabled) {
    body = "Time Machine off";
  } else if (last) {
    body = (
      <>
        Last snapshot · {formatDateTime(last.time * 1000)} · <span className="font-mono">{last.id}</span>
      </>
    );
  } else {
    body = "Time Machine on · no snapshots yet";
  }

  return <span className={cn("select-text leading-none text-muted-foreground/55", className)}>{body}</span>;
}
