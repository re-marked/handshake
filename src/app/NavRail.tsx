import { Search, Settings, Share2, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";

function RailButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Share2;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-muted text-primary",
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} />
    </button>
  );
}

/** The thin left rail — navigation between Views (most are static until L6; see SHELL.md). */
export function NavRail() {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);
  const setCommandOpen = useApp((s) => s.setCommandOpen);
  return (
    <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-2">
      <RailButton icon={Share2} label="Board" active={view === "board"} onClick={() => setView("board")} />
      <RailButton icon={Users} label="People" active={view === "people"} onClick={() => setView("people")} />
      <RailButton icon={Target} label="Goals" active={view === "goals"} onClick={() => setView("goals")} />
      <RailButton icon={Search} label="Search (Ctrl-P)" onClick={() => setCommandOpen(true)} />
      <div className="mt-auto">
        <RailButton icon={Settings} label="Settings" />
      </div>
    </nav>
  );
}
