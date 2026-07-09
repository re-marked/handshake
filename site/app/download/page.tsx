import type { Metadata } from "next";
import { Footer, Nav } from "@/components/chrome";
import { Download } from "@/components/Download";
import { BreadcrumbJsonLd, JsonLdScript } from "@/components/schema";
import { INSTALL_STEPS_TEXT, OG_IMAGE, SITE_URL } from "@/lib/seo";

const TITLE = "Download";
const DESC =
  "Download Handshake for macOS, Windows, or Linux — free, open source, and local-first. Install steps, system requirements, and troubleshooting for each platform.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/download` },
  openGraph: {
    title: "Download Handshake — macOS, Windows, Linux",
    description: DESC,
    url: `${SITE_URL}/download`,
    images: [OG_IMAGE],
  },
};

/** One HowTo per platform — what AI engines cite for "how do I install Handshake on X". */
function HowToJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@graph": INSTALL_STEPS_TEXT.map(({ os, steps }) => ({
          "@type": "HowTo",
          "@id": `${SITE_URL}/download#howto-${os.toLowerCase()}`,
          name: `How to install Handshake on ${os}`,
          totalTime: "PT2M",
          estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: 0 },
          step: steps.map((text, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            text,
          })),
        })),
      }}
    />
  );
}

export default function DownloadPage() {
  return (
    <div className="relative">
      <HowToJsonLd />
      <BreadcrumbJsonLd name="Download" path="/download" />
      <Nav />
      <Download />
      <Footer />
    </div>
  );
}
