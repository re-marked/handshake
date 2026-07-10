import Image from "next/image";
import { ArrowRight, FileText, Lock, SlidersHorizontal } from "lucide-react";
import { VaultWindow } from "@/components/VaultWindow";
import { Faq } from "@/components/Faq";
import { CTA, Footer, Ghost, Github, Nav } from "@/components/chrome";
import { asset } from "@/lib/asset";
import { APP_VERSION, DESCRIPTION, DOWNLOAD, FAQS, FEATURES, REPO, SITE_NAME, SITE_URL } from "@/lib/seo";

export default function Home() {
  return (
    <div className="relative">
      <JsonLd />
      <Nav />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[2000px] px-6 pt-20 text-center sm:px-12 sm:pt-32 lg:px-20">
        <h1 className="mx-auto font-display text-5xl font-semibold leading-[1.02] sm:text-7xl lg:text-8xl">
          Know who you know.
        </h1>
        <p className="mx-auto mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          A desktop app for mapping the people you know — who they are, how you met, and how everyone&apos;s
          connected. Local-first, and yours in plain text.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <CTA href={asset("/download")}>Download for desktop</CTA>
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
            src={asset("/screenshot-hero.webp")}
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
              Open markdown underneath. Your network outlives the app, the company, and the hype — it&apos;s{" "}
              <a href={asset("/guide/networks-and-files")} className="text-primary underline-offset-4 hover:underline">
                just a folder of text
              </a>
              .
            </ValueProp>
          </div>
        </section>

        {/* ── Links / backlinks ─────────────────────────────── */}
        <FeatureRow
          title="Write a name. Draw a line."
          more={{ href: "/guide/notes-and-backlinks", label: "How notes & backlinks work" }}
          blurb="Type [[ in any note and it completes from your people. Mention someone and the board draws the connection — and their card grows with every mention. Your notes quietly become a map you can click straight through."
          reverse
        >
          <Shot
            src="/screenshot-note.webp"
            alt="A person's note open in the workspace — connections and a note where [[Chip Sterling]] and [[Kevin Zhao]] render as rose backlink chips"
            width={1999}
            height={1185}
          />
        </FeatureRow>

        {/* ── Two views ─────────────────────────────────────── */}
        <FeatureRow
          title="Spatial, or a tidy list."
          more={{ href: "/guide/board", label: "Read the board guide" }}
          blurb="Think in space on the board; find fast in a sortable, searchable list. Order by name or by closeness, dial the density — same plain files underneath, switched in a keystroke."
        >
          <Shot
            src="/screenshot-people.webp"
            alt="The People view — a searchable, sortable list of everyone in the network with roles, tags, and warmth dots"
            width={1998}
            height={1179}
          />
        </FeatureRow>

        {/* ── Workspace ─────────────────────────────────────── */}
        <FeatureRow
          reverse
          title="Lay it out like you think."
          more={{ href: "/guide/workspace", label: "How the workspace works" }}
          blurb="Tabs, resizable splits, and pop-out notes — a true Obsidian-style layout. Put the board beside your people and your goals beneath it, and it's right where you left it next time."
        >
          <Shot
            src="/screenshot-split.webp"
            alt="A split workspace — a goals list with a floating note on the left, the board on the right"
            width={1999}
            height={1181}
          />
        </FeatureRow>

        {/* ── Plain text ─────────────────────────────────────── */}
        <FeatureRow
          title="The vault is the database."
          more={{ href: "/guide/networks-and-files", label: "Networks & plain files, explained" }}
          blurb="Every person, every handshake, every goal is just a markdown file with YAML frontmatter, in a folder you choose. No database, no proprietary format, no account, no telemetry."
        >
          <VaultWindow />
        </FeatureRow>

        {/* ── FAQ — prompt-aligned Q&A (mirrored 1:1 in the FAQPage JSON-LD), with a scroll-spy that
              lights only the centered row's icon. Client component for the scroll state. ── */}
        <Faq />

        {/* ── Download CTA — the heading sits at the center of a literal orbit ── */}
        <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden py-24 sm:min-h-[680px] lg:min-h-[820px]">
          <Orbit />
          <div className="relative z-10 mx-auto max-w-lg px-4 text-center">
            <h2 className="font-display text-4xl font-semibold sm:text-5xl">
              Bring your orbit into focus.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-muted-foreground">
              Free, open, and entirely on your machine. The best introductions are usually one or two
              handshakes away.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <CTA href={asset("/download")}>Download Handshake</CTA>
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

/**
 * Triple JSON-LD stack — SoftwareApplication + Organization + WebSite + FAQPage — combined in one
 * @graph. This is what AI answer engines (ChatGPT, Perplexity, Google AI Overviews) parse to ground
 * and cite the page; the FAQ entries mirror the visible Q&A section exactly (shared source of truth).
 */
function JsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: SITE_NAME,
        applicationCategory: "ProductivityApplication",
        operatingSystem: "macOS, Windows, Linux",
        description: DESCRIPTION,
        url: SITE_URL,
        downloadUrl: DOWNLOAD,
        softwareVersion: APP_VERSION,
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        screenshot: `${SITE_URL}/screenshot-hero.png`,
        featureList: FEATURES,
        creator: { "@type": "Organization", name: "re-marked", url: "https://github.com/re-marked" },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/handshake-logo.png`,
        sameAs: [REPO],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#org` },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
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
      <h3 className="font-display text-xl font-semibold">{title}</h3>
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
  more,
  reverse,
  children,
}: {
  title: string;
  blurb: string;
  /** Optional in-content link to the relevant guide page (site-relative). */
  more?: { href: string; label: string };
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
          <h2 className="font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
            {title}
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">{blurb}</p>
          {more && (
            <a
              href={asset(more.href)}
              className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-medium text-primary underline-offset-4 hover:underline"
            >
              {more.label} <ArrowRight className="size-4" />
            </a>
          )}
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
    { d: 340, dur: 22, reverse: false, ball: 32, delay: 0 },
    { d: 530, dur: 35, reverse: true, ball: 40, delay: -12 },
    { d: 720, dur: 50, reverse: false, ball: 48, delay: -33 },
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

