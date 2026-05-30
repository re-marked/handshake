import { Unlink } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/app/store";
import type { HandshakePatch, Strength } from "@/switchboard";

const STRENGTHS: Strength[] = ["close", "warm", "cold", "dormant"];
const NONE = "__none__";

/**
 * The settings for one connection (handshake) — the *contents* of a menu, shared by the
 * note's Connections list and the board's link lines. Drop it inside a DropdownMenuContent.
 * Strength re-weights the link; "Introduced by" drives board parenting; Unlink cuts the tie.
 */
export function ConnectionMenuItems({ handshakeId }: { handshakeId: string }) {
  const handshake = useApp((s) => s.switchboard.handshakes.get(handshakeId));
  const people = useApp((s) => s.switchboard.people);
  const commit = useApp((s) => s.commit);
  if (!handshake) return null;

  const [a, b] = handshake.people;
  const label = `${people.get(a)?.name ?? a} ↔ ${people.get(b)?.name ?? b}`;
  const candidates = [...people.values()]
    .filter((p) => p.id !== a && p.id !== b)
    .sort((x, y) => x.name.localeCompare(y.name));
  const patch = (p: HandshakePatch) => void commit([{ op: "updateHandshake", id: handshakeId, patch: p }]);

  return (
    <>
      <DropdownMenuLabel className="truncate">{label}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup
        value={handshake.strength}
        onValueChange={(v) => patch({ strength: v as Strength })}
      >
        {STRENGTHS.map((s) => (
          <DropdownMenuRadioItem key={s} value={s} className="capitalize">
            {s}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Introduced by</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-48 p-0">
          <DropdownMenuRadioGroup
            value={handshake.establishedVia ?? NONE}
            onValueChange={(v) => patch({ establishedVia: v === NONE ? undefined : v })}
          >
            <ScrollArea className="h-56">
              <div className="p-1">
                <DropdownMenuRadioItem value={NONE}>No one</DropdownMenuRadioItem>
                {candidates.map((p) => (
                  <DropdownMenuRadioItem key={p.id} value={p.id}>
                    {p.name}
                  </DropdownMenuRadioItem>
                ))}
              </div>
            </ScrollArea>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        variant="destructive"
        onSelect={() => void commit([{ op: "deleteHandshake", id: handshakeId }])}
      >
        <Unlink /> Unlink
      </DropdownMenuItem>
    </>
  );
}
