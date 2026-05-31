import { PanelsTopLeft, PanelTop, Search, Settings, Share2, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { activeView } from "@/workspace/ops";

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
  const activeType = useApp((s) => activeView(s.workspace)?.type);
  const openView = useApp((s) => s.openView);
  const setCommandOpen = useApp((s) => s.setCommandOpen);
  const layoutMode = useApp((s) => s.workspace.layoutMode);
  const setLayoutMode = useApp((s) => s.setLayoutMode);
  return (
    <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-2">
      <RailButton icon={Share2} label="Board" active={activeType === "board"} onClick={() => openView({ type: "board", id: "main" }, "tab")} />
      <RailButton icon={Users} label="People" active={activeType === "people"} onClick={() => openView({ type: "people" }, "tab")} />
      <RailButton icon={Target} label="Goals" active={activeType === "goals"} onClick={() => openView({ type: "goals" }, "tab")} />
      <RailButton icon={Search} label="Search (Ctrl-P)" onClick={() => setCommandOpen(true)} />
      <div className="mt-auto flex flex-col items-center gap-1">
        <RailButton
          icon={layoutMode === "tabs" ? PanelsTopLeft : PanelTop}
          label={`Layout: ${layoutMode === "tabs" ? "per-pane tabs" : "one top bar"} — click to switch`}
          onClick={() => setLayoutMode(layoutMode === "tabs" ? "simple" : "tabs")}
        />
        <RailButton icon={Settings} label="Settings" />
      </div>
    </nav>
  );
}
