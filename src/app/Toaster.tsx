import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { dismiss, useToasts } from "@/app/toast";

const SPRING = { type: "spring", stiffness: 460, damping: 32, mass: 0.7 } as const;

function clockTime(ms: number): string {
  try {
    return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

/** Live notification cards, bottom-right, sliding in from the edge. Mounted once at the root. */
export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col items-stretch gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = t.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 28, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 28, scale: 0.96, transition: { duration: 0.16 } }}
              transition={SPRING}
              className="pointer-events-auto rounded-xl border border-border/70 bg-card/95 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur"
            >
              <div className="flex items-start gap-2.5">
                {Icon && (
                  <span
                    className={cn(
                      "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
                      t.tone === "success" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                      {t.title}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/70">
                      {clockTime(t.at)}
                    </span>
                    <button
                      type="button"
                      aria-label="Dismiss"
                      onClick={() => dismiss(t.id)}
                      className="-mr-1 grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground/60 transition hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  {t.body && (
                    <p className="mt-0.5 text-sm leading-snug text-muted-foreground [overflow-wrap:anywhere]">
                      {t.body}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
