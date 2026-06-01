import { Check, Link2, Target, Trash2, UserPlus } from "lucide-react";
import type { Diff } from "@/switchboard";
import { toast } from "@/app/toast";

/**
 * Surface a brief pill for a user-driven commit. Called from the commit funnel (skipped for
 * undo/redo replays, which announce themselves). Picks the single most meaningful action.
 */
export function toastForDiff(diff: Diff, inverse: Diff): void {
  const added = diff.find((m) => m.op === "createPerson" && !m.person.isSelf);
  if (added && added.op === "createPerson") {
    toast(`Added ${added.person.name}`, { icon: UserPlus, tone: "success" });
    return;
  }
  if (diff.some((m) => m.op === "createGoal")) {
    toast("New goal", { icon: Target, tone: "success" });
    return;
  }
  if (diff.some((m) => m.op === "createHandshake")) {
    toast("New connection", { icon: Link2, tone: "success" });
    return;
  }
  const deleted = diff.find((m) => m.op === "deletePerson");
  if (deleted) {
    const inv = inverse.find((m) => m.op === "createPerson");
    const name = inv && inv.op === "createPerson" ? inv.person.name : "card";
    toast(`Removed ${name}`, { icon: Trash2, tone: "muted" });
    return;
  }
  if (diff.some((m) => m.op === "logInteraction")) {
    toast("Logged interaction", { tone: "muted" });
    return;
  }
  // Anything else is an edit → one coalescing "Saved" pill that lingers while you type.
  if (diff.some((m) => m.op.startsWith("update"))) {
    toast("Saved", { icon: Check, tone: "muted", key: "saved", durationMs: 1600 });
  }
}
