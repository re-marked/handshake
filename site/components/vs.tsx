import { ArrowRight, Check } from "lucide-react";
import { CTA, Footer, Ghost, Github, Nav } from "@/components/chrome";
import { BreadcrumbJsonLd, JsonLdScript } from "@/components/schema";
import { VS, VS_PUBLISHED, VS_UPDATED, type VsData } from "@/lib/vs";
import { OG_IMAGE, REPO, SITE_URL } from "@/lib/seo";
import { asset } from "@/lib/asset";

function Updated() {
  return (
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
  );
}

function ChooseCard({ title, items, accent }: { title: string; items: string[]; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "border-primary/25 bg-primary/5" : "bg-card/30"}`}>
      <h3 className="font-display font-medium">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2 text-[15px] leading-relaxed text-muted-foreground">
            <Check className={`mt-1 size-3.5 shrink-0 ${accent ? "text-primary" : "text-muted-foreground/60"}`} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WinList({ items }: { items: { title: string; body: string }[] }) {
  return (
    <div className="max-w-3xl space-y-5">
      {items.map((i) => (
        <div key={i.title}>
          <h3 className="font-display font-medium text-foreground">{i.title}</h3>
          <p className="mt-1 leading-relaxed text-muted-foreground">{i.body}</p>
        </div>
      ))}
    </div>
  );
}

/** A full comparison page, rendered entirely from one VsData object. */
export function VsPage({ data }: { data: VsData }) {
  const url = `${SITE_URL}/vs/${data.slug}`;
  const others = VS.filter((v) => v.slug !== data.slug);
  return (
    <div className="relative">
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          "@id": `${url}#article`,
          headline: data.metaTitle,
          description: data.metaDesc,
          image: OG_IMAGE.url,
          datePublished: VS_PUBLISHED,
          dateModified: VS_UPDATED,
          author: { "@type": "Organization", name: "re-marked", url: "https://github.com/re-marked" },
          about: { "@type": "SoftwareApplication", name: "Handshake", "@id": `${SITE_URL}/#app` },
          isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
        }}
      />
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${url}#faq`,
          mainEntity: data.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <BreadcrumbJsonLd
        trail={[
          { name: "Compare", path: "/vs/" },
          { name: data.name, path: `/vs/${data.slug}/` },
        ]}
      />
      <Nav />

      <main className="mx-auto w-full max-w-[2000px] px-6 pb-24 pt-14 sm:px-12 sm:pt-20 lg:px-20">
        <p className="text-sm font-medium text-primary">
          <a href={asset("/vs")} className="hover:underline">
            Compare
          </a>
          <span className="mx-2 text-muted-foreground/50">/</span>
          <span className="text-muted-foreground">{data.name}</span>
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-6xl">{data.h1}</h1>
        <Updated />
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{data.intro}</p>

        <div className="mt-8 max-w-3xl space-y-5">
          {data.paras.map((p, i) => (
            <p key={i} className="leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
        </div>

        {/* ── the table — high on the page, snippet & AI-extraction bait ── */}
        <h2 className="mt-14 font-display text-2xl font-semibold">At a glance</h2>
        <div className="mt-6 max-w-4xl overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[600px] text-[15px]">
            <thead>
              <tr className="border-b bg-card/50 text-left">
                <th className="p-3.5 font-medium text-muted-foreground" />
                <th className="p-3.5 font-display font-semibold">{data.name}</th>
                <th className="p-3.5 font-display font-semibold text-primary">Handshake</th>
              </tr>
            </thead>
            <tbody>
              {data.table.map((r) => (
                <tr key={r.label} className="border-b last:border-0">
                  <td className="p-3.5 align-top font-medium text-muted-foreground">{r.label}</td>
                  <td className="p-3.5 align-top leading-relaxed text-muted-foreground">{r.them}</td>
                  <td className="bg-primary/[0.04] p-3.5 align-top leading-relaxed text-foreground/90">{r.us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-4xl text-sm text-muted-foreground/60">
          Competitor details checked July 2026 — check their site for current pricing.
        </p>

        <h2 className="mt-14 font-display text-2xl font-semibold">Where {data.short} wins</h2>
        <div className="mt-6">
          <WinList items={data.theyWin} />
        </div>

        <h2 className="mt-14 font-display text-2xl font-semibold">Where Handshake wins</h2>
        <div className="mt-6">
          <WinList items={data.weWin} />
        </div>

        {/* ── the verdict ── */}
        <h2 className="mt-14 font-display text-2xl font-semibold">The honest verdict</h2>
        <div className="mt-6 grid max-w-4xl gap-4 sm:grid-cols-2">
          <ChooseCard title={`Choose ${data.name} if…`} items={data.chooseThem} />
          <ChooseCard title="Choose Handshake if…" items={data.chooseUs} accent />
        </div>

        {/* ── page FAQs (mirrored in FAQPage JSON-LD) ── */}
        <h2 className="mt-14 font-display text-2xl font-semibold">Questions</h2>
        <dl className="mt-6 max-w-3xl space-y-7">
          {data.faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-display text-lg font-medium text-foreground">{f.q}</dt>
              <dd className="mt-2 leading-relaxed text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>

        {/* ── CTA ── */}
        <div className="mt-16 max-w-4xl rounded-2xl border bg-card/40 p-8">
          <h2 className="font-display text-2xl font-semibold">Try the local-first way</h2>
          <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">
            Handshake is free, open source, and takes about two minutes to meet your network. If it&apos;s
            not for you, your notes are plain markdown — nothing lost.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <CTA href={asset("/download")}>Download Handshake</CTA>
            <Ghost href={asset("/guide/getting-started")}>Read the guide</Ghost>
            <Ghost href={REPO}>
              <Github className="size-4" /> Source on GitHub
            </Ghost>
          </div>
        </div>

        {/* ── related comparisons ── */}
        <div className="mt-14 max-w-4xl">
          <h2 className="font-display text-lg font-medium text-muted-foreground">More comparisons</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={asset("/personal-crm")}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-sm text-primary transition-colors hover:bg-primary/10"
            >
              What is a personal CRM? <ArrowRight className="size-3.5" />
            </a>
            {others.map((v) => (
              <a
                key={v.slug}
                href={asset(`/vs/${v.slug}`)}
                className="rounded-full border bg-card/40 px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                vs {v.name}
              </a>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
