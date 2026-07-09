import { SITE_URL } from "@/lib/seo";

/** Render any schema.org object as a JSON-LD script tag. */
export function JsonLdScript({ data }: { data: object }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

/** BreadcrumbList: Home → …trail. Each trail item is { name, path } with a site-relative path. */
export function BreadcrumbJsonLd({ trail }: { trail: { name: string; path: string }[] }) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          ...trail.map((t, i) => ({
            "@type": "ListItem",
            position: i + 2,
            name: t.name,
            item: `${SITE_URL}${t.path}`,
          })),
        ],
      }}
    />
  );
}
