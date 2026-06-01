import { useState } from "react";
import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LastSnapshot } from "@/app/LastSnapshot";
import { appVersion, buildLine } from "@/lib/buildInfo";

// A tiny bit of personality — one is picked at random each time the dialog opens.
const PHRASES = [
  "Obsidian for the people you know.",
  "Every hello is a thread.",
  "Your circles, kept with care.",
  "A quiet place for your people.",
  "Connections, remembered.",
  "Built local-first, with love.",
  "Small world, well kept.",
  "Handshakes all the way down.",
  "The network is the point.",
  "Made for keeping in touch.",
];

const pick = () => PHRASES[Math.floor(Math.random() * PHRASES.length)];

/** Rail "info" button → a small About dialog: version, build, last snapshot, and a random phrase. */
export function AboutDialog() {
  const [phrase, setPhrase] = useState(pick);
  return (
    <Dialog onOpenChange={(open) => open && setPhrase(pick())}>
      <DialogTrigger asChild>
        <button
          title="About"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Info className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton className="gap-3 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Handshake {appVersion()}</DialogTitle>
        </DialogHeader>
        {/* Uniform body: one size, muted; mono only for the technical strings, italic for the phrase. */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Obsidian for your network — a local-first map of the people you know.</p>
          <p className="font-mono text-muted-foreground/80">{buildLine()}</p>
          <LastSnapshot />
          <p className="italic">{phrase}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
