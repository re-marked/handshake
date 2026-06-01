import { useState } from "react";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LastSnapshot } from "@/app/LastSnapshot";
import { appVersion, buildLine } from "@/lib/buildInfo";

// A tiny bit of personality — one is picked at random each time the popover opens.
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

/** Rail "info" button → a small popover: version, build, last snapshot, and a random phrase. */
export function AboutPopover() {
  const [phrase, setPhrase] = useState(pick);
  return (
    <Popover onOpenChange={(open) => open && setPhrase(pick())}>
      <PopoverTrigger asChild>
        <button
          title="About"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Info className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" sideOffset={8} className="w-72">
        <div className="space-y-2.5">
          <p className="text-sm font-semibold text-foreground">Handshake {appVersion()}</p>
          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/80">{buildLine()}</p>
          <div className="border-t border-border/60 pt-2">
            <LastSnapshot />
          </div>
          <p className="text-xs italic text-muted-foreground/70">{phrase}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
