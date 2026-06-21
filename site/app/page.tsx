import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { FauxNote } from "@/components/FauxNote";

/** Inline GitHub mark — lucide 1.x dropped its brand icons. */
function Github({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 5 18.3 5.3 18.3 5.3c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5A11.5 11.5 0 0 0 23.5 12C23.5 5.7 18.3.5 12 .5Z" />
    </svg>
  );
}

const REPO = "https://github.com/re-marked/handshake";
const DOWNLOAD = `${REPO}/releases/latest`;
// next/image with `unoptimized` does NOT prepend basePath to public assets — do it ourselves so
// images resolve under the GitHub Pages subpath (/handshake) in prod and at root in dev.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const asset = (p: string) => `${BASE}${p}`;

export default function Home() {
  return (
    <div className="relative overflow-x-clip">
      <Nav />

      <main className="mx-auto w-full max-w-6xl px-5">
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="pt-16 text-center sm:pt-28">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-primary" />
            Obsidian for your network
          </div>
          <h1 className="mx-auto mt-7 max-w-3xl font-display text-6xl font-semibold leading-[1.02] tracking-tight sm:text-8xl">
            Know who you know.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            The free, local-first app for the people in your orbit — the ties, the warmth, the
            introductions, all in plain files you own.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CTA href={DOWNLOAD}>Download for desktop</CTA>
            <Ghost href={REPO}>
              <Github className="size-4" /> View on GitHub
            </Ghost>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Free &amp; open · macOS, Windows &amp; Linux</p>

          {/* the board with a person's note slid in */}
          <div className="mt-16">
            <Shot
              src="/screenshot-hero.png"
              alt="The Handshake board — a founder's network connected by warmth-weighted ties, with a person's note slid in on the right"
              width={1999}
              height={1184}
              priority
            />
          </div>
        </section>

        {/* ── Value band ─────────────────────────────────────── */}
        <section className="border-t py-20">
          <div className="grid gap-10 sm:grid-cols-3">
            <ValueProp title="Your network is yours.">
              Everyone you know, stored as plain files on your machine. No cloud, no account, no one
              reading your relationships — not even us.
            </ValueProp>
            <ValueProp title="Your way of seeing is yours.">
              Themes, density, layout, the warmth of every tie. Bend Handshake to fit how you think about
              the people in your life.
            </ValueProp>
            <ValueProp title="Your memory should last.">
              Open markdown underneath. Your network outlives the app, the company, and the hype — it&apos;s
              just a folder of text.
            </ValueProp>
          </div>
        </section>

        {/* ── Links / backlinks ─────────────────────────────── */}
        <FeatureRow
          eyebrow="Links"
          title="Write a name. Draw a line."
          blurb="Type [[ in any note and it completes from your people. Mention someone and the board draws the connection — and their card grows with every mention. Your notes quietly become a map you can click straight through."
          reverse
        >
          <div className="flex justify-center">
            <FauxNote />
          </div>
        </FeatureRow>

        {/* ── Two views ─────────────────────────────────────── */}
        <Section
          eyebrow="Two views"
          title="Spatial, or a tidy list."
          blurb="Think in space on the board; find fast in a sortable, searchable list. Order by name or by closeness, dial the density — same plain files underneath, switched in a keystroke."
        >
          <Shot
            src="/screenshot-people.png"
            alt="The People view — a searchable, sortable list of everyone in the network with roles, tags, and warmth dots"
            width={1999}
            height={1180}
          />
        </Section>

        {/* ── Workspace ─────────────────────────────────────── */}
        <Section
          eyebrow="Workspace"
          title="Lay it out like you think."
          blurb="Tabs, resizable splits, and pop-out notes — a true Obsidian-style layout. Put the board beside your people and your goals beneath it, and it's right where you left it next time."
        >
          <Shot
            src="/screenshot-split.png"
            alt="A split workspace — the board and a goals list stacked on the left, the People list on the right"
            width={1999}
            height={1184}
          />
        </Section>

        {/* ── Plain text ─────────────────────────────────────── */}
        <FeatureRow
          eyebrow="Yours, in plain text"
          title="The vault is the database."
          blurb="Every person, every handshake, every goal is just a markdown file with YAML frontmatter, in a folder you choose. No database, no proprietary format, no account, no telemetry."
        >
          <pre className="overflow-x-auto rounded-xl border bg-card/60 p-5 font-mono text-[13px] leading-relaxed text-muted-foreground">
            {`your-network/
├─ people/         self.md · sarah-chen.md …
├─ handshakes/     sarah-chen__tom-okonkwo.md
├─ goals/          meet-naval.md
├─ interactions/   2026-05-26-dm-sarah.md
├─ attachments/    the photos
└─ .handshake/     layout & settings`}
          </pre>
        </FeatureRow>

        {/* ── Download CTA ──────────────────────────────────── */}
        <section className="pb-28 pt-4">
          <div className="overflow-hidden rounded-2xl border bg-card/50 px-6 py-16 text-center">
            <h2 className="mx-auto max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Bring your orbit into focus.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Free, open, and entirely on your machine. The best introductions are usually one or two
              handshakes away.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <CTA href={DOWNLOAD}>Download Handshake</CTA>
              <Ghost href={REPO}>
                <Github className="size-4" /> Star it on GitHub
              </Ghost>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ── building blocks ─────────────────────────────────────── */

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
        <a href="#" className="flex items-center gap-2">
          <Image src={asset("/handshake-logo.png")} alt="" width={26} height={26} priority />
          <span className="font-display text-lg font-semibold tracking-tight">Handshake</span>
        </a>
        <nav className="flex items-center gap-1.5">
          <a
            href={REPO}
            className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            <Github className="size-4" /> GitHub
          </a>
          <CTA href={DOWNLOAD} small>
            Download
          </CTA>
        </nav>
      </div>
    </header>
  );
}

