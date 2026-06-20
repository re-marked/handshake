// Generate a rich, believable demo "network" (a Handshake vault) for screenshots / demos.
// Usage:  node tools/gen-demo-vault.mjs "C:/path/to/output-folder"
// Defaults to a `prop-network` folder on the Desktop. Self = Alex Rivera, founder of "Cadence".
//
// The cast is interconnected (cross-ties, introduced-by chains, [[backlinks]] in notes) and the
// interaction dates span fresh→stale so the board shows warmth, introducer + backlink lines, and
// the staleness fade. Photos are left out — drop face pics into attachments/<id>.jpg (or drag them
// onto cards in the app) and set `photo: attachments/<id>.jpg`.

import { dump } from "js-yaml";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const OUT = process.argv[2] || join(process.env.USERPROFILE || process.env.HOME || ".", "Desktop", "prop-network");

const slug = (s) =>
  s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const canon = (a, b) => [a, b].sort().join("__");

function write(dir, id, fm, body) {
  const yaml = dump(fm, { lineWidth: -1, noRefs: true, quotingType: '"', forceQuotes: false }).trimEnd();
  const text = `---\n${yaml}\n---\n${body ? body.trim() + "\n" : ""}`;
  writeFileSync(join(OUT, dir, `${id}.md`), text, "utf8");
}

// ── the cast ──────────────────────────────────────────────────────────────────
const SELF = {
  name: "Alex Rivera",
  role: "Founder",
  company: "Cadence",
  tags: ["founder"],
  handles: { twitter: "@alexrivera", email: "alex@cadence.dev" },
  body:
    "Building ==Cadence== with [[Sarah Chen]] and [[Tom Okonkwo]]. Mid-raise — [[James Liu]] is leading the seed, [[Priya Nair]] is in. Keep [[Maya Patel]] close for the design hire.",
};

