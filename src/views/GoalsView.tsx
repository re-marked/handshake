import { useEffect, useState } from "react";
import { CheckCircle2, Circle, CircleDot, CircleSlash, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { promoteGoalDiff } from "@/app/goals";
import { mintGoalId, type Goal, type GoalPatch, type GoalStatus } from "@/switchboard";

const STATUS_ORDER: Record<GoalStatus, number> = { active: 0, open: 1, done: 2, abandoned: 3 };
const STATUSES: GoalStatus[] = ["open", "active", "abandoned"];

/** Goals — short, standalone aspirations (people you want to meet). Not on the board. */
export function GoalsView() {
  const goals = useApp((s) => s.switchboard.goals);
  const commit = useApp((s) => s.commit);
  const [draft, setDraft] = useState("");

  const list = [...goals.values()].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.title.localeCompare(b.title),
  );

  function add() {
    const title = draft.trim();
    if (!title) return;
    setDraft("");
    const goal: Goal = {
      kind: "goal",
      id: mintGoalId(useApp.getState().switchboard.goals, title),
      type: "target",
      title,
      status: "open",
      body: "",
    };
    void commit([{ op: "createGoal", goal }]);
  }

  return (
    <div className="flex h-full w-full flex-col items-center overflow-hidden bg-background">
      <div className="flex min-h-0 w-full max-w-2xl flex-1 flex-col px-6 py-8">
        <h1 className="mb-4 shrink-0 text-lg font-semibold text-foreground">Goals</h1>

        <div className="mb-1 flex shrink-0 items-center gap-2.5 border-b px-2 pb-2">
          <Plus className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder="Add a goal — someone you want to meet…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <ScrollArea viewportClassName="max-h-full" className="-mx-2 min-h-0 flex-1">
          <div className="flex flex-col gap-0.5 px-2 py-1">
            {list.map((g) => (
              <GoalRow key={g.id} goal={g} />
            ))}
            {list.length === 0 && (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                No goals yet. What do you want? Add one above.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: GoalStatus }) {
  if (status === "done") return <CheckCircle2 className="size-4 text-primary" />;
  if (status === "active") return <CircleDot className="size-4 text-primary/70" />;
  if (status === "abandoned") return <CircleSlash className="size-4 text-muted-foreground/40" />;
  return <Circle className="size-4 text-muted-foreground" />;
}

function GoalRow({ goal }: { goal: Goal }) {
  const commit = useApp((s) => s.commit);
  const [title, setTitle] = useState(goal.title);
  useEffect(() => setTitle(goal.title), [goal.title]);

  const patch = (p: GoalPatch) => void commit([{ op: "updateGoal", id: goal.id, patch: p }]);
  const muted = goal.status === "abandoned";

  async function promote() {
    const { diff, personId } = promoteGoalDiff(useApp.getState().switchboard, goal);
    const res = await commit(diff);
    if (res.ok) {
      useApp.getState().focusBoard();
      useApp.getState().openPerson(personId);
    }
  }

  return (
    <div className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/40">
      <button
        type="button"
        aria-label="Mark met — add as a connection"
        title="Mark met → add to the board as a connection"
        onClick={() => void promote()}
        className="shrink-0 transition-transform hover:scale-110"
      >
        <StatusIcon status={goal.status} />
      </button>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          const t = title.trim();
          if (t && t !== goal.title) patch({ title: t });
          else if (!t) setTitle(goal.title);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className={cn(
          "flex-1 bg-transparent text-sm outline-none",
          muted && "text-muted-foreground line-through",
        )}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Goal settings"
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuRadioGroup
            value={goal.status}
            onValueChange={(v) => patch({ status: v as GoalStatus })}
          >
            {STATUSES.map((s) => (
              <DropdownMenuRadioItem key={s} value={s} className="capitalize">
                {s}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => void commit([{ op: "deleteGoal", id: goal.id }])}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
