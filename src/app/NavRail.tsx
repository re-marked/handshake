import { Search, Settings, Share2, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Static for now — these open Views once L6 lands (see SHELL.md).
const ITEMS = [
  { icon: Share2, label: "Board", active: true },
  { icon: Users, label: "People", active: false },
  { icon: Target, label: "Goals", active: false },
  { icon: Search, label: "Search", active: false },
];

function RailButton({ icon: Icon, label, active }: { icon: typeof Share2; label: string; active?: boolean }) {
  return (
    <button
      title={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-muted text-primary",
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} />
    </button>
  );
}

/** The thin left rail — navigation between Views. */
export function NavRail() {
  return (
    <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-2">
      {ITEMS.map((it) => (
        <RailButton key={it.label} icon={it.icon} label={it.label} active={it.active} />
      ))}
      <div className="mt-auto">
        <RailButton icon={Settings} label="Settings" />
      </div>
    </nav>
  );
}
