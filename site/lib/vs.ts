// The /vs comparison system's single source of truth. Every page renders from one VsData object,
// so structure, schema, and tone stay consistent. Competitor facts were checked July 2026 –
// re-verify pricing when bumping VS_UPDATED.

export const VS_PUBLISHED = "2026-07-10";
export const VS_UPDATED = "2026-07-11";

export interface VsData {
  slug: string;
  /** Display name, e.g. "Clay (Mesh)". */
  name: string;
  /** Short name used mid-prose, e.g. "Mesh". */
  short: string;
  metaTitle: string;
  metaDesc: string;
  h1: string;
  /** Definition-led opening – defines BOTH products in two sentences. */
  intro: string;
  /** A paragraph or two of honest context about the competitor. */
  paras: string[];
  table: { label: string; them: string; us: string }[];
  theyWin: { title: string; body: string }[];
  weWin: { title: string; body: string }[];
  chooseThem: string[];
  chooseUs: string[];
  faqs: { q: string; a: string }[];
}

/** Handshake's column, shared by every table. */
const US = {
  price: "Free, open source (MIT)",
  data: "Plain markdown files on your device",
  platforms: "macOS, Windows & Linux desktop",
  offline: "Fully offline – no account",
  format: "Already plain text; nothing to export",
  viz: "A spatial board of your whole network",
  autosync: "None – you decide who's on the map",
  openSource: "Yes (MIT)",
};

const row = (label: string, them: string, us: string) => ({ label, them, us });