function CTA({ href, children, small }: { href: string; children: React.ReactNode; small?: boolean }) {
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

function Ghost({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-lg border bg-card/40 px-5 py-2.5 text-[15px] font-medium transition-colors hover:bg-accent"
    >
      {children}
    </a>
  );
}

function ValueProp({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 size-1.5 rounded-full bg-primary" />
      <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function Shot({
  src,
  alt,
  width,
  height,
  priority,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border shadow-2xl ring-1 ring-black/5">
      <Image src={asset(src)} alt={alt} width={width} height={height} priority={priority} className="w-full" />
    </div>
  );
}

/** A full-width feature: centered eyebrow/title/blurb above a big visual. */
function Section({
  eyebrow,
  title,
  blurb,
  children,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t py-24">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <div className="text-sm font-medium text-primary">{eyebrow}</div>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{blurb}</p>
      </div>
      {children}
    </section>
  );
}

/** A side-by-side feature: text in one column, a visual in the other (alternates via `reverse`). */
function FeatureRow({
  eyebrow,
  title,
  blurb,
  reverse,
  children,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className={reverse ? "lg:order-2" : ""}>
          <div className="text-sm font-medium text-primary">{eyebrow}</div>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{blurb}</p>
        </div>
        <div className={reverse ? "lg:order-1" : ""}>{children}</div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-5 py-12 text-center">
        <Image src={asset("/handshake-logo.png")} alt="" width={40} height={40} />
        <p className="text-sm text-muted-foreground">Plain files. One rose accent. Yours.</p>
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <a href={REPO} className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
            <Github className="size-4" /> GitHub
          </a>
          <a href={DOWNLOAD} className="transition-colors hover:text-foreground">
            Download
          </a>
        </div>
        <p className="mt-2 text-xs text-muted-foreground/60">A local-first desktop app · built in the open</p>
      </div>
    </footer>
  );
}
