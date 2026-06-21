import Image from "next/image";
import { ArrowRight, FileText, Lock, SlidersHorizontal } from "lucide-react";
import { VaultWindow } from "@/components/VaultWindow";

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
    <div className="relative">
      <Nav />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[2000px] px-6 pt-20 text-center sm:px-12 sm:pt-32 lg:px-20">
        <h1 className="mx-auto font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl lg:text-8xl">
          Know who you know.
        </h1>
        <p className="mx-auto mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          A desktop app for mapping the people you know — who they are, how you met, and how everyone&apos;s
          connected. Local-first, and yours in plain text.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <CTA href={DOWNLOAD}>Download for desktop</CTA>
          <Ghost href={REPO}>
            <Github className="size-4" /> View on GitHub
          </Ghost>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Free &amp; open · macOS, Windows &amp; Linux</p>
      </section>

      {/* the board with a person's note slid in — fades into the page at the bottom */}
      <div className="mx-auto mt-16 w-full max-w-[2000px] px-6 sm:px-12 lg:px-20">
        <div className="relative">
          <Image
            src={asset("/screenshot-hero.png")}
            alt="The Handshake board — a founder's network connected by warmth-weighted ties, with a person's note slid in on the right"
            width={1999}
            height={1074}
            priority
            className="w-full rounded-t-xl"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 [background-image:linear-gradient(to_bottom,transparent,var(--background))]" />
        </div>
      </div>

      <main className="mx-auto w-full max-w-[2000px] px-6 sm:px-12 lg:px-20">
        {/* ── Value band ─────────────────────────────────────── */}
        <section className="py-20">
          <div className="grid gap-10 sm:grid-cols-3">
            <ValueProp icon={Lock} title="Your network is yours.">
              Everyone you know, stored as plain files on your machine. No cloud, no account, no one
              reading your relationships — not even us.
            </ValueProp>
            <ValueProp icon={SlidersHorizontal} title="Your way of seeing is yours.">
              Themes, density, layout, the warmth of every tie. Bend Handshake to fit how you think about
              the people in your life.
            </ValueProp>
            <ValueProp icon={FileText} title="Your memory should last.">
              Open markdown underneath. Your network outlives the app, the company, and the hype — it&apos;s
              just a folder of text.
            </ValueProp>
          </div>
        </section>

        {/* ── Links / backlinks ─────────────────────────────── */}
        <FeatureRow
          title="Write a name. Draw a line."
          blurb="Type [[ in any note and it completes from your people. Mention someone and the board draws the connection — and their card grows with every mention. Your notes quietly become a map you can click straight through."
          reverse
        >
          <Shot
            src="/screenshot-note.png"
            alt="A person's note open in the workspace — connections and a note where [[Chip Sterling]] and [[Kevin Zhao]] render as rose backlink chips"
            width={1999}
            height={1185}
          />
        </FeatureRow>

        {/* ── Two views ─────────────────────────────────────── */}
        <FeatureRow
          title="Spatial, or a tidy list."
          blurb="Think in space on the board; find fast in a sortable, searchable list. Order by name or by closeness, dial the density — same plain files underneath, switched in a keystroke."
        >
          <Shot
            src="/screenshot-people.png"
            alt="The People view — a searchable, sortable list of everyone in the network with roles, tags, and warmth dots"
            width={1998}
            height={1179}
          />
        </FeatureRow>

        {/* ── Workspace ─────────────────────────────────────── */}
        <FeatureRow
          reverse
          title="Lay it out like you think."
          blurb="Tabs, resizable splits, and pop-out notes — a true Obsidian-style layout. Put the board beside your people and your goals beneath it, and it's right where you left it next time."
        >
          <Shot
            src="/screenshot-split.png"
            alt="A split workspace — a goals list with a floating note on the left, the board on the right"
            width={1999}
            height={1181}
          />
        </FeatureRow>

        {/* ── Plain text ─────────────────────────────────────── */}
        <FeatureRow
          title="The vault is the database."
          blurb="Every person, every handshake, every goal is just a markdown file with YAML frontmatter, in a folder you choose. No database, no proprietary format, no account, no telemetry."
        >
          <VaultWindow />
        </FeatureRow>

        {/* ── Download CTA — the heading sits at the center of a literal orbit ── */}
        <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden py-24 sm:min-h-[680px] lg:min-h-[820px]">
          <Orbit />
          <div className="relative z-10 mx-auto max-w-lg px-4 text-center">
            <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Bring your orbit into focus.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-muted-foreground">
              Free, open, and entirely on your machine. The best introductions are usually one or two
              handshakes away.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
      <div className="mx-auto flex h-14 w-full max-w-[2000px] items-center justify-between px-6 sm:px-12 lg:px-20">
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

function ValueProp({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
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

/**
 * A side-by-side feature: a BIG title + body that stays *sticky* while its screenshot scrolls past,
 * alternating sides via `reverse`. The text column pins under the nav and releases at the next
 * section — all native CSS `position: sticky`, so the motion is perfectly smooth. The image column
 * is the wider of the two so there's real scroll distance for the title to ride through.
 */
function FeatureRow({
  title,
  blurb,
  reverse,
  children,
}: {
  title: string;
  blurb: string;
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="py-20 lg:py-32">
      <div
        className={`grid items-start gap-12 lg:gap-24 ${
          reverse ? "lg:grid-cols-[7fr_5fr]" : "lg:grid-cols-[5fr_7fr]"
        }`}
      >
        <div className={`lg:sticky lg:top-28 lg:self-start ${reverse ? "lg:order-2" : ""}`}>
          <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">{blurb}</p>
        </div>
        <div className={reverse ? "lg:order-1" : ""}>{children}</div>
      </div>
    </section>
  );
}

/**
 * Three concentric rings, each carrying one rose ball that rides a continuously-rotating wrapper
 * around the shared center (where the CTA copy sits). Uneven speeds + one counter-rotation so the
 * balls never sync; staggered start angles via negative delay. No glow, no center — minimal: just
 * monochrome rings and the rose accent in motion. Scales down on mobile; respects reduced-motion.
 */
function Orbit() {
  const rings = [
    { d: 340, dur: 22, reverse: false, ball: 20, delay: 0 },
    { d: 530, dur: 35, reverse: true, ball: 26, delay: -12 },
    { d: 720, dur: 50, reverse: false, ball: 30, delay: -33 },
  ];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.5] sm:scale-75 lg:scale-100"
    >
      {rings.map((r) => (
        <div
          key={r.d}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-muted-foreground/20"
          style={{ width: r.d, height: r.d }}
        >
          <div
            data-orbit
            className="absolute inset-0"
            style={{
              animationName: "orbit-spin",
              animationDuration: `${r.dur}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              animationDirection: r.reverse ? "reverse" : "normal",
              animationDelay: `${r.delay}s`,
            }}
          >
            <span
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
              style={{ width: r.ball, height: r.ball }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-[2000px] flex-col items-center gap-4 px-6 py-12 text-center sm:px-12 lg:px-20">
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
