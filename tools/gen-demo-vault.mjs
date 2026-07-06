// Generate a small but RICH demo "network" (a Handshake vault) for screenshots / demos, built
// backwards from a folder of labelled AI faces (no real people). Self = Alex Rivera, founder of
// "Cadence". Each person carries a real photo, a characterful note with [[backlinks]] + ==highlights==,
// tags, ties of varying warmth, introducer chains, fresh→stale interactions, and goals.
//
// Usage:  node tools/gen-demo-vault.mjs "C:/path/to/output" "C:/path/to/faces"

import { dump } from "js-yaml";
import { mkdirSync, writeFileSync, rmSync, copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DESKTOP = join(process.env.USERPROFILE || process.env.HOME || ".", "Desktop");
const OUT = process.argv[2] || join(DESKTOP, "demo-network");
const FACES = process.argv[3] || join(DESKTOP, "зущзду");

const slug = (s) =>
  s.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const canon = (a, b) => [a, b].sort().join("__");
const id = (name) => slug(name);

function write(dir, name, fm, body) {
  const yaml = dump(fm, { lineWidth: -1, noRefs: true, quotingType: '"', forceQuotes: false }).trimEnd();
  writeFileSync(join(OUT, dir, `${name}.md`), `---\n${yaml}\n---\n${body ? body.trim() + "\n" : ""}`, "utf8");
}

// ── self ─────────────────────────────────────────────────────────────────────
const SELF = {
  name: "Alex Rivera",
  role: "Founder",
  company: "Cadence",
  tags: ["founder"],
  handles: { twitter: "@alexrivera", email: "alex@cadence.dev" },
  body:
    "Building ==Cadence== with [[Elena Hart]] and [[Kevin Zhao]]. Mid-raise — [[Chip Sterling]] is leading, [[Maggie Doyle]] circling as an advisor. The one hire that matters right now is [[Maria Santos]].",
};

// ── the cast (built from the faces) ───────────────────────────────────────────
// img = source filename in FACES/ ; copied to attachments/<id>.png and referenced as photo.
const PEOPLE = [
  { img: "mature_founder_vibes_white_woman.png", name: "Elena Hart", role: "Co-founder & CEO", company: "Cadence",
    tags: ["cofounder", "ceo"], handles: { twitter: "@elenahart", email: "elena@cadence.dev" }, created: "2023-02-04",
    body: "The CEO, and the reason this works. We split it clean — she runs the room and go-to-market, I run product + eng with [[Kevin Zhao]]. Her old boss [[Maggie Doyle]] is circling as an advisor. ==Trust her read on people completely.==" },
  { img: "young_asian_guy.png", name: "Kevin Zhao", role: "Founding Engineer", company: "Cadence",
    tags: ["cofounder", "engineering"], handles: { github: "kevzhao", twitter: "@kevbuilds" }, created: "2023-03-10",
    body: "Employee #1 — basically a third founder. Built the sync engine over a single weekend. Knows [[Andre Mensah]] from their bootcamp cohort. ==Do not let him get poached.==" },
  { img: "young_philipino_girl.png", name: "Maria Santos", role: "Product Designer", company: "Figma",
    tags: ["design", "intro-target"], handles: { twitter: "@mariadraws", dribbble: "msantos" }, created: "2024-05-21",
    body: "Top of the list for founding designer — sharp, fast, opinionated in the good way. Worked on design systems with [[Robin Ek]] at Figma. ==Closing her is the Q3 priority.== [[Elena Hart]] is selling hard." },
  { img: "mature_black_guys.png", name: "Andre Mensah", role: "Founder", company: "Relay",
    tags: ["founder", "friend"], handles: { twitter: "@andrebuilds", email: "andre@relay.so" }, created: "2024-01-18",
    body: "A year ahead of us, building Relay. Generous with intros — put us in front of [[Chip Sterling]]. The person I call when something's on fire. Goes back with [[Kevin Zhao]]." },
  { img: "mature_goofy_looking_investor_in_sunglaasses.png", name: "Chip Sterling", role: "General Partner", company: "Apex Capital",
    tags: ["investor"], handles: { twitter: "@chipsterling", email: "chip@apex.vc" }, created: "2024-11-03",
    body: "Leading the seed. Loud, flashy, wears the sunglasses indoors — but the check is real and he opens doors. Backed [[Andre Mensah]] at Relay. [[Elena Hart]] manages him better than I do. ==Term sheet is out — close by August.==" },
  { img: "mature_white_woman.png", name: "Maggie Doyle", role: "Operating Partner", company: "Threadline",
    tags: ["advisor"], handles: { email: "maggie@threadline.co" }, created: "2025-01-15",
    body: "[[Elena Hart]]'s former boss, now an operating partner. Quiet, takes notes, says the one thing that actually matters. Came in through [[Chip Sterling]]. ==Want her formally advising before the round closes.==" },
  { img: "young_white_guy.png", name: "Tyler Brooks", role: "Founder", company: "Drift",
    tags: ["founder", "friend"], handles: { twitter: "@tylerbrooks" }, created: "2023-06-02",
    body: "Founder friend from the early days, building Drift. We trade war stories every couple of weeks. Not in the company, but in the trenches right alongside it." },
  { img: "androgynous_white_guy.png", name: "Robin Ek", role: "Design Lead", company: "Linear",
    tags: ["design"], handles: { twitter: "@robinek" }, created: "2025-02-09",
    body: "Craft bar set absurdly high. A long shot, but a conversation about design systems could pay off. Worked alongside [[Maria Santos]] at Figma. ==Watch their portfolio.==" },
];

// ── ties ───────────────────────────────────────────────────────────────────────
// [name, strength, { via, at, channel, context }]
const TIES = [
  ["Elena Hart", "close", { at: "2023-02" }],
  ["Kevin Zhao", "close", { via: "Elena Hart", at: "2023-03" }],
  ["Maria Santos", "warm", { at: "2024-05", channel: "twitter" }],
  ["Andre Mensah", "warm", { at: "2024-01" }],
  ["Chip Sterling", "warm", { via: "Andre Mensah", at: "2024-11", channel: "email", context: "Andre made the intro" }],
  ["Maggie Doyle", "warm", { via: "Chip Sterling", at: "2025-01" }],
  ["Tyler Brooks", "warm", { at: "2023-06" }],
  ["Robin Ek", "cold", { at: "2025-02" }],
];
const CROSS = [
  ["Elena Hart", "Maggie Doyle", "warm"],
  ["Kevin Zhao", "Andre Mensah", "warm"],
  ["Maria Santos", "Robin Ek", "warm"],
  ["Chip Sterling", "Andre Mensah", "warm"],
];

// ── goals + interactions ─────────────────────────────────────────────────────────
const GOALS = [
  { title: "Close the seed round", type: "target", status: "active", deadline: "2026-08-15", suggestedAction: "email", body: "$3M led by [[Chip Sterling]]. Term sheet out, redlines pending." },
  { title: "Hire Maria as founding designer", type: "target", status: "open", target: "Maria Santos", suggestedAction: "dm", body: "She's 80% there. [[Elena Hart]] is closing." },
  { title: "Lock Maggie as advisor", type: "target", status: "open", target: "Maggie Doyle", suggestedAction: "email", body: "Before the round closes." },
];
const INT = [
  ["2026-06-19", "call", "zoom", "Elena Hart", "Weekly sync — board deck for the raise."],
  ["2026-06-17", "dm", "twitter", "Kevin Zhao", "Shipped the migration. Zero downtime."],
  ["2026-06-14", "email", "email", "Chip Sterling", "Term sheet redlines."],
  ["2026-06-11", "irl", "irl", "Maria Santos", "Coffee — she's 80% there."],
  ["2026-06-02", "dm", "twitter", "Andre Mensah", "He'll intro two more angels."],
  ["2026-05-20", "dm", "twitter", "Tyler Brooks", "Vented about the raise. He gets it."],
  ["2026-04-15", "email", "email", "Maggie Doyle", "Sent her the deck. Awaiting thoughts."],
  ["2025-12-10", "dm", "twitter", "Robin Ek", "Cold outreach. Slow reply."],
];

// ── write it all ─────────────────────────────────────────────────────────────────
rmSync(OUT, { recursive: true, force: true });
for (const d of ["people", "handshakes", "goals", "interactions", "attachments"]) mkdirSync(join(OUT, d), { recursive: true });

// self (no photo — the rose self-card represents you)
write("people", id(SELF.name), { id: id(SELF.name), name: SELF.name, isSelf: true, tags: SELF.tags, role: SELF.role, company: SELF.company, handles: SELF.handles }, SELF.body);

let photos = 0;
for (const p of PEOPLE) {
  const pid = id(p.name);
  const fm = { id: pid, name: p.name, isSelf: false, tags: p.tags };
  const srcImg = join(FACES, p.img);
  if (existsSync(srcImg)) {
    copyFileSync(srcImg, join(OUT, "attachments", `${pid}.png`));
    fm.photo = `attachments/${pid}.png`;
    photos++;
  }
  if (p.role) fm.role = p.role;
  if (p.company) fm.company = p.company;
  if (p.handles && Object.keys(p.handles).length) fm.handles = p.handles;
  if (p.created) fm.createdAt = p.created;
  write("people", pid, fm, p.body);
}

let hs = 0;
function handshake(aName, bName, strength, opts = {}) {
  const a = id(aName), b = id(bName);
  const fm = { people: [a, b].sort(), strength };
  if (opts.at) fm.establishedAt = opts.at;
  if (opts.via) fm.establishedVia = id(opts.via);
  const origin = {};
  if (opts.channel) origin.channel = opts.channel;
  if (opts.context) origin.context = opts.context;
  if (Object.keys(origin).length) fm.origin = origin;
  write("handshakes", canon(a, b), fm);
  hs++;
}
for (const [name, strength, opts] of TIES) handshake(SELF.name, name, strength, opts);
for (const [a, b, strength] of CROSS) handshake(a, b, strength);

for (const g of GOALS) {
  const gid = slug(g.title);
  const fm = { id: gid, type: g.type, title: g.title };
  if (g.target) fm.target = id(g.target);
  if (g.deadline) fm.deadline = g.deadline;
  fm.status = g.status;
  if (g.suggestedAction) fm.suggestedAction = g.suggestedAction;
  write("goals", gid, fm, g.body);
}
for (const [date, type, channel, name, body] of INT) {
  write("interactions", `${date}-${type}-${id(name)}`, { date, type, channel, people: [id(name)] }, body);
}

console.log(`Wrote demo vault → ${OUT}`);
console.log(`  ${PEOPLE.length + 1} people (${photos} with photos) · ${hs} handshakes · ${GOALS.length} goals · ${INT.length} interactions`);