// [id auto from name] name, role, company, tags, handles, created, body (with [[links]] + ==highlights==)
const PEOPLE = [
  { name: "Sarah Chen", role: "Co-founder · Head of Product", company: "Cadence", tags: ["cofounder", "product"], handles: { twitter: "@sarahchen", email: "sarah@cadence.dev" }, created: "2023-02-04",
    body: "The other half of the company. Used to work with [[Maya Patel]] at Figma — she's our top design candidate. ==Decisive==, allergic to meetings." },
  { name: "Tom Okonkwo", role: "Co-founder · CTO", company: "Cadence", tags: ["cofounder", "engineering"], handles: { github: "tomok", email: "tom@cadence.dev" }, created: "2023-02-04",
    body: "Builds the impossible parts. Introduced me to [[Priya Nair]] — they overlapped at Stripe. Knows [[Devon Ross]] from the Vercel days." },
  { name: "Maya Patel", role: "Product Designer", company: "Figma", tags: ["design", "intro-target"], handles: { twitter: "@mayadraws", dribbble: "mayap" }, created: "2024-06-11",
    body: "Dream founding designer. [[Sarah Chen]] vouches hard. Designs alongside [[Yuki Sato]]. ==Closing her is the priority this quarter.==" },
  { name: "Devon Ross", role: "Staff Engineer", company: "Vercel", tags: ["engineering"], handles: { github: "devross", twitter: "@devross" }, created: "2024-01-20",
    body: "Edge + DX wizard. Good sounding board for infra. Close with [[Tom Okonkwo]]." },
  { name: "James Liu", role: "Partner", company: "Base Case Ventures", tags: ["investor"], handles: { twitter: "@jamesliu", email: "james@basecase.vc" }, created: "2024-09-02",
    body: "Leading our seed. Backed [[Naomi Brooks]] and [[Carlos Mendes]] — strong founder references. He intro'd me to [[Grace Okafor]] for hiring." },
  { name: "Priya Nair", role: "Angel investor · ex-Stripe", company: "", tags: ["investor"], handles: { twitter: "@priyanair" }, created: "2024-10-15",
    body: "Writes small, helps big. [[Tom Okonkwo]] knows her well. Payments brain." },
  { name: "Marcus Webb", role: "Partner", company: "Foundry", tags: ["investor"], handles: { email: "marcus@foundry.vc" }, created: "2025-03-01",
    body: "Passed on the pre-seed, circling now. Plays it cool." },
  { name: "Naomi Brooks", role: "Founder", company: "Ledgerline", tags: ["founder", "fintech"], handles: { twitter: "@naomibuilds" }, created: "2024-05-09",
    body: "Fintech founder, [[James Liu]] portfolio. Generous with intros. ==Owes me a coffee.==" },
  { name: "Carlos Mendes", role: "Founder · ex-Airbnb", company: "Nomad", tags: ["founder"], handles: { twitter: "@carlosm" }, created: "2025-01-22",
    body: "[[James Liu]] put us in touch. Marketplace scaling expert." },
  { name: "Aisha Khan", role: "Founder", company: "Vitals", tags: ["founder", "health"], handles: { email: "aisha@vitals.health" }, created: "2025-04-18",
    body: "Health founder, met at a dinner. Worth keeping warm." },
  { name: "Theo Andersson", role: "Writer · The Cold Open", company: "", tags: ["writer"], handles: { twitter: "@theowrites", web: "thecoldopen.xyz" }, created: "2024-08-30",
    body: "Newsletter that actually moves people. Could cover the launch. Likes a good ==scoop==." },
  { name: "Lena Kowalski", role: "Design Lead", company: "Linear", tags: ["design"], handles: { twitter: "@lenak" }, created: "2025-02-11",
    body: "Craft bar is absurdly high. Long shot for a chat about systems." },
  { name: "Hiro Tanaka", role: "iOS Engineer", company: "Square", tags: ["engineering"], handles: { github: "hirot" }, created: "2024-03-05",
    body: "Met at a conference. Mobile, if we ever go native. Gone quiet." },
  { name: "Ben Carter", role: "PM", company: "Notion", tags: ["product", "ex-coworker"], handles: { twitter: "@bencarter" }, created: "2021-07-14",
    body: "Old teammate. Knows [[Rachel Green]] from the same crew. Reliable gut check." },
  { name: "Rachel Green", role: "Engineer", company: "Stripe", tags: ["engineering", "ex-coworker"], handles: { github: "rgreen" }, created: "2021-07-14",
    body: "Ex-coworker via [[Ben Carter]]. Inside line at Stripe if I need one." },
  { name: "Omar Farouk", role: "Advisor · ex-CEO Mapbox", company: "", tags: ["advisor"], handles: { email: "omar@farouk.io" }, created: "2024-11-03",
    body: "Greybeard advisor. Brutally honest. ==Listen when he talks.==" },
  { name: "Yuki Sato", role: "Designer", company: "Airbnb", tags: ["design", "friend"], handles: { twitter: "@yukisato" }, created: "2023-09-19",
    body: "Friend + sanity check on visual decisions. Works near [[Maya Patel]]." },
  { name: "Nadia Hassan", role: "Reporter", company: "TechCrunch", tags: ["press"], handles: { twitter: "@nadiahassan", email: "nadia@techcrunch.com" }, created: "2025-05-27",
    body: "Covers seed-stage dev tools. Embargo-friendly. Handle with care." },
  { name: "Grace Okafor", role: "Recruiter", company: "Greylock", tags: ["recruiting"], handles: { email: "grace@greylock.com" }, created: "2025-03-29",
    body: "[[James Liu]] intro for the eng search. Fast, no-nonsense." },
  { name: "Sam Bauer", role: "Founder", company: "Drift", tags: ["founder", "friend"], handles: { twitter: "@sambauer" }, created: "2023-06-02",
    body: "Founder friend a year ahead of me. The person I text when it's on fire." },
];

const id = (name) => slug(name);

// ── ties ──────────────────────────────────────────────────────────────────────
// [a, b, strength, { via, at, channel, context }]
const SELF_ID = id(SELF.name);
const TIES = [
  ["Sarah Chen", "close", { at: "2023-02" }],
  ["Tom Okonkwo", "close", { at: "2023-02" }],
  ["Maya Patel", "warm", { at: "2024-06", channel: "twitter" }],
  ["Devon Ross", "warm", { at: "2024-01" }],
  ["James Liu", "warm", { via: "Sarah Chen", at: "2024-09", channel: "email", context: "Sarah looped us in on a thread" }],
  ["Priya Nair", "warm", { via: "Tom Okonkwo", at: "2024-10" }],
  ["Marcus Webb", "cold", { at: "2025-03" }],
  ["Naomi Brooks", "warm", { at: "2024-05" }],
  ["Carlos Mendes", "cold", { via: "James Liu", at: "2025-01" }],
  ["Aisha Khan", "cold", { at: "2025-04", channel: "irl", context: "Founder dinner" }],
  ["Theo Andersson", "warm", { at: "2024-08" }],
  ["Lena Kowalski", "cold", { at: "2025-02" }],
  ["Hiro Tanaka", "dormant", { at: "2024-03", channel: "irl" }],
  ["Ben Carter", "dormant", { at: "2021-07" }],
  ["Rachel Green", "dormant", { via: "Ben Carter", at: "2021-07" }],
  ["Omar Farouk", "cold", { at: "2024-11" }],
  ["Yuki Sato", "warm", { at: "2023-09" }],
  ["Nadia Hassan", "cold", { at: "2025-05" }],
  ["Grace Okafor", "cold", { via: "James Liu", at: "2025-03" }],
  ["Sam Bauer", "warm", { at: "2023-06" }],
];
// cross-ties (person↔person) so it's a web, not a star
const CROSS = [
  ["Sarah Chen", "Maya Patel", "warm"],
  ["Tom Okonkwo", "Devon Ross", "warm"],
  ["James Liu", "Carlos Mendes", "warm"],
  ["James Liu", "Naomi Brooks", "warm"],
  ["Maya Patel", "Yuki Sato", "warm"],
  ["Ben Carter", "Rachel Green", "warm"],
];

