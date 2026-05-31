import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Eye, PenLine, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConnectionMenuItems } from "@/app/ConnectionMenu";
import { PhotoUpload } from "@/app/PhotoUpload";
import { MarkdownView } from "@/views/MarkdownView";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import type { Handshake, Person, PersonPatch } from "@/switchboard";

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
  const [editingBody, setEditingBody] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [rows, setRows] = useState<Array<{ channel: string; value: string }>>(() => {
    const h = useApp.getState().switchboard.people.get(id)?.handles ?? {};
    return Object.entries(h).map(([channel, value]) => ({ channel, value: String(value) }));
  });

  const handshakes = useApp((s) => s.switchboard.handshakes);
  const people = useApp((s) => s.switchboard.people);
  const connections = useMemo(
    () =>
      [...handshakes.values()]
        .filter((h) => h.people.includes(id))
        .map((h) => {
          const otherId = h.people[0] === id ? h.people[1] : h.people[0];
          return { h, name: people.get(otherId)?.name ?? otherId };
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [handshakes, people, id],
  );

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
      <div className="flex items-start gap-3">
        <PhotoUpload
          src={photo}
          onClick={() => void useApp.getState().setPersonPhoto(id)}
          className="size-14"
          label={photo ? "Change photo" : "Add a photo"}
        />
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
        {/* Per-note actions — an icon toolbar; future note tools / local settings slot in here. */}
        <div className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
          {draft.body.trim() && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={editingBody ? "Preview notes" : "Edit notes"}
              title={editingBody ? "Preview" : "Edit"}
              onClick={() => setEditingBody((v) => !v)}
            >
              {editingBody ? <Eye /> : <PenLine />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={photo ? "Change photo" : "Add a photo"}
            title={photo ? "Change photo" : "Add a photo"}
            onClick={() => void useApp.getState().setPersonPhoto(id)}
          >
            <Camera />
          </Button>
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

      {connections.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-xs text-muted-foreground">Connections</div>
          {connections.map((c) => (
            <ConnectionRow key={c.h.id} handshake={c.h} name={c.name} />
          ))}
        </div>
      )}

      <Separator />
      {editingBody || !draft.body.trim() ? (
        <Textarea
          autoFocus={editingBody}
          value={draft.body}
          onChange={(e) => update({ body: e.target.value })}
          placeholder="Notes… (markdown supported)"
          className={cn(
            "w-full min-w-0 [overflow-wrap:anywhere] min-h-24 resize-none border-0 bg-transparent px-0 text-[15px] leading-relaxed text-foreground/90 shadow-none",
            "focus-visible:ring-0 dark:bg-transparent",
          )}
        />
      ) : (
        // Rendered markdown; click bare text to edit, click a highlight to recolor it.
        <div className="-mx-0.5 cursor-text rounded-sm px-0.5 py-0.5" onClick={() => setEditingBody(true)}>
          <MarkdownView source={draft.body} onChange={(body) => update({ body })} />
        </div>
      )}
    </div>
  );
}

/** One row in the note's Connections list — click it for the tie's settings. */
function ConnectionRow({ handshake, name }: { handshake: Handshake; name: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm transition-colors hover:bg-accent/40 data-[state=open]:bg-accent/50">
          <span className="min-w-0 flex-1 truncate text-foreground/90">{name}</span>
          <span className="shrink-0 text-xs capitalize text-muted-foreground">{handshake.strength}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <ConnectionMenuItems handshakeId={handshake.id} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
