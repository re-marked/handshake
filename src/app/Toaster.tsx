import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { dismiss, useToasts } from "@/app/toast";

const SPRING = { type: "spring", stiffness: 460, damping: 32, mass: 0.7 } as const;

/** Renders the live toast pills, bottom-right, sliding in from the edge. Mounted once at the root. */
export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = t.icon;
          return (
            <motion.button
              key={t.id}
              type="button"
              layout
              initial={{ opacity: 0, x: 28, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 28, scale: 0.95, transition: { duration: 0.16 } }}
              transition={SPRING}
              onClick={() => dismiss(t.id)}
              className={cn(
                "pointer-events-auto flex max-w-xs items-center gap-2 rounded-full border border-border/70 bg-card/95 py-2 pl-3 pr-3.5 text-sm shadow-lg ring-1 ring-black/5 backdrop-blur",
                t.tone === "muted" && "text-muted-foreground",
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    t.tone === "success" ? "text-primary" : "text-muted-foreground",
                  )}
                />
              )}
              <span className="truncate font-medium">{t.message}</span>
              {t.detail && <span className="truncate text-muted-foreground">{t.detail}</span>}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
