import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { openUrl } from "@tauri-apps/plugin-opener";
import { cn } from "@/lib/utils";

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

/** Renders a markdown string as styled prose (GFM: tables, task lists, strikethrough). */
export function MarkdownView({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn(PROSE, className)}>
      <Markdown remarkPlugins={[remarkGfm]} components={{ a: Link }}>
        {source}
      </Markdown>
    </div>
  );
}