// ── goals ───────────────────────────────────────────────────────────────────────
const GOALS = [
  { title: "Close the seed round", type: "target", status: "active", deadline: "2026-08-15", suggestedAction: "email", body: "$2.5M led by [[James Liu]]. Term sheet out." },
  { title: "Hire a founding designer", type: "target", status: "open", target: "Maya Patel", suggestedAction: "dm", body: "Top of list: [[Maya Patel]]." },
  { title: "Get covered at launch", type: "target", status: "open", target: "Nadia Hassan", suggestedAction: "email", body: "[[Theo Andersson]]'s newsletter + [[Nadia Hassan]] at TechCrunch." },
];

// ── interactions (date drives the staleness fade) ────────────────────────────────
const INT = [
  ["2026-06-18", "dm", "twitter", "Sarah Chen", "Synced on the launch plan."],
  ["2026-06-15", "call", "zoom", "Tom Okonkwo", "Arch review — the sync engine holds."],
  ["2026-06-12", "email", "email", "James Liu", "Term sheet redlines."],
  ["2026-06-10", "irl", "irl", "Maya Patel", "Coffee. She's leaning yes."],
  ["2026-06-05", "dm", "twitter", "Naomi Brooks", "She'll intro me to two more angels."],
  ["2026-05-28", "thread", "twitter", "Devon Ross", "Argued about edge caching, as usual."],
  ["2026-05-12", "email", "email", "Priya Nair", "She's in for $50k."],
  ["2026-04-30", "dm", "twitter", "Sam Bauer", "Vented about the raise. He gets it."],
  ["2025-11-10", "dm", "twitter", "Hiro Tanaka", "Checked in. No reply since."],
  ["2025-08-15", "email", "email", "Ben Carter", "Catch-up that never got a follow-up."],
  ["2024-12-01", "irl", "irl", "Rachel Green", "Holiday party. Ages ago now."],
];

// ── write it all ─────────────────────────────────────────────────────────────────
rmSync(OUT, { recursive: true, force: true });
for (const d of ["people", "handshakes", "goals", "interactions", "attachments"]) mkdirSync(join(OUT, d), { recursive: true });

// self
write("people", SELF_ID, { id: SELF_ID, name: SELF.name, isSelf: true, tags: SELF.tags, role: SELF.role, company: SELF.company, handles: SELF.handles }, SELF.body);
// people
for (const p of PEOPLE) {
  const pid = id(p.name);
  const fm = { id: pid, name: p.name, isSelf: false, tags: p.tags };
  if (p.role) fm.role = p.role;
  if (p.company) fm.company = p.company;
  if (p.handles && Object.keys(p.handles).length) fm.handles = p.handles;
  if (p.created) fm.createdAt = p.created;
  write("people", pid, fm, p.body);
}
// handshakes
let hsCount = 0;
function handshake(aName, bName, strength, opts = {}) {
  const a = id(aName);
  const b = id(bName);
  const people = [a, b].sort();
  const fm = { people, strength };
  if (opts.at) fm.establishedAt = opts.at;
  if (opts.via) fm.establishedVia = id(opts.via);
  const origin = {};
  if (opts.channel) origin.channel = opts.channel;
  if (opts.context) origin.context = opts.context;
  if (Object.keys(origin).length) fm.origin = origin;
  write("handshakes", canon(a, b), fm);
  hsCount++;
}
for (const [name, strength, opts] of TIES) handshake(SELF.name, name, strength, opts);
for (const [a, b, strength] of CROSS) handshake(a, b, strength);
// goals
for (const g of GOALS) {
  const gid = slug(g.title);
  const fm = { id: gid, type: g.type, title: g.title };
  if (g.target) fm.target = id(g.target);
  if (g.deadline) fm.deadline = g.deadline;
  fm.status = g.status;
  if (g.suggestedAction) fm.suggestedAction = g.suggestedAction;
  write("goals", gid, fm, g.body);
}
// interactions
for (const [date, type, channel, name, body] of INT) {
  const iid = `${date}-${type}-${id(name)}`;
  write("interactions", iid, { date, type, channel, people: [id(name)] }, body);
}

console.log(`Wrote demo vault → ${OUT}`);
console.log(`  ${PEOPLE.length + 1} people · ${hsCount} handshakes · ${GOALS.length} goals · ${INT.length} interactions`);
