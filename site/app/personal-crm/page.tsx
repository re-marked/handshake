import type { Metadata } from "next";
import { CTA, Footer, Ghost, Nav } from "@/components/chrome";
import { BreadcrumbJsonLd, JsonLdScript } from "@/components/schema";
import { VS_PUBLISHED, VS_UPDATED } from "@/lib/vs";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { asset } from "@/lib/asset";

const TITLE = "What is a personal CRM? An honest guide (2026)";
const DESC =
  "What a personal CRM actually is, who needs one, and an honest map of the 2026 landscape – Clay (Mesh), Dex, Monica, folk, Covve, Notion templates, spreadsheets, and local-first Handshake.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} – Handshake` },
  description: DESC,
  alternates: { canonical: `${SITE_URL}/personal-crm` },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: `${SITE_URL}/personal-crm`,
    images: [OG_IMAGE],
  },
};

const FAQS = [
  {
    q: "What is a personal CRM?",
    a: "A personal CRM is an app for remembering the people in your life – who they are, how you met, what you talked about, and who connects to whom. It applies the 'customer relationship' idea to friendships and professional relationships instead of sales pipelines.",
  },
  {
    q: "Do I actually need a personal CRM?",
    a: "If your circle fits comfortably in your head, no. The tool earns its keep past roughly a hundred people – when you start forgetting how you met someone, losing touch by accident, or failing to see that two people you know should meet each other.",
  },
  {
    q: "What is the best free personal CRM?",
    a: "Handshake is free and open source (MIT) with no contact limits, storing everything as plain markdown files on your machine. Monica is also open source if you're willing to self-host a web server. Most other tools offer limited free tiers with paid subscriptions on top.",
  },
  {
    q: "What is the most private personal CRM?",
    a: "The most private architecture is local-first: your relationship map never leaves your device. Handshake works this way – no account, no cloud, plain files. Self-hosted Monica is the other strong option, keeping data on a server you control.",
  },
];

