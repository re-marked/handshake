import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, User, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import type { Person, PersonPatch } from "@/switchboard";

// The fields the note edits; the commit patch is diffed over exactly these.
const EDITABLE = ["name", "role", "company", "tags", "handles", "body"] as const;

// Inline editable text — looks like prose until you focus it.
const inline =
  "h-auto rounded-md border-0 bg-transparent px-1.5 py-0.5 shadow-none transition-colors " +
  "hover:bg-accent/40 focus-visible:bg-accent/50 focus-visible:ring-0 dark:bg-transparent dark:hover:bg-accent/40";

function jsonEq(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * Holds a local draft of the person and routes edits through the commit funnel:
 * debounced while typing, and flushed on close/switch so the last keystrokes are
 * never lost. Reads the live person fresh at commit time (no stale closures).
 */
function usePersonEditor(id: string) {
  const live = useApp((s) => s.switchboard.people.get(id));
  const [draft, setDraft] = useState<Person | undefined>(() => live);

  // Safety net: reseed if the same instance is ever pointed at a new id.
  const seeded = useRef(id);
  useEffect(() => {
    if (seeded.current !== id) {
      seeded.current = id;
      setDraft(useApp.getState().switchboard.people.get(id));
    }
  }, [id]);

  const draftRef = useRef(draft);
  draftRef.current = draft;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const d = draftRef.current;
    const cur = useApp.getState().switchboard.people.get(id);
    if (!d || !cur) return;
    const patch: PersonPatch = {};
    for (const k of EDITABLE) {
      // Never blank out the identity-ish name; keep the last real one.
      const next = k === "name" && !String(d.name).trim() ? cur.name : d[k];
      if (!jsonEq(cur[k], next)) (patch as Record<string, unknown>)[k] = next;
    }
    if (Object.keys(patch).length > 0) {
      void useApp.getState().commit([{ op: "updatePerson", id, patch }]);
    }
  }, [id]);

  // Debounce commits while typing…
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [draft, flush]);

  // …and flush on unmount (note closed or switched to someone else).
  useEffect(() => () => flush(), [flush]);

  return { draft, setDraft };
}

/** The person note — one always-editable surface (no view/edit mode). */
export function PersonView({ id }: { id: string }) {
  const { draft, setDraft } = usePersonEditor(id);
  const photo = useApp((s) => s.photos.get(id));
  const [tagInput, setTagInput] = useState("");
  const [rows, setRows] = useState<Array<{ channel: string; value: string }>>(() => {
    const h = useApp.getState().switchboard.people.get(id)?.handles ?? {};
    return Object.entries(h).map(([channel, value]) => ({ channel, value: String(value) }));
  });

  if (!draft) {
    return <div className="p-2 text-sm text-muted-foreground">Person not found.</div>;
  }

  const update = (patch: Partial<Person>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase();
    if (t && !draft.tags.includes(t)) update({ tags: [...draft.tags, t] });
  };
  const removeTag = (t: string) => update({ tags: draft.tags.filter((x) => x !== t) });

  const syncHandles = (next: Array<{ channel: string; value: string }>) => {
    setRows(next);
    const obj: Record<string, string> = {};
    for (const { channel, value } of next) {
      const c = channel.trim().toLowerCase();
      if (c) obj[c] = value;
    }
    update({ handles: obj as Person["handles"] });
  };
  const setRow = (i: number, key: "channel" | "value", v: string) =>
    syncHandles(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));

  return (
    <div className="flex flex-col gap-3.5 text-[15px] leading-relaxed">
      <div className="flex items-center gap-3">
        <Avatar className="size-14">
          {photo && <AvatarImage src={photo} alt="" />}
          <AvatarFallback>
            <User className="size-6 text-muted-foreground/60" strokeWidth={1.75} />
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Input
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Name"
            className={cn(inline, "-ml-1.5 text-lg font-semibold text-foreground")}
          />
          <Input
            value={draft.role ?? ""}
            onChange={(e) => update({ role: e.target.value.trim() ? e.target.value : undefined })}
            placeholder="Role"
            className={cn(inline, "-ml-1.5 text-sm text-muted-foreground")}
          />
          <Input
            value={draft.company ?? ""}
            onChange={(e) => update({ company: e.target.value.trim() ? e.target.value : undefined })}
            placeholder="Company"
            className={cn(inline, "-ml-1.5 text-sm text-muted-foreground")}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {draft.tags.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1 pr-1">
            {t}
            <button
              type="button"
              aria-label={`Remove ${t}`}
              onClick={() => removeTag(t)}
              className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(tagInput);
              setTagInput("");
            } else if (e.key === "Backspace" && !tagInput && draft.tags.length) {
              removeTag(draft.tags[draft.tags.length - 1]);
            }
          }}
          onBlur={() => {
            if (tagInput.trim()) {
              addTag(tagInput);
              setTagInput("");
            }
          }}
          placeholder={draft.tags.length ? "" : "Add tags…"}
          className="h-6 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              value={row.channel}
              onChange={(e) => setRow(i, "channel", e.target.value)}
              placeholder="channel"
              className={cn(inline, "w-24 shrink-0 text-sm capitalize text-muted-foreground")}
            />
            <Input
              value={row.value}
              onChange={(e) => setRow(i, "value", e.target.value)}
              placeholder="handle / link"
              className={cn(inline, "min-w-0 flex-1 font-mono text-[13px] text-foreground/90")}
            />
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Remove handle"
              onClick={() => syncHandles(rows.filter((_, idx) => idx !== i))}
            >
              <X />
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="xs"
          className="self-start text-muted-foreground"
          onClick={() => setRows((r) => [...r, { channel: "", value: "" }])}
        >
          <Plus /> handle
        </Button>
      </div>

      <Separator />
      <Textarea
        value={draft.body}
        onChange={(e) => update({ body: e.target.value })}
        placeholder="Notes…"
        className={cn(
          "min-h-24 resize-none border-0 bg-transparent px-0 text-[15px] leading-relaxed text-foreground/90 shadow-none",
          "focus-visible:ring-0 dark:bg-transparent",
        )}
      />
    </div>
  );
}
