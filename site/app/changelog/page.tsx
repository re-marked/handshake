import type { Metadata } from "next";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUpRight } from "lucide-react";
import { Footer, Nav } from "@/components/chrome";
import { BreadcrumbJsonLd, JsonLdScript } from "@/components/schema";
import { getReleases, releaseDate } from "@/lib/releases";
import { OG_IMAGE, REPO, SITE_URL } from "@/lib/seo";
import { asset } from "@/lib/asset";

const DESC =
  "Every Handshake release, newest first – what shipped, what got fixed, and where the public beta is heading. Rebuilt automatically on every release.";

export const metadata: Metadata = {
  title: "Changelog",
  description: DESC,
  alternates: {
    canonical: `${SITE_URL}/changelog`,
    types: { "application/rss+xml": `${SITE_URL}/feed.xml` },
  },
  openGraph: {
    title: "Handshake changelog",
    description: DESC,
    url: `${SITE_URL}/changelog`,
    images: [OG_IMAGE],
  },
};

// Release notes are markdown – style them to match the site's prose.
const NOTES =
  "mt-4 max-w-3xl text-[15px] leading-relaxed text-muted-foreground " +
  "[&_h2]:mt-5 [&_h2]:mb-1.5 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground " +
  "[&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:font-display [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-foreground " +
  "[&_p]:my-2 [&_ul]:my-2 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1 " +
  "[&_strong]:font-medium [&_strong]:text-foreground " +
  "[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline " +
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] " +
  "[&_blockquote]:my-2.5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic";

export default async function ChangelogPage() {
  const releases = await getReleases();
  return (
    <div className="relative">
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${SITE_URL}/changelog#collection`,
          name: "Handshake changelog",
          description: DESC,
          about: { "@type": "SoftwareApplication", name: "Handshake", "@id": `${SITE_URL}/#app` },
          isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
        }}
      />
      <BreadcrumbJsonLd trail={[{ name: "Changelog", path: "/changelog/" }]} />
      <Nav />

      <main className="mx-auto w-full max-w-[2000px] px-6 pb-24 pt-14 sm:px-12 sm:pt-20 lg:px-20">
        <h1 className="font-display text-4xl font-semibold sm:text-6xl">Changelog</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Every release, newest first. The beta moves fast – subscribe via{" "}
          <a href={asset("/feed.xml")} className="text-primary underline-offset-4 hover:underline">
            RSS
          </a>{" "}
          or watch{" "}
          <a href={`${REPO}/releases`} className="text-primary underline-offset-4 hover:underline">
            releases on GitHub
          </a>
          .
        </p>

        {releases.length === 0 ? (
          <p className="mt-14 max-w-2xl leading-relaxed text-muted-foreground">
            Couldn&apos;t load releases right now – see{" "}
            <a href={`${REPO}/releases`} className="text-primary underline-offset-4 hover:underline">
              the releases page on GitHub
            </a>
            .
          </p>
        ) : (
          <div className="mt-14 space-y-14">
            {releases.map((r, i) => (
              <article key={r.tag} id={r.tag} className="scroll-mt-20 border-l pl-6 sm:pl-8">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h2 className="font-display text-2xl font-semibold">
                    {r.tag}
                    {i === 0 && (
                      <span className="ml-3 align-middle rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
                        Latest
                      </span>
                    )}
                  </h2>
                  <time dateTime={r.publishedAt} className="text-sm text-muted-foreground/70">
                    {releaseDate(r.publishedAt)}
                  </time>
                </div>
                <div className={NOTES}>
                  <Markdown remarkPlugins={[remarkGfm]}>{r.body}</Markdown>
                </div>
                <a
                  href={r.htmlUrl}
                  className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Downloads &amp; details on GitHub <ArrowUpRight className="size-3.5" />
                </a>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
