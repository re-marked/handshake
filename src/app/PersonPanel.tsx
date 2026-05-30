import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/app/store";
import { PersonView } from "@/views/PersonView";

const ENTER = { type: "spring", stiffness: 520, damping: 38 } as const;
const EXIT = { duration: 0.12, ease: "easeIn" } as const;

/**
 * The person note — a card that slides in from the top-right when you tap a polaroid and
 * slides out when you tap it again (or Esc). Non-modal: the board stays interactive.
 * Switching to a different person slides the current note out, then the new one in
 * (AnimatePresence mode="wait", keyed by person id).
 */
export function PersonPanel() {
  const openPersonId = useApp((s) => s.openPersonId);
  const closePerson = useApp((s) => s.closePerson);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && openPersonId) closePerson();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPersonId, closePerson]);

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-40 w-80">
      <AnimatePresence mode="wait">
        {openPersonId && (
          <motion.div
            key={openPersonId}
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0, transition: EXIT }}
            transition={ENTER}
            className="pointer-events-auto flex max-h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-xl border bg-card shadow-xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b px-3 py-1.5">
              <span className="text-xs text-muted-foreground">Note</span>
              <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={closePerson}>
                <X />
              </Button>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <div className="px-3.5 py-3">
                <PersonView id={openPersonId} />
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
