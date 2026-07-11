import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL, SITE_NAME, DESCRIPTION, OG_IMAGE } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const TITLE = "Handshake – Know who you know";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s – Handshake" },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  category: "productivity",
  keywords: [
    "Handshake",
    "personal CRM",
    "network mapping",
    "relationship manager",
    "local-first app",
    "Obsidian for your network",
    "plain text",
    "markdown",
    "people graph",
    "contacts app",
    "private contacts",
    "desktop app",
  ],
  authors: [{ name: "re-marked", url: "https://github.com/re-marked" }],
  creator: "re-marked",
  publisher: "re-marked",
  alternates: {
    canonical: SITE_URL,
    types: { "application/rss+xml": `${SITE_URL}/feed.xml` },
  },
  verification: { google: "BAHZYqv1rf4dNNZ6HwnwBOCuFhX2DrsoD0s3vjWMLmo" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: { icon: `${base}/handshake-logo.png` },
};

export const viewport: Viewport = {
  themeColor: "#1e1c1a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
