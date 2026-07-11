import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VsPage } from "@/components/vs";
import { VS, vsBySlug } from "@/lib/vs";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return VS.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = vsBySlug(slug);
  if (!data) return {};
  return {
    // metaTitles already carry the brand – bypass the "%s – Handshake" template.
    title: { absolute: data.metaTitle },
    description: data.metaDesc,
    alternates: { canonical: `${SITE_URL}/vs/${slug}` },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDesc,
      url: `${SITE_URL}/vs/${slug}`,
      images: [OG_IMAGE],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = vsBySlug(slug);
  if (!data) notFound();
  return <VsPage data={data} />;
}
