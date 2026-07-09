import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Footer, Nav } from "@/components/chrome";
import { BreadcrumbJsonLd, JsonLdScript } from "@/components/schema";
import { GUIDE } from "@/lib/guide";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { asset } from "@/lib/asset";

const DESC =
  "The Handshake guide — how to map the people you know with a local-first desktop app. Getting started, the board, notes and backlinks, the workspace, Time Machine, plain files, and customization.";

export const metadata: Metadata = {
  title: "Guide",
  description: DESC,
  alternates: { canonical: `${SITE_URL}/guide` },
  openGraph: {
    title: "The Handshake guide",
    description: DESC,
    url: `${SITE_URL}/guide`,
    images: [OG_IMAGE],
  },
};

export default function GuideHub() {
  return (
    <div className="relative">
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${SITE_URL}/guide#collection`,
          name: "The Handshake guide",
          description: DESC,
          isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
          hasPart: GUIDE.map((s) => ({
            "@type": "TechArticle",
            "@id": `${SITE_URL}/guide/${s.slug}#article`,
            headline: `${s.title} — Handshake guide`,
            url: `${SITE_URL}/guide/${s.slug}/`,
          })),
        }}
      />
      <BreadcrumbJsonLd trail={[{ name: "Guide", path: "/guide/" }]} />
      <Nav />

      <main className="mx-auto w-full max-w-[2000px] px-6 pb-28 pt-16 sm:px-12 sm:pt-24 lg:px-20">
        <h1 className="font-display text-4xl font-semibold sm:text-6xl">The guide</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Everything Handshake does, in reading order — from first install to a workspace
          that's genuinely yours. Fifteen minutes, cover to cover.
        </p>

        <ol className="mt-14 max-w-3xl space-y-4">
          {GUIDE.map((s, i) => (
            <li key={s.slug}>
              <a
                href={asset(`/guide/${s.slug}`)}
                className="group flex items-center gap-5 rounded-xl border bg-card/30 p-5 transition-colors hover:bg-card/60"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-medium">{s.title}</span>
                  <span className="mt-0.5 block text-[15px] leading-relaxed text-muted-foreground">
                    {s.blurb}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </a>
            </li>
          ))}
        </ol>
      </main>

      <Footer />
    </div>
  );
}
