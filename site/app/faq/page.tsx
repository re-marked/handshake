import type { Metadata } from "next";
import { Footer, Nav } from "@/components/chrome";
import { BreadcrumbJsonLd } from "@/components/schema";
import { FAQ_GROUPS, OG_IMAGE, SITE_URL } from "@/lib/seo";
import { asset } from "@/lib/asset";

// Contextual "keep reading" target per FAQ topic — internal links search engines actually weight.
const RELATED: Record<string, { href: string; label: string }> = {
  "Getting started": { href: "/guide/getting-started", label: "the getting-started guide" },
  "Privacy & your data": { href: "/guide/networks-and-files", label: "how networks & plain files work" },
  "Platforms & installing": { href: "/download", label: "the download page" },
  "Files & format": { href: "/guide/networks-and-files", label: "the plain-files guide" },
  "Compared to other tools": { href: "/guide", label: "the full guide" },
  "Beta": { href: "/download", label: "the latest release" },
};

const TITLE = "FAQ";
const DESC =
  "Everything about Handshake — the free, local-first app for mapping the people you know. Getting started, privacy, platforms, file format, how it compares to a CRM or Obsidian, and the beta.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    title: "Handshake FAQ",
    description: DESC,
    url: `${SITE_URL}/faq`,
    images: [OG_IMAGE],
  },
};

/** The full FAQPage JSON-LD — every question on this page, flattened from the grouped source. */
function FaqJsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/faq#faq`,
    mainEntity: FAQ_GROUPS.flatMap((g) =>
      g.items.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    ),
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
  );
}

export default function FaqPage() {
  return (
    <div className="relative">
      <FaqJsonLd />
      <BreadcrumbJsonLd trail={[{ name: "FAQ", path: "/faq/" }]} />
      <Nav />

      <main className="mx-auto w-full max-w-3xl px-6 pb-28 pt-16 sm:pt-24">
        <div className="text-center">
          <h1 className="font-display text-4xl font-semibold sm:text-6xl">Questions &amp; answers</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Everything about Handshake — how it works, where your data lives, and how it compares.
          </p>
        </div>

        <div className="mt-16 space-y-16">
          {FAQ_GROUPS.map((group) => (
            <section key={group.topic}>
              <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
                {group.topic}
              </h2>
              <dl className="mt-6 space-y-9">
                {group.items.map((f) => (
                  <div key={f.q}>
                    <dt className="font-display text-lg font-medium text-foreground">{f.q}</dt>
                    <dd className="mt-2 leading-relaxed text-muted-foreground">{f.a}</dd>
                  </div>
                ))}
              </dl>
              {RELATED[group.topic] && (
                <p className="mt-6 text-sm text-muted-foreground">
                  Keep reading:{" "}
                  <a
                    href={asset(RELATED[group.topic].href)}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {RELATED[group.topic].label}
                  </a>
                </p>
              )}
            </section>
          ))}
        </div>

        <p className="mt-16 border-t pt-8 text-center text-muted-foreground">
          Something else on your mind?{" "}
          <a
            href="https://github.com/re-marked/handshake/issues"
            className="text-primary underline-offset-4 hover:underline"
          >
            Ask on GitHub
          </a>
          .
        </p>
      </main>

      <Footer />
    </div>
  );
}
