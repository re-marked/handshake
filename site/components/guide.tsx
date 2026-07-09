import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import { Footer, Nav } from "@/components/chrome";
import { BreadcrumbJsonLd, JsonLdScript } from "@/components/schema";
import { GUIDE } from "@/lib/guide";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { asset } from "@/lib/asset";

/** Standard metadata for a guide section page. */
export function guideMetadata(slug: string): Metadata {
  const s = GUIDE.find((g) => g.slug === slug)!;
  return {
    title: `${s.title} — Guide`,
    description: s.blurb,
    alternates: { canonical: `${SITE_URL}/guide/${slug}` },
    openGraph: {
      title: `${s.title} — Guide`,
      description: s.blurb,
      url: `${SITE_URL}/guide/${slug}`,
      images: [OG_IMAGE],
    },
  };
}

/**
 * Shared shell for a guide section: chrome, header, TechArticle + BreadcrumbList JSON-LD,
 * and prev/next section links derived from the GUIDE order.
 */
export function GuidePage({ slug, lead, children }: { slug: string; lead: string; children: React.ReactNode }) {
  const idx = GUIDE.findIndex((g) => g.slug === slug);
  const section = GUIDE[idx];
  const prev = GUIDE[idx - 1];
  const next = GUIDE[idx + 1];
  return (
    <div className="relative">
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "@id": `${SITE_URL}/guide/${slug}#article`,
          headline: `${section.title} — Handshake guide`,
          description: section.blurb,
          image: OG_IMAGE.url,
          author: { "@type": "Organization", name: "re-marked", url: "https://github.com/re-marked" },
          about: { "@type": "SoftwareApplication", name: "Handshake", "@id": `${SITE_URL}/#app` },
          isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
        }}
      />
      <BreadcrumbJsonLd
        trail={[
          { name: "Guide", path: "/guide/" },
          { name: section.title, path: `/guide/${slug}/` },
        ]}
      />
      <Nav />

      <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-14 sm:pt-20">
        <p className="text-sm font-medium text-primary">
          <a href={asset("/guide")} className="hover:underline">
            Guide
          </a>
          <span className="mx-2 text-muted-foreground/50">/</span>
          <span className="text-muted-foreground">{section.title}</span>
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">{section.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{lead}</p>

        <div className="mt-12 space-y-6">{children}</div>

        {/* prev / next */}
        <nav className="mt-16 flex items-stretch justify-between gap-4 border-t pt-8">
          {prev ? (
            <a
              href={asset(`/guide/${prev.slug}`)}
              className="group flex-1 rounded-xl border bg-card/30 p-4 transition-colors hover:bg-card/60"
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowLeft className="size-3.5" /> Previous
              </span>
              <span className="mt-1 block font-display font-medium">{prev.title}</span>
            </a>
          ) : (
            <span className="flex-1" />
          )}
          {next ? (
            <a
              href={asset(`/guide/${next.slug}`)}
              className="group flex-1 rounded-xl border bg-card/30 p-4 text-right transition-colors hover:bg-card/60"
            >
              <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                Next <ArrowRight className="size-3.5" />
              </span>
              <span className="mt-1 block font-display font-medium">{next.title}</span>
            </a>
          ) : (
            <span className="flex-1" />
          )}
        </nav>
      </main>

      <Footer />
    </div>
  );
}

/* ── prose primitives ────────────────────────────────────── */

export function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-20 pt-6 font-display text-2xl font-semibold">
      {children}
    </h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="leading-relaxed text-muted-foreground">{children}</p>;
}

/** Emphasis within prose that should read in the foreground color. */
export function B({ children }: { children: React.ReactNode }) {
  return <b className="font-medium text-foreground">{children}</b>;
}

export function Tip({ children }: { children: React.ReactNode }) {
  return (
    <aside className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-[15px] leading-relaxed text-muted-foreground">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
      <div>{children}</div>
    </aside>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[13px] text-foreground/90">
      {children}
    </kbd>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground/90">{children}</code>
  );
}

export function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {i + 1}
          </span>
          <span className="leading-relaxed text-muted-foreground">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function Shot({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  return (
    <figure className="my-2">
      <div className="overflow-hidden rounded-xl border shadow-lg">
        <Image src={asset(src)} alt={alt} width={width} height={height} className="w-full" />
      </div>
      <figcaption className="mt-2 text-center text-sm text-muted-foreground/70">{alt}</figcaption>
    </figure>
  );
}

/** The warmth legend — the four tie strengths as they read on the board. */
export function WarmthLegend() {
  const ties = [
    { name: "Close", cls: "bg-primary" },
    { name: "Warm", cls: "bg-primary/60" },
    { name: "Cold", cls: "bg-muted-foreground/50" },
    { name: "Dormant", cls: "bg-muted-foreground/25" },
  ];
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border bg-card/30 p-4">
      {ties.map((t) => (
        <span key={t.name} className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={`h-0.5 w-8 rounded-full ${t.cls}`} />
          {t.name}
        </span>
      ))}
    </div>
  );
}
