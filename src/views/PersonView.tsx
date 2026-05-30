import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/app/store";

/** Read view of a person — the note that floats up when you tap a polaroid. */
export function PersonView({ id }: { id: string }) {
  const person = useApp((s) => s.switchboard.people.get(id));
  const photo = useApp((s) => s.photos.get(id));

  if (!person) {
    return <div className="p-2 text-sm text-muted-foreground">Person not found.</div>;
  }
  const subtitle = [person.role, person.company].filter(Boolean).join(" · ");
  const handles = Object.entries(person.handles ?? {});

  return (
    <div className="flex flex-col gap-3.5 text-[15px] leading-relaxed">
      <div className="flex items-center gap-3">
        <Avatar className="size-14">
          {photo && <AvatarImage src={photo} alt="" />}
          <AvatarFallback>
            <User className="size-6 text-muted-foreground/60" strokeWidth={1.75} />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-foreground">{person.name}</div>
          {subtitle && <div className="truncate text-sm text-muted-foreground">{subtitle}</div>}
        </div>
      </div>

      {person.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {person.tags.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
      )}

      {handles.length > 0 && (
        <div className="flex flex-col gap-1">
          {handles.map(([channel, value]) => (
            <div key={channel} className="flex items-baseline gap-2 text-sm">
              <span className="w-20 shrink-0 capitalize text-muted-foreground">{channel}</span>
              <span className="truncate font-mono text-[13px] text-foreground/90">{value}</span>
            </div>
          ))}
        </div>
      )}

      {person.body && (
        <>
          <Separator />
          <p className="whitespace-pre-wrap text-foreground/90">{person.body}</p>
        </>
      )}
    </div>
  );
}