const LANDSCAPE: { tool: string; href: string | null; bestFor: string; price: string; data: string }[] = [
  {
    tool: "Handshake",
    href: "/",
    bestFor: "Seeing your network as a map, privately",
    price: "Free, open source",
    data: "Markdown files on your device",
  },
  {
    tool: "Clay (Mesh)",
    href: "/vs/clay",
    bestFor: "A network that maintains itself",
    price: "Free tier; paid subscription",
    data: "Their cloud, from your accounts",
  },
  {
    tool: "Dex",
    href: "/vs/dex",
    bestFor: "Keep-in-touch reminders",
    price: "Free tier; $12–20/mo",
    data: "Their cloud",
  },
  {
    tool: "Monica",
    href: "/vs/monica",
    bestFor: "Open-source life details, self-hosted",
    price: "Free self-hosted; hosted $9/mo",
    data: "Your server (or theirs)",
  },
  {
    tool: "folk",
    href: "/vs/folk",
    bestFor: "Teams sharing a pipeline",
    price: "$20–40/user/mo",
    data: "Their cloud",
  },
  {
    tool: "Covve",
    href: "/vs/covve",
    bestFor: "Phone-first capture & reminders",
    price: "Free tier; Pro $12.99/mo",
    data: "Their cloud + your phone",
  },
  {
    tool: "Notion (DIY)",
    href: "/vs/notion",
    bestFor: "One workspace for everything",
    price: "Free-ish; Plus ~$10/mo",
    data: "Notion's cloud",
  },
  {
    tool: "A spreadsheet",
    href: "/vs/spreadsheet",
    bestFor: "Small networks, zero new tools",
    price: "Free",
    data: "Google's cloud or a local file",
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

export default function PersonalCrmPage() {
  return (
    <div className="relative">
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          "@id": `${SITE_URL}/personal-crm#article`,
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
          "@id": `${SITE_URL}/personal-crm#faq`,
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
          "@id": `${SITE_URL}/personal-crm#list`,
          name: "Personal CRM tools, July 2026",
          itemListElement: LANDSCAPE.map((t, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: t.tool,
          })),
        }}
      />
      <BreadcrumbJsonLd trail={[{ name: "What is a personal CRM?", path: "/personal-crm/" }]} />
      <Nav />

      <main className="mx-auto w-full max-w-[2000px] px-6 pb-24 pt-14 sm:px-12 sm:pt-20 lg:px-20">
        <h1 className="max-w-3xl font-display text-4xl font-semibold sm:text-6xl">
          What is a personal CRM?
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
          A personal CRM is an app for remembering the people in your life – who they are, how you
          met, what you talked about, and who connects to whom. It borrows the “customer relationship
          management” idea from sales and points it at something warmer: friendships, colleagues,
          mentors, the person you met once who you&apos;ll want to find again in three years.
        </p>

        <H2 id="why">Why people want one</H2>
        <P>
          Human memory is good at faces and terrible at bookkeeping. Past a certain point – Dunbar
          put it around 150 relationships – you start forgetting how you met people, losing touch
          entirely by accident, and missing the obvious introductions sitting in your own network.
          A personal CRM is external memory for exactly that: <B>not more contacts, better recall of
          the ones you have</B>.
        </P>
        <P>
          The category has a dirty secret, though: most personal CRMs get abandoned within weeks.
          The graveyard is real – UpHabit, once a popular personal CRM, pivoted to sales tooling in
          2022 and told its personal users to migrate elsewhere. Which is why the second question
          matters as much as the first: <B>if the app dies, what happens to your map?</B>
        </P>

        <H2 id="axes">The four questions that actually separate the tools</H2>
        <P>
          <B>1. Automatic or manual?</B> Tools like <A href="/vs/clay">Mesh (formerly Clay)</A> build
          your network from your email and calendar automatically – zero upkeep, but a cloud service
          reads your communications. Deliberate tools (Handshake, <A href="/vs/monica">Monica</A>, a{" "}
          <A href="/vs/spreadsheet">spreadsheet</A>) hold only what you put in them – which sounds
          like work until you notice it&apos;s why the map stays meaningful: auto-built networks
          mirror your inbox; deliberate ones mirror your life.
        </P>
        <P>
          <B>2. Cloud or local?</B> Your relationship map is arguably the most personal dataset you
          own. Most tools keep it in their cloud; local-first tools keep it on your machine, where no
          breach, acquisition, or pivot can touch it.
        </P>
        <P>
          <B>3. Phone or desktop?</B> <A href="/vs/covve">Covve</A> and <A href="/vs/dex">Dex</A>{" "}
          optimize for capture on the go; Handshake optimizes for sitting down with a big screen and
          actually thinking about your network. Different loops, different tools.
        </P>
        <P>
          <B>4. Subscription or free?</B> Most of the category runs $9–20/month forever. Two tools
          are genuinely free and open source: Monica (if you self-host a server) and Handshake (a
          local desktop app, no server at all).
        </P>

        <H2 id="landscape">The landscape, July 2026</H2>
        <div className="mt-6 max-w-4xl overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[640px] text-[15px]">
            <thead>
              <tr className="border-b bg-card/50 text-left">
                <th className="p-3.5 font-display font-semibold">Tool</th>
                <th className="p-3.5 font-medium text-muted-foreground">Best for</th>
                <th className="p-3.5 font-medium text-muted-foreground">Price</th>
                <th className="p-3.5 font-medium text-muted-foreground">Where your data lives</th>
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
                  <td className="p-3.5 align-top leading-relaxed text-muted-foreground">{t.bestFor}</td>
                  <td className="p-3.5 align-top leading-relaxed text-muted-foreground">{t.price}</td>
                  <td className="p-3.5 align-top leading-relaxed text-muted-foreground">{t.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-4xl text-sm text-muted-foreground/60">
          Every tool name links to a full, honest comparison – including where that tool beats
          Handshake. Details checked July 2026.
        </p>

        <H2 id="handshake">Where Handshake fits</H2>
        <P>
          Handshake is the local-first answer: a free, open-source desktop app (macOS, Windows,
          Linux) that stores your network as <B>plain markdown files on your own machine</B> and
          shows it as a spatial board – people as cards, ties weighted by warmth, introduction
          chains and note-mentions drawn as lines. It&apos;s “Obsidian for your network,” and a
          Handshake folder literally opens as an Obsidian vault.
        </P>
        <P>
          It is not the right tool for everyone, and the comparisons above say so plainly: there&apos;s{" "}
          <B>no mobile app</B> during the beta, <B>no auto-sync</B> from email or LinkedIn (by
          design), and no team features. If you want a self-maintaining network, choose{" "}
          <A href="/vs/clay">Mesh</A>; if you want scheduled reminders, choose{" "}
          <A href="/vs/dex">Dex</A>. If you want to <B>see and own</B> your network – the map, in
          files that outlive every company on this page – that&apos;s the exact thing Handshake was
          built for. (If the <B>seeing</B> part is what draws you, the sibling guide is{" "}
          <A href="/map-your-network">how to map your personal network</A>.)
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
          <h2 className="font-display text-2xl font-semibold">See your network, tonight</h2>
          <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">
            Free, open source, two minutes to your first map. And if it&apos;s not for you – it&apos;s
            plain markdown; take it anywhere.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <CTA href={asset("/download")}>Download Handshake</CTA>
            <Ghost href={asset("/guide/getting-started")}>Read the guide</Ghost>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
