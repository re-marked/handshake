import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { REPO } from "@/lib/seo";
import { asset } from "@/lib/asset";

/** Inline GitHub mark – lucide 1.x dropped its brand icons. */
export function Github({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 5 18.3 5.3 18.3 5.3c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5A11.5 11.5 0 0 0 23.5 12C23.5 5.7 18.3.5 12 .5Z" />
    </svg>
  );
}

export function CTA({ href, children, small }: { href: string; children: React.ReactNode; small?: boolean }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md ${
        small ? "px-3.5 py-1.5 text-sm" : "px-5 py-2.5 text-[15px]"
      }`}
    >
      {children}
      {!small && <ArrowRight className="size-4" />}
    </a>
  );
}

export function Ghost({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-lg border bg-card/40 px-5 py-2.5 text-[15px] font-medium transition-colors hover:bg-accent"
    >
      {children}
    </a>
  );
}

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[2000px] items-center justify-between px-6 sm:px-12 lg:px-20">
        <a href={asset("/")} className="flex items-center gap-2">
          <Image src={asset("/handshake-logo.png")} alt="" width={26} height={26} priority />
          <span className="font-display text-lg font-semibold">Handshake</span>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Beta
          </span>
        </a>
        <nav className="flex items-center gap-1.5">
          <a
            href={asset("/guide")}
            className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Guide
          </a>
          <a
            href={asset("/faq")}
            className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            FAQ
          </a>
          <a
            href={REPO}
            className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            <Github className="size-4" /> GitHub
          </a>
          <CTA href={asset("/download")} small>
            Download
          </CTA>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="mx-auto flex w-full max-w-[2000px] flex-col items-center gap-4 px-6 py-12 text-center sm:px-12 lg:px-20">
        <Image src={asset("/handshake-logo.png")} alt="" width={40} height={40} />
        <p className="text-sm text-muted-foreground">Plain files. One rose accent. Yours.</p>
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <a href={REPO} className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
            <Github className="size-4" /> GitHub
          </a>
          <a href={asset("/download")} className="transition-colors hover:text-foreground">
            Download
          </a>
          <a href={asset("/guide")} className="transition-colors hover:text-foreground">
            Guide
          </a>
          <a href={asset("/faq")} className="transition-colors hover:text-foreground">
            FAQ
          </a>
          <a href={asset("/personal-crm")} className="transition-colors hover:text-foreground">
            Compare
          </a>
          <a href={asset("/changelog")} className="transition-colors hover:text-foreground">
            Changelog
          </a>
        </div>
        <p className="mt-2 text-xs text-muted-foreground/60">
          A local-first desktop app · public beta · built in the open
        </p>
      </div>
    </footer>
  );
}
