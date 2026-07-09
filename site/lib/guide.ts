// The guide's table of contents — one entry per section page. Drives the /guide hub, the nav
// prev/next links, each page's metadata, and the sitemap. Order here = reading order.

export interface GuideSection {
  slug: string;
  /** Page H1 + hub card title. */
  title: string;
  /** One-liner shown on the hub card and used as the meta description seed. */
  blurb: string;
}

export const GUIDE: GuideSection[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    blurb: "Install Handshake, create your first network, and map your inner circle in a few minutes.",
  },
  {
    slug: "board",
    title: "The board",
    blurb: "The heart of Handshake — a pannable, zoomable map of your network, rooted on you.",
  },
  {
    slug: "notes-and-backlinks",
    title: "Notes & backlinks",
    blurb: "Every person gets a markdown note. Write [[a name]] and Handshake draws the connection.",
  },
  {
    slug: "workspace",
    title: "The workspace",
    blurb: "Tabs, resizable splits, and floating notes — an Obsidian-style layout that's saved as you go.",
  },
  {
    slug: "time-machine",
    title: "Time Machine",
    blurb: "Every network is quietly git-versioned. Undo anything, snapshot moments, roll back in time.",
  },
  {
    slug: "networks-and-files",
    title: "Networks & plain files",
    blurb: "A network is just a folder of markdown. Keep separate worlds separate, sync it however you like.",
  },
  {
    slug: "customization",
    title: "Make it yours",
    blurb: "Themes, fonts, scale, density, and a settings page full of honest dials.",
  },
];
