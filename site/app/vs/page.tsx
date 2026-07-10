import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Footer, Nav } from "@/components/chrome";
import { BreadcrumbJsonLd, JsonLdScript } from "@/components/schema";
import { VS } from "@/lib/vs";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { asset } from "@/lib/asset";

const DESC =
  "Honest comparisons of Handshake with Clay (Mesh), Dex, Monica, folk, Covve, Notion, and the humble spreadsheet — including where each of them wins.";

export const metadata: Metadata = {
  title: "Compare",
  description: DESC,
  alternates: { canonical: `${SITE_URL}/vs` },
  openGraph: {
    title: "Handshake, compared honestly",
    description: DESC,
    url: `${SITE_URL}/vs`,
    images: [OG_IMAGE],
  },
};

export default function VsHub() {
  return (
    <div className="relative">
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${SITE_URL}/vs#collection`,
          name: "Handshake, compared honestly",
          description: DESC,
          isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
          hasPart: VS.map((v) => ({
            "@type": "Article",
            "@id": `${SITE_URL}/vs/${v.slug}#article`,
            headline: v.metaTitle,
            url: `${SITE_URL}/vs/${v.slug}/`,
          })),
        }}
      />
      <BreadcrumbJsonLd trail={[{ name: "Compare", path: "/vs/" }]} />
      <Nav />

      <main className="mx-auto w-full max-w-[2000px] px-6 pb-28 pt-16 sm:px-12 sm:pt-24 lg:px-20">
        <h1 className="font-display text-4xl font-semibold sm:text-6xl">Compared, honestly.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Every comparison here says where the other tool wins, because sometimes it does. Start with{" "}
          <a href={asset("/personal-crm")} className="text-primary underline-offset-4 hover:underline">
            what a personal CRM actually is
          </a>{" "}
          if you&apos;re new to the category.
        </p>

        <ul className="mt-14 max-w-3xl space-y-4">
          {VS.map((v) => (
            <li key={v.slug}>
              <a
                href={asset(`/vs/${v.slug}`)}
                className="group flex items-center gap-5 rounded-xl border bg-card/30 p-5 transition-colors hover:bg-card/60"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-medium">Handshake vs {v.name}</span>
                  <span className="mt-0.5 block text-[15px] leading-relaxed text-muted-foreground">
                    {v.metaDesc.split("—")[0].trim()}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </a>
            </li>
          ))}
        </ul>
      </main>

      <Footer />
    </div>
  );
}
