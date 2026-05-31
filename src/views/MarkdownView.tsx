import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { openUrl } from "@tauri-apps/plugin-opener";
import { X } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { HL_COLORS, type HlColor, remarkHighlight, rewriteHighlight } from "@/views/remarkHighlight";

/** Links open in the system browser, never navigating the webview away from the app. */
function Link({ href, children }: { href?: string; children?: React.ReactNode }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        if (href) void openUrl(href);
      }}
    >
      {children}
    </a>
  );
}

const COLOR_LABEL: Record<HlColor, string> = {
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
  pink: "Pink",
  purple: "Purple",
};

// Solid, clearly-visible versions of each pastel for the picker chips (the in-text washes are
// translucent and would be near-invisible as little swatches).
const SWATCH: Record<HlColor, string> = {
  yellow: "oklch(0.86 0.14 95)",
  green: "oklch(0.82 0.15 150)",
  blue: "oklch(0.78 0.13 235)",
  pink: "oklch(0.8 0.14 5)",
  purple: "oklch(0.74 0.15 305)",
};

type Recolor = { start: number; end: number; current: HlColor; x: number; y: number };

// Opinionated, theme-aware markdown styling — all in one place, easy to tune. Inherits the note
// font/weight from the body; the rose-tinted blockquote + accent links tie it to the brand.
const PROSE = cn(
  "text-[15px] leading-relaxed text-foreground/90",
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
  "[&_h1]:mt-4 [&_h1]:mb-1.5 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground",
  "[&_h2]:mt-3.5 [&_h2]:mb-1 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground",
  "[&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_p]:my-2",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:cursor-pointer hover:[&_a]:opacity-80",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_ul]:my-2 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1",
  "[&_ol]:my-2 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1",
  "[&_li]:leading-relaxed [&_li::marker]:text-muted-foreground/70",
  "[&_blockquote]:my-2.5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
  "[&_pre]:my-2.5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-[13px]",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-foreground/90",
  "[&_hr]:my-4 [&_hr]:border-border",
  "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md",
  "[&_table]:my-2 [&_table]:block [&_table]:w-fit [&_table]:overflow-x-auto [&_table]:text-sm",
  "[&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-medium",
  "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1",
  "[&_input]:mr-1.5 [&_input]:align-middle",
);

/**
 * Renders a markdown string as styled prose (GFM + `==highlights==`). When `onChange` is supplied,
 * highlights become clickable — click one to recolor it from a soft pastel palette; the change is
 * written straight back into the markdown source.
 */
export function MarkdownView({
  source,
  className,
  onChange,
}: {
  source: string;
  className?: string;
  onChange?: (next: string) => void;
}) {
  const [recolor, setRecolor] = useState<Recolor | null>(null);
  const editable = !!onChange;

  function pick(color: HlColor | "remove") {
    if (recolor && onChange) onChange(rewriteHighlight(source, recolor.start, recolor.end, color));
    setRecolor(null);
  }

  // Custom <mark>: clickable (when editable) to open the recolor palette anchored at the cursor.
  function Mark({ node, className: cls, children }: any) {
    const colorMatch: string | undefined = (cls ?? "").match(/hl-([a-z]+)/)?.[1];
    const current = (HL_COLORS as readonly string[]).includes(colorMatch ?? "")
      ? (colorMatch as HlColor)
      : "yellow";
    const pos = node?.position;
    const canEdit = editable && pos?.start?.offset != null && pos?.end?.offset != null;
    return (
      <mark
        className={cls}
        title={canEdit ? "Right-click to recolor" : undefined}
        // Recolor on right-click: it intercepts the browser context menu and never trips the
        // left-click "enter edit mode" handler, so picking a color just changes the color.
        onContextMenu={
          canEdit
            ? (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setRecolor({
                  start: pos.start.offset,
                  end: pos.end.offset,
                  current,
                  x: r.left, // bottom-left of the highlight → palette opens below it, left-aligned
                  y: r.bottom,
                });
              }
            : undefined
        }
      >
        {children}
      </mark>
    );
  }

  return (
    <div className={cn(PROSE, className)}>
      <Markdown remarkPlugins={[remarkGfm, remarkHighlight]} components={{ a: Link, mark: Mark }}>
        {source}
      </Markdown>

      {editable && (
        <Popover open={!!recolor} onOpenChange={(o) => !o && setRecolor(null)}>
          {recolor && (
            <PopoverAnchor style={{ position: "fixed", left: recolor.x, top: recolor.y }} />
          )}
          <PopoverContent
            side="bottom"
            align="start"
            sideOffset={6}
            className="w-auto p-2"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="flex items-center gap-1.5">
              {HL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={COLOR_LABEL[c]}
                  onClick={() => pick(c)}
                  className={cn(
                    "size-7 overflow-hidden rounded-md ring-1 ring-inset transition-all hover:scale-110",
                    recolor?.current === c ? "ring-2 ring-primary" : "ring-border/70",
                  )}
                >
                  <span className="block size-full rounded-[5px]" style={{ backgroundColor: SWATCH[c] }} />
                </button>
              ))}
              <div className="mx-0.5 h-6 w-px bg-border" />
              <button
                type="button"
                title="Remove highlight"
                onClick={() => pick("remove")}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground ring-1 ring-inset ring-border/70 transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
