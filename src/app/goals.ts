import {
  canonicalHandshakeId,
  canonicalPair,
  mintPersonId,
  type Diff,
  type Goal,
  type Handshake,
  type Person,
  type Switchboard,
} from "@/switchboard";

/**
 * The diff that "graduates" a target goal into a real person: mint a person from the
 * goal's title, connect them to you (a cold tie), and delete the goal. Shared by the
 * Goals view and the board's goal cards.
 */
export function promoteGoalDiff(sb: Switchboard, goal: Goal): { diff: Diff; personId: string } {
  const id = mintPersonId(sb.people, goal.title);
  const person: Person = {
    kind: "person",
    id,
    name: goal.title.trim() || "Untitled",
    isSelf: false,
    tags: [],
    handles: {},
    body: "",
  };
  const diff: Diff = [{ op: "createPerson", person }];
  const selfId = sb.self?.id;
  if (selfId && selfId !== id) {
    const [pa, pb] = canonicalPair(selfId, id);
    const handshake: Handshake = {
      kind: "handshake",
      id: canonicalHandshakeId(selfId, id),
      people: [pa, pb],
      strength: "cold",
      body: "",
    };
    diff.push({ op: "createHandshake", handshake });
  }
  diff.push({ op: "deleteGoal", id: goal.id });
  return { diff, personId: id };
}
