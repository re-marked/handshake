import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { GUIDE } from "@/lib/guide";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/guide/`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    ...GUIDE.map((s) => ({
      url: `${SITE_URL}/guide/${s.slug}/`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/download/`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/faq/`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
