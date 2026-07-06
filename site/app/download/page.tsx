import type { Metadata } from "next";
import { Footer, Nav } from "@/components/chrome";
import { Download } from "@/components/Download";
import { SITE_URL } from "@/lib/seo";

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
  },
};

export default function DownloadPage() {
  return (
    <div className="relative">
      <Nav />
      <Download />
      <Footer />
    </div>
  );
}
