import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { PersonView } from "@/views/PersonView";

/**
 * The person note — a card that slides in from the top-right when you tap a polaroid and
 * slides back out when you tap it again (or press Esc). Non-modal: the board stays
 * interactive behind it.
 */
export function PersonPanel() {
  const openPersonId = useApp((s) => s.openPersonId);
  const closePerson = useApp((s) => s.closePerson);
  const open = openPersonId !== null;

  // Keep the last person rendered while sliding out, so the content doesn't blank mid-anim.
  const [shownId, setShownId] = useState<string | null>(openPersonId);
  useEffect(() => {
    if (openPersonId) setShownId(openPersonId);
  }, [openPersonId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) closePerson();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closePerson]);

  return (
    <div
      className={cn(
        "absolute right-3 top-3 z-40 w-80 transition-all duration-300 ease-out",
        open ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-[calc(100%+1.5rem)] opacity-0",
      )}
    >
      <div className="flex max-h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-xl border bg-card shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b px-3 py-1.5">
          <span className="text-xs text-muted-foreground">Note</span>
          <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={closePerson}>
            <X />
          </Button>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-3.5 py-3">{shownId && <PersonView id={shownId} />}</div>
        </ScrollArea>
      </div>
    </div>
  );
}
