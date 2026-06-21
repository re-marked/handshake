import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL("https://re-marked.github.io"),
  title: "Handshake — Obsidian for your network",
  description:
    "A local-first desktop app that turns the people in your orbit into a graph you can think with. Plain markdown underneath, a calm rose-on-monochrome canvas on top.",
  icons: { icon: `${base}/handshake-logo.png` },
  openGraph: {
    title: "Handshake — Obsidian for your network",
    description: "Map the people in your orbit. Plain files. One rose accent. Yours.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
