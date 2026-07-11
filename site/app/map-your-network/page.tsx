import type { Metadata } from "next";
import { CTA, Footer, Ghost, Nav } from "@/components/chrome";
import { BreadcrumbJsonLd, JsonLdScript } from "@/components/schema";
import { VS_PUBLISHED, VS_UPDATED } from "@/lib/vs";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { asset } from "@/lib/asset";

const TITLE = "How to map your personal network — an honest guide (2026)";
const DESC =
  "Relationship mapping, without the flowchart. What it means to map your personal network, the four kinds of tools people reach for — knowledge graphs like TheBrain, analyst tools like Kumu, diagram editors, note graphs — and where a purpose-built, local-first people map fits.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} — Handshake` },
  description: DESC,
  alternates: { canonical: `${SITE_URL}/map-your-network` },
  openGraph: {
    title: "How to map your personal network",
    description: DESC,
    url: `${SITE_URL}/map-your-network`,
    images: [OG_IMAGE],
  },
};

const FAQS = [
  {
    q: "What does it mean to map your personal network?",
    a: "Mapping your personal network means laying out the people you know as a visual graph — each person a node, each relationship a connection — so you can see the shape of your world: who connects to whom, which ties are strong, and where the gaps are. It turns a mental address book into something you can actually look at and think with.",
  },
  {
    q: "What is the best tool to map relationships between people?",
    a: "It depends what you want. For a private, purpose-built map of the people you know, Handshake is a free local-first desktop app that models warmth, introductions, and notes as plain files. For general idea-and-people graphs there's TheBrain; for research-grade network analysis there's Kumu; for freehand diagrams, diagrams.net. Only Handshake is built specifically around personal relationships.",
  },
  {
    q: "Can I map my network without a flowchart or diagram tool?",
    a: "Yes — and you usually should. Diagram editors like diagrams.net make you draw and re-draw boxes by hand, and they hold no data about the people. A purpose-built tool like Handshake keeps the people as real records (with notes, roles, and tie strength) and draws the map for you, so it stays live instead of becoming a stale picture.",
  },
  {
    q: "Is there a free relationship mapping app?",
    a: "Handshake is free and open source, storing your network as plain markdown files on your machine. TheBrain has a free tier, Kumu is free for public projects, and diagrams.net is free — but among these, Handshake is the one designed specifically for mapping personal relationships privately.",
  },
];

const LANDSCAPE: {
  tool: string;
  href: string | null;
  approach: string;
  bestFor: string;
  price: string;
}[] = [
  {
    tool: "Handshake",
    href: "/",
    approach: "Purpose-built people map",
    bestFor: "A private map of the people you know",
    price: "Free, open source",
  },
  {
    tool: "TheBrain",
    href: "/vs/thebrain",
    approach: "General knowledge graph",
    bestFor: "Ideas, files & people in one graph",
    price: "Free tier; Pro $180/yr",
  },
  {
    tool: "Kumu",
    href: null,
    approach: "Analyst / systems mapping",
    bestFor: "Research-grade network analysis",
    price: "Free public; $9/mo private",
  },
  {
    tool: "Obsidian (graph view)",
    href: "/vs/notion",
    approach: "Graph of your notes",
    bestFor: "PKM users who'll DIY a people graph",
    price: "Free; paid add-ons",
  },
  {
    tool: "diagrams.net",
    href: null,
    approach: "Freehand diagram editor",
    bestFor: "One-off hand-drawn charts",
    price: "Free",
  },
  {
    tool: "Mind mappers (XMind…)",
    href: null,
    approach: "Idea trees",
    bestFor: "Branching brainstorms, not networks",
    price: "Freemium",
  },
];

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-14 scroll-mt-20 font-display text-2xl font-semibold">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">{children}</p>;
}

function B({ children }: { children: React.ReactNode }) {
  return <b className="font-medium text-foreground">{children}</b>;
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={asset(href)} className="text-primary underline-offset-4 hover:underline">
      {children}
    </a>
  );
}

