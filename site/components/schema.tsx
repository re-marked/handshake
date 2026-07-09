import { SITE_URL } from "@/lib/seo";

/** Render any schema.org object as a JSON-LD script tag. */
export function JsonLdScript({ data }: { data: object }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

/** BreadcrumbList for a sub-page: Home → <name>. */
export function BreadcrumbJsonLd({ name, path }: { name: string; path: string }) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name, item: `${SITE_URL}${path}` },
        ],
      }}
    />
  );
}
