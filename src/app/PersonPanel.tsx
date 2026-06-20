import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trash2, X } from "lucide-react";
import { FLOAT_H_MAX, FLOAT_H_MIN, FLOAT_W_MAX, FLOAT_W_MIN } from "@/vault/settings";
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
import { NoteModeSwitch } from "@/workspace/NoteModeSwitch";

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
  const panelSize = useApp((s) => s.settings.panelSize);

  // Live size while dragging the grip; falls back to the saved default. Resizing the panel
  // updates the default (settings.panelSize) on release — it remembers what you drag it to.
  const [drag, setDrag] = useState<{ w: number; h: number } | null>(null);
  const size = drag ?? panelSize;
  // Drag origin + the live size (kept in the ref so the commit on release is never stale).
  const resize = useRef<{ x: number; y: number; w0: number; h0: number; w: number; h: number } | null>(null);

  function onGripDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    resize.current = { x: e.clientX, y: e.clientY, w0: size.w, h0: size.h, w: size.w, h: size.h };
    setDrag({ w: size.w, h: size.h });
  }
  function onGripMove(e: React.PointerEvent) {
    const r = resize.current;
    if (!r) return;
    const maxW = Math.min(FLOAT_W_MAX, window.innerWidth - 48);
    const maxH = Math.min(FLOAT_H_MAX, window.innerHeight - 80);
    // Panel hugs the top-right: dragging the grip left widens it, dragging down lengthens it.
    r.w = Math.max(FLOAT_W_MIN, Math.min(maxW, r.w0 - (e.clientX - r.x)));
    r.h = Math.max(FLOAT_H_MIN, Math.min(maxH, r.h0 + (e.clientY - r.y)));
    setDrag({ w: r.w, h: r.h });
  }
  function onGripUp(e: React.PointerEvent) {
    const r = resize.current;
    if (!r) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    resize.current = null;
    setDrag(null);
    useApp.getState().updateSettings({ panelSize: { w: r.w, h: r.h } });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // defaultPrevented guard: don't close the note when Esc just dismissed a dialog.
      if (e.key === "Escape" && openPersonId && !e.defaultPrevented) closePerson();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPersonId, closePerson]);

  return (
    <div className="pointer-events-none absolute right-3 top-14 z-40">
      <AnimatePresence mode="wait">
        {openPersonId && (
          <motion.div
            key={openPersonId}
            initial={{ x: size.w + 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: size.w + 24, opacity: 0, transition: EXIT }}
            transition={drag ? { duration: 0 } : ENTER}
            style={{ width: size.w, height: size.h, maxHeight: "calc(100vh - 4.5rem)", maxWidth: "calc(100vw - 1.5rem)" }}
            className="pointer-events-auto relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-xl"
          >
            <div className="flex h-10 shrink-0 items-center justify-between border-b pl-2 pr-1.5">
              <NoteModeSwitch id={openPersonId} current="panel" />
              <div className="flex items-center gap-0.5">
                {person && !person.isSelf && <DeletePersonButton id={person.id} name={person.name} />}
                <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={closePerson}>
                  <X />
                </Button>
              </div>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <div className="px-3.5 py-3">
                <PersonView id={openPersonId} />
              </div>
            </ScrollArea>
            {/* Bottom-left grip: the panel hugs the right edge, so it resizes toward the centre. */}
            <div
              role="separator"
              aria-label="Resize panel"
              onPointerDown={onGripDown}
              onPointerMove={onGripMove}
              onPointerUp={onGripUp}
              className="absolute bottom-0 left-0 z-10 size-4 cursor-nesw-resize touch-none"
            />
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
        <Button variant="ghost" size="icon-sm" aria-label="Delete person">
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
