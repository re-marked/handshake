import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import { Footer, Nav } from "@/components/chrome";
import { BreadcrumbJsonLd, JsonLdScript } from "@/components/schema";
import { GUIDE, GUIDE_PUBLISHED, GUIDE_UPDATED } from "@/lib/guide";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { asset } from "@/lib/asset";

/** Standard metadata for a guide section page. */
export function guideMetadata(slug: string): Metadata {
  const s = GUIDE.find((g) => g.slug === slug)!;
  return {
    title: `${s.title} – Guide`,
    description: s.blurb,
    alternates: { canonical: `${SITE_URL}/guide/${slug}` },
    openGraph: {
      title: `${s.title} – Guide`,
      description: s.blurb,
      url: `${SITE_URL}/guide/${slug}`,
      images: [OG_IMAGE],
    },
  };
}

/** The classic docs sidebar: a "Guide" label, Overview, then every section; the active page rose. */
function GuideSidebar({ active }: { active: string | null }) {
  const item = (href: string, label: string, on: boolean) => (
    <a
      href={asset(href)}
      aria-current={on ? "page" : undefined}
      className={`-ml-px block border-l py-1.5 pl-4 text-sm transition-colors ${
        on
          ? "border-primary font-medium text-primary"
          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
      }`}
    >
      {label}
    </a>
  );
  return (
    <nav aria-label="Guide">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Guide</p>
      <div className="mt-4 border-l border-border/60">
        {item("/guide", "Overview", active === null)}
        {GUIDE.map((s) => item(`/guide/${s.slug}`, s.title, active === s.slug))}
      </div>
    </nav>
  );
}

/** The docs frame shared by the hub and every section: chrome + sticky sidebar + content column. */
export function GuideShell({ active, children }: { active: string | null; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Nav />
      <div className="mx-auto flex w-full max-w-[2000px] gap-12 px-6 sm:px-12 lg:px-20">
        {/* sidebar – sticky under the nav on desktop */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24 pt-14">
            <GuideSidebar active={active} />
          </div>
        </aside>
        <main className="min-w-0 flex-1 pb-24 pt-10 sm:pt-14">
          {/* mobile section picker */}
          <details className="mb-8 rounded-xl border bg-card/30 lg:hidden">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-muted-foreground">
              Guide navigation
            </summary>
            <div className="px-4 pb-4">
              <GuideSidebar active={active} />
            </div>
          </details>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}

/**
 * A guide section page: the docs frame + article header, TechArticle + BreadcrumbList JSON-LD,
 * and prev/next links derived from the GUIDE order.
 */
export function GuidePage({ slug, lead, children }: { slug: string; lead: string; children: React.ReactNode }) {
  const idx = GUIDE.findIndex((g) => g.slug === slug);
  const section = GUIDE[idx];
  const prev = GUIDE[idx - 1];
  const next = GUIDE[idx + 1];
  return (
    <>
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "@id": `${SITE_URL}/guide/${slug}#article`,
          headline: `${section.title} – Handshake guide`,
          description: section.blurb,
          image: OG_IMAGE.url,
          datePublished: GUIDE_PUBLISHED,
          dateModified: GUIDE_UPDATED,
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
      <GuideShell active={slug}>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">{section.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground/70">
          Updated{" "}
          <time dateTime={GUIDE_UPDATED}>
            {new Date(GUIDE_UPDATED + "T00:00:00Z").toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}
          </time>
        </p>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{lead}</p>

        <div className="mt-12 space-y-6">{children}</div>

        {/* prev / next */}
        <nav className="mt-16 flex max-w-3xl items-stretch justify-between gap-4 border-t pt-8">
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
      </GuideShell>
    </>
  );
}

/* ── prose primitives ────────────────────────────────────── */

export function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="max-w-3xl scroll-mt-20 pt-6 font-display text-2xl font-semibold">
      {children}
    </h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="max-w-3xl leading-relaxed text-muted-foreground">{children}</p>;
}

/** Emphasis within prose that should read in the foreground color. */
export function B({ children }: { children: React.ReactNode }) {
  return <b className="font-medium text-foreground">{children}</b>;
}

/** An internal, site-relative link inside guide prose (basePath handled). */
export function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={asset(href)} className="text-primary underline-offset-4 hover:underline">
      {children}
    </a>
  );
}

export function Tip({ children }: { children: React.ReactNode }) {
  return (
    <aside className="flex max-w-3xl gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-[15px] leading-relaxed text-muted-foreground">
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
    <ol className="max-w-3xl space-y-3">
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
    <figure className="my-2 max-w-5xl">
      <div className="overflow-hidden rounded-xl border shadow-lg">
        <Image src={asset(src)} alt={alt} width={width} height={height} className="w-full" />
      </div>
      <figcaption className="mt-2 text-center text-sm text-muted-foreground/70">{alt}</figcaption>
    </figure>
  );
}

/** The warmth legend – the four tie strengths as they read on the board. */
export function WarmthLegend() {
  const ties = [
    { name: "Close", cls: "bg-primary" },
    { name: "Warm", cls: "bg-primary/60" },
    { name: "Cold", cls: "bg-muted-foreground/50" },
    { name: "Dormant", cls: "bg-muted-foreground/25" },
  ];
  return (
    <div className="flex max-w-3xl flex-wrap gap-x-6 gap-y-2 rounded-xl border bg-card/30 p-4">
      {ties.map((t) => (
        <span key={t.name} className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={`h-0.5 w-8 rounded-full ${t.cls}`} />
          {t.name}
        </span>
      ))}
    </div>
  );
}
