import Image from "next/image";
import {
  ArrowRight,
  Clock,
  Keyboard,
  Layers,
  Palette,
  Share2,
  Sparkles,
  SquareStack,
  StickyNote,
} from "lucide-react";
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
        <section className="pt-16 text-center sm:pt-24">
          <a
            href={`${REPO}/releases/latest`}
            className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
          >
            <span className="size-1.5 rounded-full bg-primary" />
            Local-first · 100% on your machine · 0% in the cloud
          </a>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            Obsidian for <span className="text-primary">your network</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Turn the people in your orbit into a graph you can actually think with — plain markdown
            underneath, a calm rose-on-monochrome canvas on top.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CTA href={DOWNLOAD}>Download for desktop</CTA>
            <Ghost href={REPO}>
              <Github className="size-4" /> View on GitHub
            </Ghost>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Free &amp; open · macOS, Windows &amp; Linux</p>

          {/* a real screenshot: the board with a person's note slid in */}
          <div className="mt-14">
            <Shot
              src="/screenshot-hero.png"
              alt="The Handshake board — a founder's network connected by warmth-weighted ties, with a person's note slid in on the right"
              width={1999}
              height={1184}
              priority
            />
          </div>
        </section>

        {/* ── Plain text ─────────────────────────────────────── */}
        <Section
          eyebrow="Yours, in plain text"
          title="The vault is the database."
          blurb="Every person, every handshake, every goal is just a markdown file with YAML frontmatter, in a folder you choose. No database, no proprietary format, no account, no telemetry."
        >
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <pre className="overflow-x-auto rounded-xl border bg-card/60 p-5 font-mono text-[13px] leading-relaxed text-muted-foreground">
              {`your-network/
├─ people/         self.md · sarah-chen.md …
├─ handshakes/     sarah-chen__tom-okonkwo.md
├─ goals/          meet-naval.md
├─ interactions/   2026-05-26-dm-sarah.md
├─ attachments/    the photos
└─ .handshake/     layout & settings`}
            </pre>
            <ul className="space-y-4">
              <Point>
                <b className="text-foreground">Open it in Obsidian</b>, edit it in any text editor, grep it
                from the terminal. The app and your files speak the same language.
              </Point>
              <Point>
                <b className="text-foreground">`git init` it</b> for full history; drop it in iCloud, Dropbox,
                or OneDrive and it syncs for free.
              </Point>
              <Point>
                <b className="text-foreground">If Handshake vanished tomorrow</b>, you&apos;d still have a tidy
                folder of plain text. Your data outlives the app.
              </Point>
            </ul>
          </div>
        </Section>

        {/* ── Backlinks (the new hero feature) ──────────────── */}
        <Section
          eyebrow="Notes that wire the graph together"
          title="Write a name. Draw a line."
          blurb="Type [[ in anyone's note and it autocompletes from your people. Mention them and it becomes a real connection — a dotted line on the board, and a vote that grows their card. The more your orbit talks about someone, the bigger they get."
        >
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="flex justify-center">
              <FauxNote />
            </div>
            <ul className="space-y-4">
              <Point>
                <b className="text-foreground">Click a backlink</b> to jump straight to that person — your
                notes become a map you can navigate.
              </Point>
              <Point>
                <b className="text-foreground">Filter the board</b> by tag or warmth, fade the connections
                you haven&apos;t touched in a while, and let the active ones stand out.
              </Point>
              <Point>
                <b className="text-foreground">It&apos;s all derived.</b> Backlinks live in your prose, never in
                a hidden schema — your `.md` files stay byte-for-byte yours.
              </Point>
            </ul>
          </div>
        </Section>

        {/* ── Views ─────────────────────────────────────────── */}
        <Section
          eyebrow="See it your way"
          title="The same network, two ways."
          blurb="A spatial board for thinking; a dense, searchable list for finding. Sort by name or by closeness, dial the density — same plain files underneath, your pick any moment."
        >
          <Shot
            src="/screenshot-people.png"
            alt="The People view — a searchable, sortable list of everyone in the network with roles, tags, and warmth dots"
            width={1999}
            height={1180}
          />
        </Section>

        {/* ── Multitasking ──────────────────────────────────── */}
        <Section
          eyebrow="A real workspace"
          title="Lay it out like you think."
          blurb="Tabs, resizable splits, and pop-out notes — a true Obsidian-style workspace. Put the board beside your people and your goals beneath it, and it's right where you left it next time."
        >
          <Shot
            src="/screenshot-split.png"
            alt="A split workspace — the board and a goals list stacked on the left, the People list on the right"
            width={1999}
            height={1184}
          />
        </Section>

        {/* ── Customisability ───────────────────────────────── */}
        <Section
          eyebrow="Yours to tune"
          title="Tuned to your taste."
          blurb="Themes, fonts, scale, density, card spacing, the staleness fade, snapshot cadence — dozens of dials, each with a sensible default. Make it feel like yours."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Shot src="/settings-appearance.png" alt="Appearance settings — theme, scale, font, weight, density" width={1585} height={1266} />
            <Shot src="/settings-board.png" alt="Board settings — goal cards, introduced-by + backlink lines, card sizing, spacing, zoom" width={1582} height={1266} />
            <Shot src="/settings-timemachine.png" alt="Time Machine settings — git versioning, snapshot cadence, history + restore" width={1582} height={1271} />
            <Shot src="/settings-developer.png" alt="Developer settings — the debug report and diagnostics" width={1591} height={1270} />
          </div>
        </Section>

        {/* ── Feature grid ──────────────────────────────────── */}
        <section className="py-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Feature icon={Share2} title="The board is the hero">
              A pannable, zoomable card-tree of your whole network, rooted on you. Ties weighted by warmth
              — close, warm, cold, dormant. Drag a card and its whole branch follows.
            </Feature>
            <Feature icon={StickyNote} title="Notes with soul">
              Click anyone and their note slides in: structured fields up top, a free-form markdown
              scratchpad below, rendered live with tables, highlights, and links.
            </Feature>
            <Feature icon={SquareStack} title="A real workspace">
              Tabs, resizable splits, and pop-out floating notes in a true Obsidian-style layout — right
              where you left them next time.
            </Feature>
            <Feature icon={Clock} title="Time Machine">
              Every network is quietly git-versioned. Undo a regret, snapshot a moment, roll back to any
              point. Your history is never one bad click away.
            </Feature>
            <Feature icon={Layers} title="Separate worlds">
              Work and personal each get their own vault, layout, and settings — switch between them in a
              keystroke.
            </Feature>
            <Feature icon={Palette} title="Yours to tune">
              Dark, light, and a hand-tuned Paper Vintage theme. Dial in density, motion, fonts, card
              size, and more to taste.
            </Feature>
          </div>
        </section>

        {/* ── Manifesto ─────────────────────────────────────── */}
        <section className="border-t py-20 text-center">
          <Keyboard className="mx-auto size-7 text-primary" />
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            A tool to live in, not a toy to admire.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Calm, exact, trustworthy, and fast. A command palette is its spine; the mouse is for the
            graph. It runs on plain files you own — and <b className="text-foreground">AI comes last and
            never load-bearing</b>. Every part stands on its own, with or without it.
          </p>
        </section>

        {/* ── Download CTA ──────────────────────────────────── */}
        <section className="pb-24">
          <div className="relative overflow-hidden rounded-2xl border bg-card/50 px-6 py-16 text-center">
            <Sparkles className="mx-auto size-7 text-primary" />
            <h2 className="mx-auto mt-5 max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
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
    <section className="border-t py-20">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <div className="text-sm font-medium text-primary">{eyebrow}</div>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{blurb}</p>
      </div>
      {children}
    </section>
  );
}

function Feature({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card/40 p-6 transition-colors hover:bg-card/70">
      <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function Point({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
      <ArrowRight className="mt-1 size-4 shrink-0 text-primary" />
      <span>{children}</span>
    </li>
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
        <p className="mt-2 text-xs text-muted-foreground/60">
          A local-first desktop app · built in the open
        </p>
      </div>
    </footer>
  );
}
