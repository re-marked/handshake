import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

// Explicitly welcome everyone – including AI answer-engine crawlers (GPTBot, ClaudeBot,
// PerplexityBot, Google-Extended, etc.), which a default robots policy often inadvertently blocks.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
