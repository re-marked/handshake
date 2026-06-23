// Single source of truth for the site's SEO/GEO surface. The FAQ array drives BOTH the visible
// FAQ section and the FAQPage JSON-LD, so they can never drift apart (which AI engines penalize).

export const SITE_URL = "https://re-marked.github.io/handshake";
export const REPO = "https://github.com/re-marked/handshake";
export const DOWNLOAD = `${REPO}/releases/latest`;
export const SITE_NAME = "Handshake";
export const TAGLINE = "Know who you know.";
export const APP_VERSION = "0.9.2";

// Definition-led (the "[Entity] is a [category] that [differentiator]" shape AI retrieval prefers).
export const DESCRIPTION =
  "Handshake is a free, local-first desktop app for mapping the people you know — who they are, how you met, and how everyone's connected. Your network lives as plain markdown files on your own machine. macOS, Windows, and Linux.";

export const FEATURES = [
  "A pannable, zoomable board of your whole network",
  "[[backlinks]] that wire people together as you write",
  "A searchable, sortable People list",
  "An Obsidian-style workspace — tabs, splits, and floating notes",
  "Git-backed Time Machine version history",
  "Plain markdown vault — no database, no account, no telemetry",
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: "What is Handshake?",
    a: "Handshake is a local-first desktop app for mapping the people you know — your network as a graph of people, the ties between them, and the warmth of each connection. It runs on macOS, Windows, and Linux and stores everything as plain markdown files on your own machine.",
  },
  {
    q: "Is Handshake free?",
    a: "Yes. Handshake is free and open source. There's no account, no subscription, and no paid tier — you download it and it's yours.",
  },
  {
    q: "Where is my data stored, and is it private?",
    a: "Everything lives in a folder of plain markdown files on your device. There's no cloud, no account, and no telemetry — no one can read your relationships, not even us. You can back it up or sync it yourself with git, iCloud, Dropbox, or OneDrive.",
  },
  {
    q: "What platforms does Handshake support?",
    a: "macOS, Windows, and Linux. It's a native desktop app built on Tauri.",
  },
  {
    q: "Do I need an internet connection or an account?",
    a: "No. Handshake is local-first and works fully offline, with no sign-up of any kind.",
  },
  {
    q: "What file format does Handshake use?",
    a: "Plain markdown (.md) files with YAML frontmatter, in a folder you choose. You can open, edit, and search them with any text editor — or open the same folder in Obsidian.",
  },
  {
    q: "How is Handshake different from a CRM?",
    a: "A CRM is built for sales pipelines and lives in the cloud. Handshake is a calm, personal tool for remembering the people in your life — who they are, how you met, and who connects to whom — stored privately as files you own.",
  },
];
