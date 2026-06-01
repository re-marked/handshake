import { Check, Link2, Target, Trash2, UserPlus } from "lucide-react";
import type { Diff } from "@/switchboard";
import { notify } from "@/app/toast";

/**
 * Surface a brief notification for a user-driven commit. Called from the commit funnel (skipped
 * for undo/redo replays, which announce themselves). Picks the single most meaningful action.
 */
export function toastForDiff(diff: Diff, inverse: Diff): void {
  const added = diff.find((m) => m.op === "createPerson" && !m.person.isSelf);
  if (added && added.op === "createPerson") {
    notify("Card added", { body: added.person.name, icon: UserPlus, tone: "success" });
    return;
  }
  const goal = diff.find((m) => m.op === "createGoal");
  if (goal && goal.op === "createGoal") {
    notify("Goal added", { body: goal.goal.title, icon: Target, tone: "success" });
    return;
  }
  if (diff.some((m) => m.op === "createHandshake")) {
    notify("Connection added", { body: "Two people are now linked.", icon: Link2, tone: "success" });
    return;
  }
  const deleted = diff.find((m) => m.op === "deletePerson");
  if (deleted) {
    const inv = inverse.find((m) => m.op === "createPerson");
    const name = inv && inv.op === "createPerson" ? inv.person.name : undefined;
    notify("Card removed", { body: name, icon: Trash2, tone: "muted" });
    return;
  }
  if (diff.some((m) => m.op === "logInteraction")) {
    notify("Interaction logged", { tone: "muted" });
    return;
  }
  // Anything else is an edit → one coalescing "Saved" card that lingers while you type.
  if (diff.some((m) => m.op.startsWith("update"))) {
    notify("Saved", { body: "Your changes are saved.", icon: Check, tone: "muted", key: "saved", durationMs: 2200 });
  }
}