export const VS: VsData[] = [
  {
    slug: "clay",
    name: "Clay (Mesh)",
    short: "Mesh",
    metaTitle: "Clay (Mesh) alternative – Handshake, a free local-first personal CRM",
    metaDesc:
      "Looking for a Clay / Mesh personal CRM alternative? Handshake maps your network as plain markdown files on your own machine – free, open source, offline. An honest comparison.",
    h1: "Handshake vs Clay (Mesh)",
    intro:
      "Mesh – the personal CRM formerly known as Clay at clay.earth – is an AI-powered cloud service that builds and enriches your contact list automatically from your email, calendar, LinkedIn, and X. Handshake is the opposite philosophy: a free, local-first desktop app where your network is a deliberate map – the people who actually matter, in plain markdown files you own.",
    paras: [
      "Mesh's pitch is that the CRM maintains itself: connect your accounts and the people you interact with appear, enriched with photos, roles, and job-change updates pulled from the web, with an AI assistant on top. It's genuinely slick, and for someone who lives in email and calendar it removes almost all upkeep. (Note: Mesh is unrelated to Clay.com, a B2B sales-enrichment platform that shares the old name.)",
      "The trade is structural, not a missing feature: for Mesh to maintain your network, a cloud service must read your communications – and what it builds is a mirror of your inbox, not your network. Everyone who ever emailed you shows up; the people who matter are buried among the people who don't. Handshake inverts that: nothing leaves your machine, and the map holds exactly the people you decided belong on it. The question isn't which app has more features – it's whether you want a bigger list or a truer one.",
    ],
    table: [
      row("Price", "Free tier; paid subscription for unlimited contacts & enrichment (July 2026)", US.price),
      row("Where your data lives", "Their cloud, built from your connected accounts", US.data),
      row("Platforms", "Web, macOS, iOS", US.platforms),
      row("Works offline", "No – cloud service", US.offline),
      row("Data format", "Proprietary; export on request", US.format),
      row("Seeing your network", "Searchable list + profiles", US.viz),
      row("Auto-sync / enrichment", "Email, calendar, LinkedIn, X; web enrichment + AI", US.autosync),
      row("Open source", "No", US.openSource),
    ],
    theyWin: [
      {
        title: "Zero-upkeep ingestion",
        body: "Connect your accounts and your network materializes. If manual entry is why every CRM you've tried died, Mesh solves exactly that.",
      },
      {
        title: "Live enrichment",
        body: "Job changes, new roles, news about your contacts – surfaced automatically. Handshake will never know someone changed jobs until you write it down.",
      },
      {
        title: "Polished mobile",
        body: "A real iOS app. Handshake is desktop-only during its beta.",
      },
    ],
    weWin: [
      {
        title: "Privacy by architecture",
        body: "No cloud reads your email, calendar, or DMs – there is no cloud. Your relationship map never leaves your disk, which matters precisely because this is your most personal data.",
      },
      {
        title: "A map, not a contact dump",
        body: "Auto-built CRMs fill with everyone who ever emailed you – recruiters, receipts, one-off intros. A deliberate map holds only the people you chose to put on it, and that editorial line is exactly what makes it something you can think with rather than just search.",
      },
      {
        title: "You own the files",
        body: "Every person and note is a markdown file you can open in Obsidian, grep, back up, or keep for thirty years. Mesh's database is theirs; yours is a folder.",
      },
      {
        title: "The shape of your network",
        body: "Mesh shows a list. Handshake shows the map – who connects to whom, how warm each tie is, who introduced you – which is a different way of thinking, not just a different view.",
      },
      {
        title: "Free means free",
        body: "MIT-licensed, no tiers, no per-contact limits, no subscription. Forever.",
      },
    ],
    chooseThem: [
      "You want the CRM to maintain itself from your email and calendar",
      "Job-change alerts and auto-enrichment genuinely matter to your work",
      "You're comfortable with a cloud service reading your communications",
      "You need it on your phone today",
    ],
    chooseUs: [
      "You want a map of your actual network, not a mirror of your inbox",
      "No service should be reading your inbox to know who your friends are",
      "You want to see your network spatially, not scroll it",
      "You want plain files that outlive any company – including us",
    ],
    faqs: [
      {
        q: "Is Clay the same as Mesh?",
        a: "Yes – the personal CRM that lived at clay.earth rebranded to Mesh (me.sh) in 2024; old links redirect. It's unrelated to Clay.com, a separate B2B sales-enrichment platform.",
      },
      {
        q: "Is there a free alternative to Clay / Mesh?",
        a: "Handshake is free and open source (MIT), with no contact limits or paid tiers. Monica is another open-source option if you're willing to self-host a server.",
      },
      {
        q: "Does Handshake sync my email or LinkedIn like Mesh does?",
        a: "No – deliberately. Handshake is local-first and fully manual: you add the people who matter, and nothing about your communications ever leaves your machine.",
      },
    ],
  },
  {
    slug: "dex",
    name: "Dex",
    short: "Dex",
    metaTitle: "Dex alternative – Handshake, a free local-first personal CRM",
    metaDesc:
      "Looking for a free Dex personal CRM alternative? Handshake keeps your network in plain markdown files on your own machine – offline, open source, with a visual board. An honest comparison.",
    h1: "Handshake vs Dex",
    intro:
      "Dex is a cloud personal CRM built around keep-in-touch reminders – a browser extension, mobile apps, LinkedIn sync, and AI pre-meeting briefs, from $12/month (July 2026). Handshake is a free, local-first desktop app that maps your network as plain markdown files you own.",
    paras: [
      "Dex is probably the most complete keep-in-touch machine in the category: set a cadence per person (“every two months”), and it nags you, drafts context from your history, and syncs LinkedIn connections through its extension. Free plan; Premium at $12/month, Professional at $20/month with email integrations and API access.",
      "Handshake doesn't nag. Instead, the board itself shows neglect – cards can fade as ties go stale, so you see the drift instead of being pinged about it. It's a calmer contract: the map informs you; you decide who to reach out to.",
    ],
    table: [
      row("Price", "Free plan; Premium $12/mo, Professional $20/mo (July 2026)", US.price),
      row("Where your data lives", "Their cloud", US.data),
      row("Platforms", "Web, iOS, Android, browser extension", US.platforms),
      row("Works offline", "No", US.offline),
      row("Data format", "Proprietary; CSV export", US.format),
      row("Seeing your network", "Lists, timelines, reminders", US.viz),
      row("Auto-sync / enrichment", "LinkedIn sync, calendar, email (paid); AI briefs", US.autosync),
      row("Open source", "No", US.openSource),
    ],
    theyWin: [
      {
        title: "Keep-in-touch cadences",
        body: "Per-person reminder schedules with notifications. If you want a system that actively pushes you to reach out, Dex is built for exactly that and Handshake isn't.",
      },
      {
        title: "LinkedIn sync",
        body: "The browser extension pulls your connections in – no retyping. Handshake has no integrations by design.",
      },
      {
        title: "Phone-first workflows",
        body: "Real mobile apps for capturing a note right after coffee. Handshake is desktop-only during the beta.",
      },
    ],
    weWin: [
      {
        title: "No subscription, ever",
        body: "Dex's useful tier costs $144–240/year. Handshake is MIT-licensed and free – the entire feature set, no limits.",
      },
      {
        title: "Your data is a folder",
        body: "Markdown files you can read in any editor or open as an Obsidian vault, versus a cloud database with CSV export.",
      },
      {
        title: "The board",
        body: "Dex tells you who to contact; Handshake shows you the whole shape – ties by warmth, introduction chains, backlinks between notes drawn as lines.",
      },
      {
        title: "Offline and private",
        body: "No account, no server, nothing to breach. A personal CRM is a map of your relationships – arguably the last thing that belongs in someone else's cloud.",
      },
    ],
    chooseThem: [
      "Automated keep-in-touch reminders are the main thing you want",
      "You need LinkedIn sync and mobile capture",
      "You'll happily pay ~$12/month for less manual work",
    ],
    chooseUs: [
      "You want free, open source, and no account",
      "You think in maps, not task lists",
      "Your relationship notes should live in files you control",
      "You'd rather decide who's on the map than have an algorithm decide for you",
    ],
    faqs: [
      {
        q: "Is Dex free?",
        a: "Dex has a free plan; the paid tiers are Premium at $12/month and Professional at $20/month (July 2026). Handshake is entirely free and open source.",
      },
      {
        q: "Does Handshake have keep-in-touch reminders like Dex?",
        a: "No automated reminders. Instead, the board can fade cards as ties go stale, so neglected relationships become visible at a glance – you act on what you see rather than what pings you.",
      },
      {
        q: "Can I move from Dex to Handshake?",
        a: "Dex exports CSV; Handshake's vault is plain markdown with a simple frontmatter format, so contacts can be migrated by hand or with a small script. There's no automated importer yet.",
      },
    ],
  },
  {
    slug: "monica",
    name: "Monica",
    short: "Monica",
    metaTitle: "Monica CRM alternative – Handshake, open source without the server",
    metaDesc:
      "Monica vs Handshake: two open-source personal CRMs with opposite architectures – a self-hosted web app with a database versus a local desktop app with plain markdown files. An honest comparison.",
    h1: "Handshake vs Monica",
    intro:
      "Monica is the best-known open-source personal CRM: a self-hosted web application (AGPL) for remembering the details of friends and family, also offered as a hosted service at $9/month (July 2026). Handshake is open source too (MIT) – but it's a local desktop app storing plain markdown files, with no server anywhere.",
    paras: [
      "We like Monica. It's the philosophical sibling in this category – genuinely open source, privacy-first, built because its creator kept forgetting birthdays and kids' names. It shines at life's soft details: gifts, pets, journals, how you met. It's actively maintained with a large community (22k+ GitHub stars).",
      "The real difference is architectural. Monica is a web app with a database: to own your data you run a server (a VPS, Docker, PHP, upgrades). Handshake's answer to the same privacy goal is radical simplicity – there is no server to run because there's no server at all. Your network is a folder of text files on your disk.",
    ],
    table: [
      row("Price", "Free self-hosted (AGPL); hosted $9/mo, free tier limited to 10 contacts (July 2026)", US.price),
      row("Where your data lives", "A database on your server (or theirs, hosted)", US.data),
      row("Platforms", "Web (self-hosted or cloud)", US.platforms),
      row("Works offline", "Only as far as your server does", US.offline),
      row("Data format", "SQL database; JSON/CSV export", US.format),
      row("Seeing your network", "Profiles, lists, journals", US.viz),
      row("Auto-sync / enrichment", "None – manual, like Handshake", US.autosync),
      row("Open source", "Yes (AGPL)", US.openSource),
    ],
    theyWin: [
      {
        title: "Everywhere your browser is",
        body: "Self-host it once and Monica is on every device, phone included. Handshake is desktop-only during the beta; your vault syncs as files, but the app itself doesn't run on a phone.",
      },
      {
        title: "Life's soft details",
        body: "Structured fields for gifts, pets, addresses, journals, significant others – Monica is lovingly deep on personal-life record keeping.",
      },
      {
        title: "Maturity",
        body: "Nearly a decade old, huge community, battle-tested. Handshake is a young public beta.",
      },
    ],
    weWin: [
      {
        title: "No server to run",
        body: "Monica's self-hosted privacy costs you a VPS, Docker, and upgrades. Handshake gives you the same ownership by writing plain files to your disk – download, open, done.",
      },
      {
        title: "Files beat databases",
        body: "Markdown you can grep, open in Obsidian, and read in 2056, versus a SQL database you query through an app. Both are yours; one needs no tooling to stay yours.",
      },
      {
        title: "The map",
        body: "Monica records people; Handshake shows the network – a spatial board with warmth-weighted ties, introduction chains, and backlinks drawn as lines.",
      },
      {
        title: "Built-in time travel",
        body: "Every network is git-versioned automatically (no git knowledge needed): snapshots, undo for everything, restore to any point.",
      },
    ],
    chooseThem: [
      "You want web access from every device, including your phone",
      "You track personal-life details – gifts, dates, journals – more than network structure",
      "You already run a homelab and enjoy self-hosting",
    ],
    chooseUs: [
      "You want data ownership without running infrastructure",
      "You want to see relationships, not just record them",
      "Plain text files matter to you (Obsidian users, this is your species)",
      "You want a native, instant desktop app",
    ],
    faqs: [
      {
        q: "Is Monica still maintained in 2026?",
        a: "Yes – the open-source project is actively developed with a large community, and the hosted service at monicahq.com remains available at $9/month.",
      },
      {
        q: "Are both Monica and Handshake open source?",
        a: "Yes. Monica is AGPL-licensed (a self-hosted web app); Handshake is MIT-licensed (a local desktop app). The practical difference is architecture: Monica needs a server, Handshake writes plain files locally.",
      },
      {
        q: "Which is more private?",
        a: "Both are excellent, honestly. Self-hosted Monica keeps data on a server you control; Handshake keeps it on your local disk with no server at all. Handshake's surface area is smaller; Monica's reach is wider.",
      },
    ],
  },
  {
    slug: "thebrain",
    name: "TheBrain",
    short: "TheBrain",
    metaTitle: "TheBrain alternative for mapping people – Handshake, plain-file & people-first",
    metaDesc:
      "TheBrain vs Handshake: a general knowledge graph for any idea, file, or note versus a tool built specifically for mapping the people you know – in plain markdown you own. An honest comparison.",
    h1: "Handshake vs TheBrain",
    intro:
      "TheBrain is a 25-year-old “digital memory” – a general graph where any note, file, web page, or email becomes a connected Thought, free to start with Pro cloud sync and AI at $180/year (July 2026). Handshake is far narrower on purpose: a free, open-source desktop app that maps one thing – the people you know – as plain markdown files you own.",
    paras: [
      "TheBrain is genuinely impressive, and unusually aligned with Handshake on the things that matter most: it&apos;s free to use, your Brain lives on your own machine, and it runs on Windows, macOS, and Linux. If you want a single visual graph for everything in your head – projects, documents, ideas, and people all tangled together – TheBrain has a quarter-century head start and does it beautifully.",
      "The difference is focus, and it runs deep. In TheBrain every node is a generic “Thought”; a person, a PDF, and a passing idea are the same kind of object, connected by unlabeled links. Handshake only knows people – so it can do what a general graph can&apos;t: weight a tie by warmth, trace who introduced you to whom, grow a card as your notes mention someone, show a face on every node. One is a map of your mind; the other is a map of your relationships, and being about only people is exactly what lets it feel like people.",
    ],
    table: [
      row("Price", "Free tier (no file attachments); Pro $180/yr, lifetime $299 (July 2026)", US.price),
      row("What it maps", "Anything – notes, files, web pages, emails, ideas", "People and how you're connected to them"),
      row("Where your data lives", "On your device (a .brain database); cloud sync on Pro", US.data),
      row("Data format", "Proprietary .brain database", US.format),
      row("Relationship model", "Generic Thoughts joined by unlabeled links", "Warmth-weighted ties, introductions, backlinks"),
      row("Platforms", "Windows, macOS, Linux; web/iOS/Android on Pro", US.platforms),
      row("Open source", "No", US.openSource),
    ],
    theyWin: [
      {
        title: "It maps everything, not just people",
        body: "Projects, documents, web clippings, whole trains of thought – all in one graph. If you want a single second brain for your entire life, that generality is the whole point, and Handshake deliberately won't do it.",
      },
      {
        title: "A quarter-century of depth",
        body: "TheBrain has been refined since the late 1990s: unlimited Thoughts, mobile apps, AI, huge file attachments, battle-tested sync. Handshake is a young public beta.",
      },
      {
        title: "Everywhere, with AI",
        body: "Pro adds web, iOS, and Android sync plus Thought-Sync AI. Handshake is desktop-only during the beta and has no AI by design.",
      },
    ],
    weWin: [
      {
        title: "Built for people, not Thoughts",
        body: "A network isn't a pile of generic nodes. Handshake models the things that make relationships legible – warmth on every tie, who introduced whom, faces on cards, goals pinned near the people who can help – none of which a general graph expresses.",
      },
      {
        title: "Plain files, not a database",
        body: "Your Brain is a proprietary .brain database you read through TheBrain. A Handshake network is a folder of markdown you can open in Obsidian, grep, and read in thirty years without any app at all.",
      },
      {
        title: "Free and open source, fully",
        body: "TheBrain's free tier drops file attachments, AI, and sync, and lapsing Pro reverts you to it. Handshake is MIT-licensed with every feature included, forever – nothing to revert to.",
      },
      {
        title: "Focus is a feature",
        body: "TheBrain can hold your network, but you have to design that yourself among everything else. Handshake opens already knowing what a person, a tie, and an introduction are – a network map in two minutes, not a schema you maintain.",
      },
    ],
    chooseThem: [
      "You're mapping your whole mind – ideas, files, and people together",
      "You want one mature graph for everything, with mobile and AI",
      "Generic, flexible nodes suit you better than a fixed people model",
    ],
    chooseUs: [
      "The thing you actually want to map is the people you know",
      "You want warmth, introductions, and faces – not unlabeled Thoughts",
      "Your relationship notes should be plain markdown you own, not a .brain database",
      "Free and open source, with nothing behind a subscription",
    ],
    faqs: [
      {
        q: "Is TheBrain free?",
        a: "TheBrain has a free tier (unlimited Thoughts and links, basic sync, but no file attachments); Pro cloud service with sync and AI is $180/year and a lifetime license is $299 (July 2026). Handshake is entirely free and open source.",
      },
      {
        q: "Can TheBrain map people and relationships?",
        a: "Yes – anything can be a Thought, so you can absolutely build a people graph in it. What it lacks is a relationship model: there's no built-in notion of tie warmth, introductions, or person cards. Handshake models those natively because people are all it does.",
      },
      {
        q: "Which should I use for a personal network specifically?",
        a: "If people are one part of a bigger second brain full of ideas and files, TheBrain's generality wins. If the thing you want is specifically a map of the people you know – in plain files, that feels like people – that's exactly what Handshake is built for.",
      },
    ],
  },
  {
    slug: "folk",
    name: "folk",
    short: "folk",
    metaTitle: "folk CRM alternative for individuals – Handshake, free & local-first",
    metaDesc:
      "folk is a lightweight team CRM from $20/user/month. If you wanted it for your own network, Handshake is the personal alternative: free, open source, offline, plain markdown files. An honest comparison.",
    h1: "Handshake vs folk",
    intro:
      "folk is a lightweight, modern CRM for teams – shared contact bases, pipelines, mail merge, and email sequences, from $20 per user per month (July 2026). Handshake is a free, local-first desktop app for one person's real network, stored as plain markdown files.",
    paras: [
      "folk often appears in personal-CRM lists, and its design is genuinely lovely – but its center of gravity is team work: shared pipelines, deal stages, outreach sequences, per-seat pricing. If your team manages a funnel together, folk is a fine tool and Handshake simply isn't a competitor.",
      "The confusion is the word 'relationships.' folk manages contacts your team works; Handshake maps the people in your life – who you actually know, how warmly, and who connects to whom. Solo users evaluating folk are usually looking for the second thing while being sold the first.",
    ],
    table: [
      row("Price", "$20–40/user/mo, custom from $80 (July 2026)", US.price),
      row("Where your data lives", "Their cloud, shared with your team", US.data),
      row("Platforms", "Web + Chrome extension", US.platforms),
      row("Works offline", "No", US.offline),
      row("Data format", "Proprietary; CSV export", US.format),
      row("Seeing your network", "Tables and pipelines", US.viz),
      row("Auto-sync / enrichment", "Email sync, LinkedIn extension, enrichment", US.autosync),
      row("Open source", "No", US.openSource),
    ],
    theyWin: [
      {
        title: "Team collaboration",
        body: "Shared contact bases, roles, and pipelines. Handshake is deliberately single-player; there's nothing to share.",
      },
      {
        title: "Outreach machinery",
        body: "Mail merge, sequences, templates – if you're running campaigns, folk does work Handshake will never do.",
      },
      {
        title: "Integrations",
        body: "Gmail, LinkedIn, Zapier, an API. Handshake integrates with your file system.",
      },
    ],
    weWin: [
      {
        title: "Built for a person, not a funnel",
        body: "Warmth-weighted ties, introduction chains, notes with backlinks – the vocabulary of a life, not a sales process.",
      },
      {
        title: "$0 vs $240+/year",
        body: "folk's entry tier runs $240/year per seat. Handshake is free, open source, unlimited.",
      },
      {
        title: "Your files, your machine",
        body: "No cloud, no account, no per-seat anything. A folder of markdown that's yours forever.",
      },
    ],
    chooseThem: [
      "A team shares the contact base and works a pipeline together",
      "You send sequenced outreach and mail merges",
      "You need Gmail/LinkedIn integrations and an API",
    ],
    chooseUs: [
      "It's your personal network, not a team funnel",
      "You want free and private over integrated and shared",
      "You want to see the map of who-knows-whom",
    ],
    faqs: [
      {
        q: "Is folk a personal CRM?",
        a: "folk markets to individuals occasionally, but it's built and priced for teams – shared workspaces, pipelines, and per-seat plans from $20/user/month. For a personal network, a purpose-built tool fits better.",
      },
      {
        q: "What's a free folk alternative for individuals?",
        a: "Handshake – free, open source, local-first, and designed specifically for mapping your own network rather than running team outreach.",
      },
    ],
  },
  {
    slug: "covve",
    name: "Covve",
    short: "Covve",
    metaTitle: "Covve alternative – Handshake, a desktop personal CRM in plain files",
    metaDesc:
      "Covve is a mobile-only personal CRM with reminders and a card scanner (Pro $12.99/mo). Handshake is its desktop mirror: free, open source, offline, plain markdown files. An honest comparison.",
    h1: "Handshake vs Covve",
    intro:
      "Covve is a mobile-first personal CRM for iOS and Android – it syncs your phone contacts and layers on reminders, news alerts about your contacts, and a business-card scanner, with a Pro plan at $12.99/month (July 2026). Handshake is the desktop mirror image: free, open source, offline, and file-based.",
    paras: [
      "Covve lives where your contacts already are: your phone. Scan a business card at an event, get nudged to follow up, see news mentioning your contacts. For a pocket workflow, it's well made.",
      "Handshake starts from a different question – not 'how do I capture contacts faster?' but 'what does my network actually look like?' That question wants a big screen, a spatial board, and real notes, which is why it's a desktop app with plain files rather than a phone app with a cloud account.",
    ],
    table: [
      row("Price", "Free plan; Pro $12.99/mo (July 2026)", US.price),
      row("Where your data lives", "Their cloud + your phone", US.data),
      row("Platforms", "iOS & Android only", US.platforms),
      row("Works offline", "Partially (mobile app)", US.offline),
      row("Data format", "Proprietary; CSV/Excel export", US.format),
      row("Seeing your network", "Contact list with reminders", US.viz),
      row("Auto-sync / enrichment", "Phone contacts sync, news alerts, card scanner", US.autosync),
      row("Open source", "No", US.openSource),
    ],
    theyWin: [
      {
        title: "It's on your phone",
        body: "Capture in the hallway after the meeting. Handshake is desktop-only during the beta – an honest gap if mobile capture is your core loop.",
      },
      {
        title: "Business-card scanner",
        body: "Event-heavy networkers get cards into contacts in seconds.",
      },
      {
        title: "News alerts",
        body: "Covve surfaces news about your contacts – an easy reason to reach out.",
      },
    ],
    weWin: [
      {
        title: "A map, not a list",
        body: "Covve is a smarter contact list; Handshake is a spatial board of your whole network – ties, warmth, introductions, backlinks between notes.",
      },
      {
        title: "Real notes",
        body: "Full markdown documents per person – highlights, links, structure – versus phone-sized note fields.",
      },
      {
        title: "Ownership",
        body: "Plain files, no account, no subscription, MIT-licensed. Your network isn't hostage to an app store subscription.",
      },
    ],
    chooseThem: [
      "Your workflow is phone-first: events, cards, on-the-go capture",
      "News alerts about contacts would genuinely prompt you to reach out",
    ],
    chooseUs: [
      "You want to sit down and think with your network, not just capture it",
      "Plain files, desktop screen real estate, and $0 forever matter",
    ],
    faqs: [
      {
        q: "Does Handshake have a mobile app?",
        a: "Not during the beta – it's a desktop app for macOS, Windows, and Linux. Because a network is plain files, you can sync the folder (iCloud, Syncthing, etc.) and read your notes anywhere, but the board itself is desktop.",
      },
      {
        q: "Is Covve free?",
        a: "Covve has a free plan; Pro is $12.99/month (July 2026). Handshake is entirely free and open source.",
      },
    ],
  },
  {
    slug: "notion",
    name: "Notion",
    short: "Notion",
    metaTitle: "Notion personal CRM alternative – purpose-built vs DIY",
    metaDesc:
      "Building a personal CRM in Notion? Compare the DIY database approach with Handshake – a purpose-built, local-first network app in plain markdown. Honest trade-offs, both ways.",
    h1: "Handshake vs a Notion personal CRM",
    intro:
      "A Notion personal CRM is a do-it-yourself pattern: a database of people with views, templates, and relations, living in Notion's cloud workspace (free for light personal use; Plus from ~$10/month, July 2026). Handshake is the purpose-built version of the same idea – a local desktop app where the network map, warmth ties, and person notes exist out of the box.",
    paras: [
      "The Notion approach is seductive because you already have Notion, and a template gets you a people table in minutes. For some, that's genuinely enough – especially if your whole life already runs on Notion and one more database keeps everything in one place.",
      "The failure mode is equally well known: DIY CRMs rot. The template needs maintaining, relations get tangled, the 'last contacted' formula breaks, and a table never shows you the actual shape of your network. Handshake's bet is that a tool with opinions – warmth, ties, introductions, a board – survives contact with real life better than a schema you have to be your own admin for.",
    ],
    table: [
      row("Price", "Free for light personal use; Plus ~$10/mo (July 2026)", US.price),
      row("Where your data lives", "Notion's cloud", US.data),
      row("Platforms", "Web, desktop apps, mobile", US.platforms),
      row("Works offline", "Limited offline support", US.offline),
      row("Data format", "Notion blocks; markdown export is lossy for databases", US.format),
      row("Seeing your network", "Tables, boards, galleries – no relationship graph", US.viz),
      row("Auto-sync / enrichment", "None for people (manual, like Handshake)", US.autosync),
      row("Open source", "No", US.openSource),
    ],
    theyWin: [
      {
        title: "One tool for everything",
        body: "If your notes, projects, and journal are already in Notion, a people database keeps life in one place. Handshake is proudly a single-purpose tool.",
      },
      {
        title: "Infinite flexibility",
        body: "Custom properties, formulas, views, rollups – you can model anything. Handshake gives you its model: people, ties, warmth, goals, notes.",
      },
      {
        title: "Everywhere",
        body: "Web and solid mobile apps. Handshake is desktop-only during the beta.",
      },
    ],
    weWin: [
      {
        title: "Works in two minutes, keeps working",
        body: "No template to build, no schema to maintain, no formulas to fix. The tool already knows what a person, a tie, and an introduction are.",
      },
      {
        title: "The graph exists",
        body: "Notion cannot draw your network. Handshake's board shows who connects to whom, how warmly, and who's drifting – the thing a people-table fundamentally can't do.",
      },
      {
        title: "Local, plain, permanent",
        body: "Notion is a cloud workspace with lossy database export. Handshake is markdown on your disk – Obsidian-compatible, greppable, forever.",
      },
    ],
    chooseThem: [
      "Your entire life already runs in Notion and you want one workspace",
      "You enjoy building and maintaining your own systems",
      "You need mobile access to your people notes today",
    ],
    chooseUs: [
      "You want a network tool, not a database hobby",
      "Seeing the map matters – warmth, ties, who-knows-whom",
      "You want your relationship notes in files you own, offline",
    ],
    faqs: [
      {
        q: "Can Notion work as a personal CRM?",
        a: "Yes, as a DIY database – and for light use inside an existing Notion workspace it can be enough. The common failure mode is maintenance: you become the admin of your own CRM schema, and a table never shows the network's shape.",
      },
      {
        q: "Can I export a Notion CRM to Handshake?",
        a: "Notion exports databases to CSV/markdown (with some loss of relations). Handshake's format is plain markdown files with simple frontmatter, so migrating is a matter of reshaping that export – by hand or with a small script.",
      },
    ],
  },
  {
    slug: "spreadsheet",
    name: "a spreadsheet",
    short: "a spreadsheet",
    metaTitle: "Spreadsheet personal CRM vs Handshake – when rows stop working",
    metaDesc:
      "Tracking your network in Google Sheets or Excel? Honest look at when a spreadsheet personal CRM works, when it breaks, and what a purpose-built local-first tool adds.",
    h1: "Handshake vs a spreadsheet",
    intro:
      "The spreadsheet is the world's default personal CRM: a free Google Sheet or Excel file with names, notes, and a 'last contacted' column. Handshake is a free, local-first desktop app that keeps the spreadsheet's virtues – plain, portable, yours – and adds what rows can't do: a visual map of who connects to whom.",
    paras: [
      "Respect where due: a spreadsheet is free, universal, infinitely flexible, and requires zero new tools. For twenty contacts and real discipline, it honestly works – plenty of careful people run their networks from a sheet for years.",
      "It breaks in two places. First, structure: relationships are between people, and rows can't hold them – you can't see that Sarah introduced you to Tom, or that your whole design world hangs off one person. Second, writing: real notes about people don't fit in cells. Handshake keeps the plain-text soul (every person is a markdown file) and adds the graph the grid can't draw.",
    ],
    table: [
      row("Price", "Free (Sheets) or Office license", US.price),
      row("Where your data lives", "Google's cloud, or a local file", US.data),
      row("Platforms", "Everywhere", US.platforms),
      row("Works offline", "Excel yes; Sheets partially", US.offline),
      row("Data format", "Rows and cells – portable but flat", US.format),
      row("Seeing your network", "A grid; relationships are invisible", US.viz),
      row("Auto-sync / enrichment", "None", US.autosync),
      row("Open source", "n/a", US.openSource),
    ],
    theyWin: [
      {
        title: "Zero adoption cost",
        body: "You already have it, you already know it, it opens anywhere. No new tool beats a familiar one you'll actually use.",
      },
      {
        title: "Arbitrary flexibility",
        body: "Sort, filter, pivot, formula – model whatever you want, instantly.",
      },
    ],
    weWin: [
      {
        title: "Relationships exist",
        body: "Ties with warmth, introduction chains, backlinks – first-class objects on a visual board, not a column of initials in a cell.",
      },
      {
        title: "Notes are documents",
        body: "A full markdown page per person – highlights, links, structure – instead of a paragraph crammed into cell H2.",
      },
      {
        title: "Still just files",
        body: "You lose none of the spreadsheet's portability: a Handshake network is a folder of plain text, versioned automatically by a built-in Time Machine.",
      },
    ],
    chooseThem: [
      "Your network is small and a simple list genuinely suffices",
      "You'll be disciplined about updating a sheet (be honest)",
      "You need collaborative editing on the data",
    ],
    chooseUs: [
      "You want to see the network, not scroll it",
      "You write real notes about people",
      "You want plain-text portability with structure on top",
    ],
    faqs: [
      {
        q: "Is a spreadsheet good enough as a personal CRM?",
        a: "For a small network and a disciplined owner – honestly, sometimes yes. It breaks when relationships matter (rows can't hold who-knows-whom) and when notes outgrow cells. That's the point where purpose-built tools earn their keep.",
      },
      {
        q: "Can I import a spreadsheet into Handshake?",
        a: "Handshake stores people as markdown files with simple frontmatter, so a sheet of names and details converts with a small script or by hand. There's no built-in CSV importer yet – it's on the list.",
      },
    ],
  },
];

export function vsBySlug(slug: string): VsData | undefined {
  return VS.find((v) => v.slug === slug);
}
