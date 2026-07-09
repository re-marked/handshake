// Single source of truth for the site's SEO/GEO surface. The FAQ array drives BOTH the visible
// FAQ section and the FAQPage JSON-LD, so they can never drift apart (which AI engines penalize).

export const SITE_URL = "https://re-marked.github.io/handshake";
export const REPO = "https://github.com/re-marked/handshake";
export const DOWNLOAD = `${REPO}/releases/latest`;
export const SITE_NAME = "Handshake";
export const TAGLINE = "Know who you know.";
// The latest PUBLISHED release (what the download page links to). Bump on every release.
export const APP_VERSION = "0.9.2";

/** The branded 1200×630 social card (source: site/assets/og-source.svg). */
export const OG_IMAGE = {
  url: `${SITE_URL}/og.png`,
  width: 1200,
  height: 630,
  alt: "Handshake — Know who you know. Map the people you know, local-first, in plain text.",
};

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

/** Plain-text install steps per platform — the HowTo JSON-LD on /download. Mirrors the visible
 *  steps in components/Download.tsx (which carry JSX formatting, so they can't be shared directly). */
export const INSTALL_STEPS_TEXT: { os: string; steps: string[] }[] = [
  {
    os: "macOS",
    steps: [
      "Download the Handshake .dmg and open it.",
      "Drag Handshake into your Applications folder.",
      "Right-click the app and choose Open the first time (it isn't notarized yet), then open it from Applications or Spotlight.",
    ],
  },
  {
    os: "Windows",
    steps: [
      "Download and run the Handshake .msi installer.",
      "If SmartScreen appears, click More info, then Run anyway (it isn't code-signed yet).",
      "Launch Handshake from the Start menu.",
    ],
  },
  {
    os: "Linux",
    steps: [
      "Download the Handshake .AppImage (or the .deb / .rpm for your distro).",
      "Make it executable: chmod +x handshake_*.AppImage",
      "Run it: ./handshake_*.AppImage — on Wayland compositors like Hyprland or sway, launch with WEBKIT_DISABLE_DMABUF_RENDERER=1 if the window is blank.",
    ],
  },
];

