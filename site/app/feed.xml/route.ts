import { getReleases } from "@/lib/releases";
import { DESCRIPTION, SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** RSS 2.0 feed of releases — generated at build time, so it updates with every deploy
 *  (and every release, since publishing one triggers a site rebuild). */
export async function GET() {
  const releases = await getReleases();
  const items = releases
    .map(
      (r) => `    <item>
      <title>${esc(`Handshake ${r.tag}`)}</title>
      <link>${SITE_URL}/changelog/#${esc(r.tag)}</link>
      <guid isPermaLink="false">${esc(r.htmlUrl)}</guid>
      <pubDate>${new Date(r.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${r.body.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]></description>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Handshake releases</title>
    <link>${SITE_URL}/changelog/</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${esc(DESCRIPTION)}</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