export default function MapYourNetworkPage() {
  return (
    <div className="relative">
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          "@id": `${SITE_URL}/map-your-network#article`,
          headline: TITLE,
          description: DESC,
          image: OG_IMAGE.url,
          datePublished: VS_PUBLISHED,
          dateModified: VS_UPDATED,
          author: { "@type": "Organization", name: "re-marked", url: "https://github.com/re-marked" },
          isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
        }}
      />
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${SITE_URL}/map-your-network#faq`,
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "@id": `${SITE_URL}/map-your-network#list`,
          name: "Ways to map a personal network, July 2026",
          itemListElement: LANDSCAPE.map((t, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: t.tool,
          })),
        }}
      />
      <BreadcrumbJsonLd trail={[{ name: "Map your personal network", path: "/map-your-network/" }]} />
      <Nav />

      <main className="mx-auto w-full max-w-[2000px] px-6 pb-24 pt-14 sm:px-12 sm:pt-20 lg:px-20">
        <h1 className="max-w-3xl font-display text-4xl font-semibold sm:text-6xl">
          How to map your personal network
        </h1>
        <p className="mt-3 text-sm text-muted-foreground/70">
          Updated{" "}
          <time dateTime={VS_UPDATED}>
            {new Date(VS_UPDATED + "T00:00:00Z").toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}
          </time>
        </p>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Mapping your personal network means laying out the people you know as a visual graph — each
          person a node, each relationship a line — so you can finally <B>see</B> the shape of your
          world: who connects to whom, which ties are strong, who introduced you to whom, and where
          the quiet gaps are. This is a guide to doing that honestly, without ending up in a
          flowchart tool.
        </p>

        <H2 id="why">Why map it at all</H2>
        <P>
          You already hold a version of this map in your head, and it&apos;s lossy. You forget which
          two friends would hit it off, lose track of the person who could open a door, and can&apos;t
          see that a whole slice of your professional life hangs off one introduction. A network on a
          screen makes the invisible legible: <B>the structure of your relationships becomes
          something you can look at, not just something you vaguely feel</B>.
        </P>
        <P>
          The trap is reaching for the wrong kind of tool. Ask the internet how to map your network
          and you&apos;ll be pointed at flowchart editors and mind-mappers — tools that make you{" "}
          <B>draw</B> a picture that&apos;s stale the moment you close it. The better question is
          which kind of tool actually fits the job.
        </P>

        <H2 id="approaches">Four kinds of tools people reach for</H2>
        <P>
          <B>1. Freehand diagram editors</B> — <A href="/vs/thebrain">draw.io / diagrams.net</A> and
          friends. You place boxes and draw arrows by hand. Fine for a one-off picture on a slide;
          useless as a living map, because the tool holds no data about the people and every change
          is manual redrawing.
        </P>
        <P>
          <B>2. Mind-mappers</B> — XMind, MindNode, and the like. Built for branching ideas out from a
          center, not for the messy, many-to-many web of real relationships. A network isn&apos;t a
          tree.
        </P>
        <P>
          <B>3. General knowledge graphs</B> — <A href="/vs/thebrain">TheBrain</A>, Obsidian&apos;s
          graph view. Powerful and genuinely local, but every node is generic: a person, a file, and
          an idea are the same kind of object, joined by unlabeled links. You can build a people map
          in them, but you have to design it yourself, and it can&apos;t express warmth, introductions,
          or a face.
        </P>
        <P>
          <B>4. Analyst tools</B> — Kumu and other social-network-analysis platforms. Superb for
          research-grade work (centrality metrics, community detection) on public, cloud-hosted maps —
          overkill, and the wrong privacy model, for quietly mapping your own life.
        </P>

        <H2 id="landscape">The landscape, July 2026</H2>
        <div className="mt-6 max-w-4xl overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[680px] text-[15px]">
            <thead>
              <tr className="border-b bg-card/50 text-left">
                <th className="p-3.5 font-display font-semibold">Tool</th>
                <th className="p-3.5 font-medium text-muted-foreground">Approach</th>
                <th className="p-3.5 font-medium text-muted-foreground">Best for</th>
                <th className="p-3.5 font-medium text-muted-foreground">Price</th>
              </tr>
            </thead>
            <tbody>
              {LANDSCAPE.map((t) => (
                <tr key={t.tool} className={`border-b last:border-0 ${t.tool === "Handshake" ? "bg-primary/[0.04]" : ""}`}>
                  <td className="p-3.5 align-top font-medium">
                    {t.href ? (
                      <a href={asset(t.href)} className="text-primary underline-offset-4 hover:underline">
                        {t.tool}
                      </a>
                    ) : (
                      t.tool
                    )}
                  </td>
                  <td className="p-3.5 align-top leading-relaxed text-muted-foreground">{t.approach}</td>
                  <td className="p-3.5 align-top leading-relaxed text-muted-foreground">{t.bestFor}</td>
                  <td className="p-3.5 align-top leading-relaxed text-muted-foreground">{t.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-4xl text-sm text-muted-foreground/60">
          Details checked July 2026. TheBrain and Obsidian link to full comparisons.
        </p>

        <H2 id="handshake">Where Handshake fits</H2>
        <P>
          Handshake is the tool for the specific case the others generalize past: <B>a private map of
          the people you know</B>. It&apos;s a free, open-source desktop app (macOS, Windows, Linux)
          that puts you at the center of a spatial board and fans your network out around you — each
          person a card with a face, each relationship a line whose weight is the <B>warmth</B> of the
          tie. It draws introduction chains, links people as you mention them in notes, and lets you
          pin goals near the people who can help. And because it&apos;s all <B>plain markdown files on
          your machine</B>, the map is yours the way a folder of documents is yours.
        </P>
        <P>
          It is not a general second brain — if you want ideas, files, and people tangled in one
          graph, <A href="/vs/thebrain">TheBrain</A> is the honest pick. It&apos;s not a research
          platform, and it has no mobile app yet. What it is: the one tool on this page that treats
          your network <B>as a network of people</B>, and hands you the map in two minutes instead of
          a blank canvas. If you&apos;re also thinking about remembering and keeping up with those
          people, the sibling to this guide is{" "}
          <A href="/personal-crm">what a personal CRM actually is</A>.
        </P>

        <H2 id="faq">Questions</H2>
        <dl className="mt-6 max-w-3xl space-y-7">
          {FAQS.map((f) => (
            <div key={f.q}>
              <dt className="font-display text-lg font-medium text-foreground">{f.q}</dt>
              <dd className="mt-2 leading-relaxed text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 max-w-4xl rounded-2xl border bg-card/40 p-8">
          <h2 className="font-display text-2xl font-semibold">See your network as a map</h2>
          <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">
            Free, open source, and entirely on your machine. Put yourself at the center and watch the
            shape of your world appear.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <CTA href={asset("/download")}>Download Handshake</CTA>
            <Ghost href={asset("/guide/board")}>How the board works</Ghost>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