/** The full FAQ, grouped by topic — drives the /faq page AND its FAQPage JSON-LD. */
export const FAQ_GROUPS: { topic: string; items: { q: string; a: string }[] }[] = [
  {
    topic: "Getting started",
    items: [
      {
        q: "What is Handshake?",
        a: "Handshake is a free, local-first desktop app for mapping the people you know — your network as a graph of people, the connections between them, and the warmth of each tie. It runs on macOS, Windows, and Linux, and stores everything as plain markdown files on your own machine.",
      },
      {
        q: "How do I get started?",
        a: "Download Handshake, open it, and create a network — a plain folder anywhere you choose. It seeds your own card at the center of the board; from there, add people by name, set how you met and how warm each tie is, and write notes. Most people have a real map of their inner circle in a few minutes.",
      },
      {
        q: "Is Handshake free?",
        a: "Yes. Handshake is free and open source (MIT licensed). There's no account, no subscription, and no paid tier — you download it and it's yours.",
      },
      {
        q: "Do I need an account or an internet connection?",
        a: "No. Handshake is local-first and works fully offline. There's no sign-up, no login, and nothing phones home.",
      },
    ],
  },
  {
    topic: "Privacy & your data",
    items: [
      {
        q: "Where is my data stored?",
        a: "In a folder of plain markdown files on your own device — you pick the location when you create a network. There is no cloud component at all.",
      },
      {
        q: "Can anyone else read my network?",
        a: "No. There's no server, no account, and no telemetry — your relationships never leave your machine. Not even we can see them.",
      },
      {
        q: "How do I back up or sync my network?",
        a: "Because a network is just a folder of text files, any file-level tool works: git for full version history, or iCloud, Dropbox, OneDrive, or Syncthing for syncing between machines. Handshake also quietly git-versions each network with its built-in Time Machine, so you can snapshot and roll back from inside the app.",
      },
      {
        q: "What happens to my data if I stop using Handshake?",
        a: "Nothing bad — you keep a tidy folder of human-readable markdown. Every person, connection, and note stays readable in any text editor, forever. Your data outlives the app.",
      },
    ],
  },
  {
    topic: "Platforms & installing",
    items: [
      {
        q: "What platforms does Handshake support?",
        a: "macOS (Apple Silicon and Intel), Windows 10/11, and Linux (.AppImage, .deb, and .rpm). It's a native desktop app built on Tauri — small, fast, and instant to start.",
      },
      {
        q: "Why does macOS or Windows warn me when I install it?",
        a: "Handshake isn't code-signed yet (it's in public beta), so macOS Gatekeeper and Windows SmartScreen flag it as coming from an unidentified developer. On macOS: right-click the app → Open → Open. On Windows: click More info → Run anyway. The full source code is on GitHub if you'd like to check it first.",
      },
      {
        q: "The window is blank on Linux (Hyprland / sway) — what do I do?",
        a: "On some Wayland compositors, WebKitGTK's DMABUF renderer hits a protocol error and renders nothing. Launch Handshake with the renderer disabled: WEBKIT_DISABLE_DMABUF_RENDERER=1 handshake. Putting that env var in your launcher or a small wrapper script fixes it permanently.",
      },
      {
        q: "How do updates work?",
        a: "New releases ship on GitHub with installers for every platform. During the beta, you update by downloading the latest release — each version's notes say what changed.",
      },
    ],
  },
  {
    topic: "Files & format",
    items: [
      {
        q: "What file format does Handshake use?",
        a: "Plain markdown (.md) files with YAML frontmatter, organized in a simple folder structure: people/, handshakes/, goals/, interactions/, and attachments/. No database, no proprietary format.",
      },
      {
        q: "Can I open my network in Obsidian?",
        a: "Yes — a Handshake network is a valid Obsidian vault. Open the same folder in Obsidian and every person and note is right there as markdown. Edits you make outside Handshake flow back in when you return.",
      },
      {
        q: "What are backlinks?",
        a: "Type [[ in anyone's note and Handshake autocompletes from your people. Mentioning someone — like [[Sarah Chen]] — draws a dotted connection on the board and makes their card grow with inbound mentions. Your notes quietly become a navigable map.",
      },
    ],
  },
  {
    topic: "Compared to other tools",
    items: [
      {
        q: "How is Handshake different from a CRM?",
        a: "A CRM is built for sales pipelines: deals, stages, follow-up automation, in the cloud. Handshake is a personal thinking tool for the people in your life — who they are, how you met, who connects to whom — stored privately as files you own. No pipeline, no quota, no server.",
      },
      {
        q: "How is Handshake different from Obsidian?",
        a: "They share a philosophy — local-first, plain markdown, links between notes — which is why we call Handshake 'Obsidian for your network.' The difference is specialization: Obsidian is a general knowledge base, while Handshake is purpose-built for people — a spatial board of warmth-weighted ties, person cards with photos and roles, goals, and introduction paths.",
      },
      {
        q: "Why not just use a spreadsheet?",
        a: "A spreadsheet stores rows; it can't show you the shape of your network. Handshake lays everyone out spatially, draws the ties between them, fades the connections going stale, and lets you write real notes on every person — while staying just as portable, because it's all plain text underneath.",
      },
    ],
  },
  {
    topic: "Beta",
    items: [
      {
        q: "What does 'public beta' mean for Handshake?",
        a: "Handshake is pre-1.0: the core is complete and stable enough to live in daily, but it's still evolving fast and releases aren't code-signed yet. Your data is safe regardless — it's plain files, and the built-in Time Machine keeps versioned snapshots.",
      },
      {
        q: "How do I report a bug or request a feature?",
        a: "Open an issue on GitHub. For bugs, Handshake has a built-in debug report — press Ctrl-Shift-D in the app and attach the generated report (it can redact your vault path and platform); it makes most bugs quickly diagnosable.",
      },
    ],
  },
];
