import { useEffect, useMemo, useRef, useState } from "react";
import { Locate, Plus, Search, User, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { TIE_COLOR } from "@/board/ties";
import {
  affiliationTerms,
  canonicalHandshakeId,
  canonicalPair,
  mintPersonId,
  summarizeAffiliations,
  type Diff,
  type Handshake,
  type Person,
  type Strength,
} from "@/switchboard";

type Density = "compact" | "comfortable" | "spacious";

const DENSITY: Record<Density, { row: string; avatar: string; text: string; rowH: number }> = {
  compact: { row: "py-1.5", avatar: "size-8", text: "text-sm", rowH: 46 },
  comfortable: { row: "py-2.5", avatar: "size-10", text: "text-[15px]", rowH: 60 },
  spacious: { row: "py-4", avatar: "size-12", text: "text-base", rowH: 80 },
};

const RANK: Record<Strength, number> = { close: 0, warm: 1, cold: 2, dormant: 3 };

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

/** People — the calm, full-width index of everyone. Search, tag filters, density, pagination. */
export function PeopleView() {
  const people = useApp((s) => s.switchboard.people);
  const handshakes = useApp((s) => s.switchboard.handshakes);
  const selfId = useApp((s) => s.switchboard.self?.id);
  const photos = useApp((s) => s.photos);
  const density = useApp((s) => s.settings.density);
  const setDensity = useApp((s) => s.setDensity);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "closeness">("name");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const cfg = DENSITY[density];
  const q = query.trim().toLowerCase();

  // Fit as many rows as the list area can hold so it fills to the bottom (recomputed on resize).
  const listRef = useRef<HTMLDivElement>(null);
  const [fitRows, setFitRows] = useState(10);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const measure = () => setFitRows(Math.max(1, Math.floor(el.clientHeight / cfg.rowH)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cfg.rowH]);

  const tieStrength = (id: string): Strength | undefined =>
    selfId ? handshakes.get(canonicalHandshakeId(selfId, id))?.strength : undefined;

  const toggleTag = (t: string) =>
    setTagFilters((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const roster = useMemo(() => {
    return [...people.values()]
      .filter((p) => tagFilters.every((t) => p.tags.includes(t)))
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          affiliationTerms(p.affiliations).some((t) => t.toLowerCase().includes(q)) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (a.isSelf !== b.isSelf) return a.isSelf ? -1 : 1;
        if (sort === "closeness") {
          const ra = tieStrength(a.id) ? RANK[tieStrength(a.id)!] : 9;
          const rb = tieStrength(b.id) ? RANK[tieStrength(b.id)!] : 9;
          if (ra !== rb) return ra - rb;
        }
        return a.name.localeCompare(b.name);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, handshakes, selfId, q, sort, tagFilters]);

  const pageSize = fitRows;
  const totalPages = Math.max(1, Math.ceil(roster.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageItems = roster.slice((current - 1) * pageSize, current * pageSize);

  useEffect(() => setPage(1), [q, sort, density, tagFilters]);

  const exact = q.length > 0 && [...people.values()].some((p) => p.name.trim().toLowerCase() === q);

  async function createConnected(name: string) {
    const sb = useApp.getState().switchboard;
    const id = mintPersonId(sb.people, name);
    const person: Person = { kind: "person", id, name: name.trim(), isSelf: false, tags: [], affiliations: [], handles: {}, body: "" };
    const diff: Diff = [{ op: "createPerson", person }];
    const sid = sb.self?.id;
    if (sid && sid !== id) {
      const [pa, pb] = canonicalPair(sid, id);
      const handshake: Handshake = {
        kind: "handshake",
        id: canonicalHandshakeId(sid, id),
        people: [pa, pb],
        strength: useApp.getState().settings.defaultTieStrength,
        body: "",
      };
      diff.push({ op: "createHandshake", handshake });
    }
    const res = await useApp.getState().commit(diff);
    if (res.ok) {
      setQuery("");
      useApp.getState().revealPerson(id);
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 w-full flex-1 flex-col px-8 py-7">
        <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
          <h1 className="mr-auto text-xl font-semibold text-foreground">
            People <span className="text-base font-normal text-muted-foreground">· {people.size}</span>
          </h1>
          <ToggleGroup
            type="single"
            variant="outline"
            value={sort}
            onValueChange={(v) => v && setSort(v as "name" | "closeness")}
          >
            <ToggleGroupItem value="name" className="px-4">A–Z</ToggleGroupItem>
            <ToggleGroupItem value="closeness" className="px-4">Closeness</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            variant="outline"
            value={density}
            onValueChange={(v) => v && setDensity(v as Density)}
          >
            <ToggleGroupItem value="compact" className="px-4">Compact</ToggleGroupItem>
            <ToggleGroupItem value="comfortable" className="px-4">Comfortable</ToggleGroupItem>
            <ToggleGroupItem value="spacious" className="px-4">Spacious</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="mb-2 flex h-11 shrink-0 items-center gap-2.5 rounded-md border px-3.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q && !exact) void createConnected(query);
            }}
            placeholder="Search people, or type a new name to add…"
            className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
        </div>

        {tagFilters.length > 0 && (
          <div className="mb-2 flex shrink-0 flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Filtering:</span>
            {tagFilters.map((t) => (
              <Badge
                key={t}
                variant="default"
                className="cursor-pointer gap-1 pr-1"
                onClick={() => toggleTag(t)}
              >
                {t}
                <X className="size-3" />
              </Badge>
            ))}
            <button
              type="button"
              onClick={() => setTagFilters([])}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              clear
            </button>
          </div>
        )}

        <div ref={listRef} className="-mx-2 min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="flex flex-col px-2">
              {q && !exact && (
                <button
                  type="button"
                  onClick={() => void createConnected(query)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2 text-left text-primary transition-colors hover:bg-accent/40",
                    cfg.row,
                  )}
                >
                  <Plus className="size-4 shrink-0" />
                  <span className="truncate text-[15px]">Create “{query.trim()}” — connected to you</span>
                </button>
              )}
              {pageItems.map((p) => {
                const s = tieStrength(p.id);
                return (
                  <PersonRow
                    key={p.id}
                    person={p}
                    photo={photos.get(p.id)}
                    cfg={cfg}
                    tieColor={s ? TIE_COLOR[s] : undefined}
                    activeTags={tagFilters}
                    onTag={toggleTag}
                  />
                );
              })}
              {roster.length === 0 && (
                <p className="px-2 py-10 text-center text-sm text-muted-foreground">No people match.</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <Pagination className="mt-3 shrink-0">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious disabled={current <= 1} onClick={() => setPage(current - 1)} />
            </PaginationItem>
            {pageWindow(current, totalPages).map((p, i) => (
              <PaginationItem key={i}>
                {p === "…" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink isActive={p === current} onClick={() => setPage(p)}>
                    {p}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext disabled={current >= totalPages} onClick={() => setPage(current + 1)} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

function PersonRow({
  person,
  photo,
  cfg,
  tieColor,
  activeTags,
  onTag,
}: {
  person: Person;
  photo?: string;
  cfg: { row: string; avatar: string; text: string };
  tieColor?: string;
  activeTags: string[];
  onTag: (t: string) => void;
}) {
  const subtitle = summarizeAffiliations(person.affiliations);
  const open = () => useApp.getState().revealPerson(person.id);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter") open();
      }}
      className={cn(
        "group flex cursor-pointer items-center gap-3.5 rounded-md px-2 outline-none transition-colors hover:bg-accent/40 focus-visible:bg-accent/50",
        cfg.row,
      )}
    >
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ background: tieColor ?? "var(--muted-foreground)", opacity: tieColor ? 1 : 0.25 }}
      />
      <Avatar className={cn("shrink-0", cfg.avatar)}>
        {photo && <AvatarImage src={photo} alt="" />}
        <AvatarFallback>
          <User className="size-[55%] text-muted-foreground/60" strokeWidth={1.75} />
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn("truncate font-medium text-foreground", cfg.text)}>{person.name}</span>
          {person.isSelf && <span className="shrink-0 text-xs text-primary">you</span>}
        </div>
        {subtitle && <div className="truncate text-sm text-muted-foreground">{subtitle}</div>}
      </div>
      <div className="hidden shrink-0 items-center gap-1 sm:flex">
        {person.tags.slice(0, 4).map((t) => (
          <Badge
            key={t}
            variant={activeTags.includes(t) ? "default" : "secondary"}
            className="cursor-pointer font-normal"
            onClick={(e) => {
              e.stopPropagation();
              onTag(t);
            }}
          >
            {t}
          </Badge>
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`Locate ${person.name} on the board`}
        title="Locate on board"
        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          useApp.getState().locatePerson(person.id);
        }}
      >
        <Locate />
      </Button>
    </div>
  );
}
