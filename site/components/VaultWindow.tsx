import type { ReactNode } from "react";
import { Folder, FileText } from "lucide-react";

const TREE: { name: string; kind: "folder" | "file"; active?: boolean }[] = [
  { name: "people/", kind: "folder" },
  { name: "self.md", kind: "file" },
  { name: "elena-hart.md", kind: "file", active: true },
  { name: "kevin-zhao.md", kind: "file" },
  { name: "handshakes/", kind: "folder" },
  { name: "goals/", kind: "folder" },
  { name: "interactions/", kind: "folder" },
  { name: "attachments/", kind: "folder" },
  { name: ".handshake/", kind: "folder" },
];

/** A faux editor window for the "it's just plain files" section: a file tree on the left, one of the
 *  person markdown files open on the right — frontmatter up top, a note with a `[[backlink]]` below. */
export function VaultWindow() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card/50 font-mono shadow-2xl ring-1 ring-black/5">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <span className="size-3 rounded-full bg-muted-foreground/25" />
        <span className="size-3 rounded-full bg-muted-foreground/25" />
        <span className="size-3 rounded-full bg-muted-foreground/25" />
        <span className="ml-2 text-xs text-muted-foreground">your-network</span>
      </div>

      <div className="grid sm:grid-cols-[minmax(0,12rem)_1fr]">
        {/* file tree */}
        <ul className="hidden border-r border-border/60 p-2.5 text-[13px] sm:block">
          {TREE.map((t) => (
            <li
              key={t.name}
              className={`flex items-center gap-2 rounded px-2 py-1.5 ${
                t.active ? "bg-primary/10 text-primary" : "text-muted-foreground"
              } ${t.kind === "file" ? "pl-6" : ""}`}
            >
              {t.kind === "folder" ? (
                <Folder className="size-3.5 shrink-0 text-primary/70" />
              ) : (
                <FileText className="size-3.5 shrink-0 opacity-60" />
              )}
              <span className="truncate">{t.name}</span>
            </li>
          ))}
        </ul>

        {/* the open markdown file */}
        <div className="overflow-x-auto p-5 text-[13px] leading-[1.75]">
          <Dim>---</Dim>
          <Field k="name" v="Elena Hart" />
          <Field k="role" v="Co-founder & CEO" />
          <Field k="company" v="Cadence" />
          <Field k="tags" v="[cofounder, ceo]" />
          <Dim>---</Dim>
          <p className="mt-4 text-foreground/80">
            The CEO, and the reason this works. We split it clean — she runs the room, I run product +
            eng with{" "}
            <span className="rounded bg-primary/10 px-1 py-0.5 font-medium text-primary">
              [[Kevin Zhao]]
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function Dim({ children }: { children: ReactNode }) {
  return <div className="text-muted-foreground/60">{children}</div>;
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <span className="text-primary/80">{k}:</span> <span className="text-foreground/80">{v}</span>
    </div>
  );
}
