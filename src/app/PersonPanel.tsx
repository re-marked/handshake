import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/app/store";
import { PersonView } from "@/views/PersonView";

const ENTER = { type: "spring", stiffness: 520, damping: 38 } as const;
const EXIT = { duration: 0.12, ease: "easeIn" } as const;

/**
 * The person note — a card that slides in from the top-right when you tap a polaroid and
 * slides out when you tap it again (or Esc). Non-modal: the board stays interactive.
 * Switching to a different person slides the current note out, then the new one in
 * (AnimatePresence mode="wait", keyed by person id). The header carries a type-to-confirm
 * delete (never shown for yourself).
 */
export function PersonPanel() {
  const openPersonId = useApp((s) => s.openPersonId);
  const closePerson = useApp((s) => s.closePerson);
  const person = useApp((s) => (openPersonId ? s.switchboard.people.get(openPersonId) : undefined));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // defaultPrevented guard: don't close the note when Esc just dismissed a dialog.
      if (e.key === "Escape" && openPersonId && !e.defaultPrevented) closePerson();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPersonId, closePerson]);

  return (
    <div className="pointer-events-none absolute right-3 top-14 z-40 w-80">
      <AnimatePresence mode="wait">
        {openPersonId && (
          <motion.div
            key={openPersonId}
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0, transition: EXIT }}
            transition={ENTER}
            className="pointer-events-auto flex max-h-[calc(100vh-4.5rem)] flex-col overflow-hidden rounded-xl border bg-card shadow-xl"
          >
            <div className="flex h-9 shrink-0 items-center justify-between border-b px-3">
              <span className="text-xs text-muted-foreground">Note</span>
              <div className="flex items-center gap-0.5">
                {person && !person.isSelf && <DeletePersonButton id={person.id} name={person.name} />}
                <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={closePerson}>
                  <X />
                </Button>
              </div>
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

/** Trash → a dialog that requires typing the person's name before Delete unlocks. */
function DeletePersonButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const tieCount = useApp((s) =>
    [...s.switchboard.handshakes.values()].filter((h) => h.people.includes(id)).length,
  );
  const matches = typed.trim() !== "" && typed.trim() === name.trim();

  function confirm() {
    if (!matches) return;
    setOpen(false);
    void useApp.getState().deletePerson(id);
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTyped("");
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label="Delete person">
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes their note and cuts {tieCount} connection{tieCount === 1 ? "" : "s"}. It can’t be
            undone from the app. Type <span className="font-medium text-foreground">{name}</span> to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              confirm();
            }
          }}
          placeholder={name}
          aria-label="Type the name to confirm"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!matches}
            className={buttonVariants({ variant: "destructive" })}
            onClick={(e) => {
              if (!matches) {
                e.preventDefault();
                return;
              }
              void useApp.getState().deletePerson(id);
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
