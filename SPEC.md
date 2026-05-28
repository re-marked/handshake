# Handshake — v0.1 Spec

> **Companion doc:** [UX.md](./UX.md) — the aesthetic & UX north star, **co-equal with
> this file.** SPEC.md says what Handshake *does*; UX.md says what it *feels like*. Read
> both. Where this spec touches the look (the Board, the cards, the yarn), UX.md is
> authoritative on how it should feel.

A personal crime-board for the people in your online orbit.

## FOR

Mark. v0.1, summer build. Single-user, single-device, local-first. The goal is to use
it yourself for one summer of network-building, not to ship a product.

**The reframe.** Handshake is **an aesthetic game more than a production tool, while
remaining genuinely both.** The corkboard is a small world you want to live in; the CRM
is the substance underneath that makes living in it worthwhile. A beautiful board you
open every day is the entire mechanism by which the tool succeeds — so the "feel" work
in UX.md is not polish layered onto a CRM, it is the load-bearing half of the product.
If a tradeoff ever pits "more correct database" against "more alive board," lean toward
the board, because the board is what keeps you logging, and logging is what makes the
database worth having.

> **A note on these refinements.** This spec integrates a design review of the initial
> draft. Where a decision changed from that draft, it's flagged inline with a
> *↳ refined:* note that preserves the reasoning, so nothing is silently overwritten.

## ORIENTATION

Online-first by design. The people in your orbit mostly live in DMs, email threads,
Zoom calls, Twitter replies, and Discord channels — not coffee shops. The schema,
vocabulary, and suggested actions are tuned for that reality. IRL works too; it's just a
special case of a more general model.

### The one-line pitch

A desktop app that turns your online relationships into an investigation board you can
actually think with — avatar cards of everyone you talk to across DMs, email, and Zoom,
channel icons showing where each relationship lives, red yarn between them, sticky-note
goals pinned to the corner, and a path-finder that tells you who to ask for an intro.

### The product in three sentences

- **Capture** — a global hotkey opens a quick-add bar. You type a sentence about who you
  talked to. Done in five seconds.
- **See** — the crime-board view shows everyone as a polaroid card with a face, pinned
  to a corkboard, connected by yarn. You can drag cards anywhere; clusters mean what you
  want them to mean.
- **Act** — pin a sticky-note goal ("meet someone at Stripe"). The app traces a
  yarn-path through people you know to people they know, and drafts the intro ask.

## Design principles

### 1. Online relationships are the default

The world you actually live in is DMs, email threads, Zoom calls, Twitter replies, and
Discord channels. Coffee meetings are the rare special case. Therefore: every person is
a bundle of online handles before they're anything else; every interaction has a
channel; the suggested next actions are usually digital ("reply to their post," "DM
them," "send the cold email"), not "schedule coffee." IRL still works — it's just one
channel among many.

**Important non-goal:** this app does not automatically scrape your DMs, inbox, or
calendar. That's a different product with much harder privacy implications and it's the
trap that killed a bunch of "AI for your relationships" startups. Capture stays manual
in v0.1. The app is just aware the world is mostly online and tunes its vocabulary
accordingly.

### 2. The file system is the database

Every person, handshake, goal, and interaction is a markdown file with YAML
frontmatter, stored in a folder you choose. The app reads them at startup, watches for
changes, and writes back on edit. No SQLite, no proprietary format. If Handshake the app
dies tomorrow, you have a folder of plain text files you can open in any editor.

This is the Obsidian philosophy taken seriously: structure where it helps querying,
prose where it helps thinking. Bonus — your entire database is `git init`-able for
versioning, and iCloud/Dropbox/OneDrive sync becomes free.

> *↳ refined: keep machine-churned data out of the prose files.* Volatile UI state —
> board positions and viewport — does **not** live in each person's frontmatter; it
> lives in an app-owned sidecar, `.handshake/layout.json` (see Storage). Two reasons:
> (1) YAML round-tripping is lossy — re-serializing frontmatter reorders keys and strips
> comments, which would clobber your hand-edits and break the "open it in any editor"
> promise; (2) board position is the highest-frequency write (every drag), so keeping it
> out of the prose files means clean git history and no write/watch feedback loop on the
> hot path. Card rotation isn't stored at all — it's derived deterministically from the
> person's id.

### 3. Capture must take five seconds or it dies

The single biggest reason personal CRMs fail is that logging is a tax. If the capture
flow takes more than five seconds, you will stop using it by week two. Therefore: global
hotkey from anywhere, single-line input, AI parses the structure out of natural
language. Everything else in the app is downstream of this working.

### 4. Obsidian for the chrome, crime-board for the canvas

Two aesthetics in productive tension. The graph view is a tactile corkboard — polaroid
cards with photos, fibrous red yarn, brass thumbtacks, aged-paper texture, handwritten
margin notes. The rest of the app — sidebar, editor, settings, quick-add bar — is
restrained, dark-mode-friendly, monospace-adjacent. Each aesthetic does what it's best
at. **(UX.md is the full treatment of this — the dark chrome exists to make the warm
board glow.)**

### 5. AI earns its keep or it doesn't ship

AI exists in v0.1 only where it saves real time on a high-frequency action. That means:
parsing quick-capture text into structured data (including channel inference — "dm'd
james" vs "emailed james" vs "replied to james") and drafting intro requests. It does
not mean a chatbot, a weekly summary, or an "insights" dashboard. If a feature would
exist whether or not AI were trendy, keep it. Otherwise, kill it.

## Data model

Four entities, all stored as markdown + YAML. The folder structure makes the schema
legible at a glance.

```
~/handshake-vault/
├── people/
│   ├── self.md
│   ├── sarah-chen.md
│   └── tom-okonkwo.md
├── handshakes/
│   └── sarah-chen__tom-okonkwo.md
├── goals/
│   └── meet-naval.md
├── interactions/
│   └── 2026-05-26-coffee-sarah.md
├── attachments/
│   └── sarah-chen.jpg
└── .handshake/
    └── layout.json        # board positions + viewport — app-owned, not hand-edited
```

### Person

One file per person. Filename is the slug; the rest is in frontmatter. The body is a
free-form markdown scratchpad — whatever you'd write in a notebook about them. The
handles block is central — online identities are who someone is for the purposes of this
app, more so than their company or role.

```yaml
---
id: sarah-chen
name: Sarah Chen
isSelf: false
photo: attachments/sarah-chen.jpg
tags: [founder, sf, linear]
role: Head of Growth
company: Linear
handles:
  twitter: "@sarahchen"
  linkedin: sarahchen
  email: sarah@linear.app
  telegram: "@schen"
  github: sarahchen
primaryChannel: twitter           # where the relationship mostly lives
howWeMet: replied to her thread on retention loops, May 2025
howWeMetUrl: https://x.com/sarahchen/status/1234567890
createdAt: 2026-03-12
---
Sharp on growth loops. Mentioned in DMs she's hiring a lifecycle PM Q3.
Mostly a Twitter relationship — replies → DMs → one Zoom so far.
```

> *↳ refined: `boardPosition` removed from frontmatter.* The card's position on the board
> lives in `.handshake/layout.json`, keyed by id (see principle #2 and Storage). The
> person file holds only durable, human-authored facts.

### Handshake

An undirected edge between two people. Filename is the two slugs joined alphabetically,
so the relationship has one canonical file. Introductions, jointly-attended events, and
other directional facts live in the interactions log, not on the edge. The origin block
captures where the relationship was born — for online relationships, often a specific
tweet or thread you can link back to.

```yaml
---
people: [sarah-chen, tom-okonkwo]
strength: warm                    # close | warm | cold | dormant
establishedAt: 2025-08
establishedVia: tom-okonkwo       # if one introduced the other
origin:
  channel: twitter
  artifact: https://x.com/tom-okonkwo/status/1234
  context: tom @-mentioned us both in a thread about retention
---
Tom intro'd us in a Twitter thread. They go back to YC W22.
```

### Goal

A sticky note pinned to the board. Two flavors share one schema:

- **Target** — a specific person you want to reach. Pathfinding applies directly.
- **Class** — a criterion ("3 seed VCs by August"). Essentially a saved search over
  tagged people.

```yaml
---
id: meet-naval
type: target                      # target | class
title: Get on Naval's radar
target: naval-ravikant            # for type=target
criteria:                         # for type=class
  tags: [vc, seed]
  count: 3
deadline: 2026-08-31
status: open                      # open | active | done | abandoned
suggestedAction: reply            # reply | dm | email | post | irl
---
Why: he angel-invests in tools-for-thought stuff. Want to pitch hiremeplz.
Path so far: nothing direct. Closest is Sarah → mutual followers.
```

> *↳ refined: `notePosition` removed from frontmatter.* The sticky's position lives in
> `.handshake/layout.json` with everything else on the board. Its color is fixed by the
> aesthetic grammar (goals are Post-it yellow — see UX.md §3), so it isn't a per-goal
> field.

### Interaction

An append-only log entry. Date-prefixed filenames sort chronologically in the
filesystem, which is convenient when you're poking at the vault in a file browser. The
expanded type vocabulary reflects the online-first stance — `reply` and `thread` are
first-class because online relationships often build through dozens of micro-interactions,
not a few big ones.

Type vocabulary: `dm`, `email`, `call`, `thread` (public back-and-forth), `reply` (you
replied to their post), `mention`, `intro`, `irl`, `note` (you thought of them; not
strictly an interaction but worth logging).

```yaml
---
date: 2026-05-26
type: dm
channel: twitter                  # twitter | linkedin | email | telegram | discord | zoom | irl | ...
people: [sarah-chen]
---
DM'd back-and-forth about Linear's growth stack. She's open to a Zoom
next week — said she'd intro me to their head of growth if it goes well.
```

Lightweight interactions (replies, mentions) should be effortless to log — they're the
bulk of online relationship-building, and if logging one is more work than the
interaction itself, you'll skip it. The quick-add parser is what makes this realistic.

> *↳ refined: staleness is a first-class, ambient signal.* The most recent interaction
> date per person drives the **photo-fade** on the board (UX.md §7): neglected
> relationships desaturate toward sepia, recent ones stay vivid. So the interaction log
> isn't just a record — it's what keeps the board honest about who you've gone quiet on.
> This is closer to the daily habit than pathfinding is (see Build plan).

## The three views

### 1. The Board

The main canvas. A pannable, zoomable corkboard with polaroid cards for every person,
connected by yarn. You as the central node, larger than the others, with a slightly
different card style (thicker frame, brass corner). **UX.md is the authoritative
treatment of the board's look and feel; the below is the functional contract.**

Visual language:

- **Cards** — polaroid-style, ~140×180px. Avatar/photo on top, name in a slightly
  handwritten serif underneath, one tag below the name. A small colored tape strip in
  the corner indicates warmth (red = close, orange = warm, beige = cold, faded grey =
  dormant).
- **Channel icons** — a small row of favicon-sized icons beneath the name showing where
  the relationship lives (Twitter, LinkedIn, email, Telegram, Discord, GitHub, Zoom).
  The primary channel is slightly larger/colored. Click an icon to open that
  profile/conversation in the browser.
- **Yarn** — slight curve, fibrous texture, ~2px stroke. Red for active handshakes,
  faded for dormant. When pathfinding, the relevant yarn lights up and pulses. *↳ refined:
  the yarn is computed vector (SVG), not a sprite — it sags (catenary) and animates;
  prototype it standalone first, it's the make-or-break element (UX.md §6).*
- **Pins** — small brass thumbtack at the top of each card. Decorative, but clickable to
  "unpin" (archive) a card.
- **Background** — subtle cork or aged-paper texture. Not kitschy. Think aged manila
  folder, not clip-art bulletin board.
- **Goal stickies** — yellow Post-its pinned to the corners. Yarn runs from the sticky
  to the target person if one exists.
- **Origin tags** — for relationships born online, a tiny URL chip pinned next to the
  card showing the originating thread/tweet. Optional, but lovely when present.

Interactions:

- Drag cards anywhere. *↳ refined: positions persist to `.handshake/layout.json`
  (debounced), not to per-person frontmatter.*
- Click a card → opens the person's full file in the side panel for editing.
- Double-click empty board → add a new person.
- Drag yarn from one card to another → creates a handshake.
- Right-click a card → "find path to…" / "log interaction" / "archive".
- *↳ added: `Cmd/Ctrl-K` quick-jump* — fuzzy-find to any person and fly the board to
  their card. Spatial memory degrades past ~50 people; you'll want this constantly.

### 2. Quick-add bar

The most-used surface in the app. Triggered by a global hotkey. A small input window
pops up over whatever you're doing. You type a sentence. Enter. Window closes. You're
back in your previous app.

> *↳ refined: hotkey + commit flow.* The draft's `⌘Space` default collides with Spotlight
> and assumes macOS; on Windows the default is a Windows chord (e.g. `Ctrl+Shift+Space`),
> configurable in settings. And the commit flow is **optimistic with confidence-gating,
> not always-preview:** on a confident parse it commits immediately and flashes a
> one-line undo toast (`logged dm w/ sarah · Ctrl-Z`) — the common case is genuinely
> five seconds, one keystroke. Only an *ambiguous* parse (new person, needs a URL,
> multiple people, low confidence) shows the one-line preview before committing. And
> capture must **degrade offline** — if the API is unreachable, file the raw sentence as
> an unparsed stub to resolve later, never block. The habit is the whole game; protect
> it.

Behind the scenes, the AI parser turns your sentence into structured changes: new
person, new handshake, new interaction, or some combination.

Example inputs and what they create:

```
> dm'd sarah chen about linear's growth stack, she's keen on a zoom
→ interaction(dm, channel=twitter, sarah-chen)
→ suggests bumping sarah.strength: warm → close (next: schedule zoom)

> replied to anya gupta's tweet about AI journalism
→ if anya doesn't exist, new person anya-gupta
  (parser asks: paste her twitter URL? auto-fills handle, name, photo)
→ interaction(reply, channel=twitter, anya-gupta)
→ handshake created at strength=cold

> tom intro'd me to james liu in a group dm, he's a seed VC at base case
→ new person james-liu (tags: vc, seed, base-case)
→ handshake me ↔ james-liu, established via tom-okonkwo
→ interaction(intro, channel=twitter, [james-liu, tom-okonkwo])

> zoom with sarah went great, she'll intro me to head of growth
→ interaction(call, channel=zoom, sarah-chen)
→ suggests creating a goal: "intro from sarah → linear head of growth"
```

### 3. The Editor

A side panel (or full-screen toggle) for editing the markdown of any entity. Live
preview of frontmatter as form fields, body as a normal markdown editor. Standard fare —
but worth getting right, because this is where you'll do deeper thinking about specific
people.

### Bonus surface: paste-a-URL-to-create-person

A small but high-leverage feature for online-first onboarding. Paste a Twitter,
LinkedIn, or GitHub URL into the quick-add bar (or onto an empty spot on the board) and
the app fetches public profile data — name, handle, bio, avatar — and creates a person
stub. Beats typing the same fields by hand for every new contact.

For v0.1, keep this minimal: Twitter and LinkedIn only, public profiles only, fail
gracefully if the page won't load (just create an empty person with the URL stored). No
auth, no scraping, no rate-limit dancing. If it gets flaky, the manual flow always
works.

## Pathfinding — the magic moment

This is the feature that justifies the whole product. Without it, you have a pretty
contact app. With it, you have a tool that actively helps you open doors.

### The flow

- You pin a target goal: "Meet Naval Ravikant."
- If Naval already exists in your graph → show his card, his last-contacted date, and a
  suggested next interaction. Done.
- If not → BFS from you outward through the handshake graph, looking for anyone whose
  tags, notes, or links plausibly indicate they know Naval. (v0.1: only exact
  references. v0.2: fuzzy/LLM inference.)
- Render the shortest path on the board with the relevant yarn lit up and pulsing red.
- Offer to draft the intro request to the first hop.

### Why BFS is enough for v0.1

Your graph will have maybe 50–300 nodes by end of summer. BFS on that is instant. You
don't need anything fancier than a textbook adjacency-list traversal. Premature
optimization here would be embarrassing.

### The intro draft

Once a path is found, one button — "Draft the ask" — generates a short, copy-pasteable
message to the first-hop person. The LLM gets: your goal, the target, the first-hop
person's profile, your recent interactions with them, and the channel the relationship
lives on. The draft is channel-appropriate — a Twitter DM ask reads differently than an
email ask, which reads differently than a Slack DM. Output is a draft message; you edit
and send manually. The app never sends anything itself.

## Tech stack

### Desktop shell

**Tauri 2.** Native webview instead of bundling Chromium. ~10MB binary instead of
~150MB. Rust backend, so file watching, global hotkeys, and system tray are all
first-class. The smaller bundle and faster startup matter for a tool you want to reach
for daily.

> *↳ refined: this is the Windows incarnation, and Tauri has no Node runtime.* Two
> consequences the draft glossed:
> - **The webview is WebView2 (Chromium/Edge engine)** on Windows — so modern CSS
>   (filters, blend modes, backdrop) all Just Work, which the texture-and-lighting look
>   leans on heavily. (The draft was quietly macOS-flavored: `⌘Space`, iCloud, `.app`
>   icon. Those become a Windows hotkey, OneDrive/Dropbox/git sync, and a `.exe`/MSI.)
> - **There is no Node runtime in the webview**, so any Node library that assumes one
>   won't run there. This reshapes Storage below.

### Frontend

- **React + TypeScript** — obviously.
- **Vite** — Tauri 2's default; instant HMR.
- **Tailwind + shadcn/ui** — for the chrome: sidebar, editor, settings, quick-add. Dark,
  restrained, Obsidian-flavored. The chrome is entirely DOM.
- **React Three Fiber (`@react-three/fiber`)** — the React reconciler for Three.js. The
  board is a WebGL scene, not a DOM canvas. Cards, pins, string, stickies, cork, and
  frame are all Three.js geometry with PBR materials, lit by a single `SpotLight`.
- **`@react-three/drei`** — scene helpers: `<Html>` for DOM overlays tracked to 3D card
  positions (name/tags/icons), `OrthographicCamera`, `useTexture` with Suspense, and
  raycasting utilities for click/drag interaction.
- **`@react-three/postprocessing`** — film grain pass + vignette over the rendered frame.
  The grain layer is what makes the scene read as one photographed surface.
- react-flow is **not used** — pan/zoom is camera movement; nodes are Three.js meshes;
  edges are `TubeGeometry`. R3F replaces react-flow's entire function, more cleanly.

> *Full rendering model in UX.md §5. The board is geometrically simple (a flat surface
> with objects on it) — full PBR realism without scene complexity.*

### Storage

- Markdown files with YAML frontmatter on disk. No database.
- **gray-matter** for parsing frontmatter — pure JS, runs fine in the webview.
- **In-memory index rebuilt at startup.** At 500 people this is <50ms — well within
  budget for a desktop cold start. This index is the thing you actually query (board,
  BFS); the markdown is the persistence + thinking layer.

> *↳ refined: file IO and watching cross into Rust; chokidar is out.* `chokidar` is a
> Node library and there's no Node runtime in a Tauri webview, so it can't do the
> watching. File watching is **Rust-side** (the `notify` crate, via Tauri, emitting
> change events to the frontend). The recommended split is **thin-Rust / fat-TS:** Rust
> does exactly four things — read a dir and return contents, write a file atomically,
> watch the dir and emit events, register the global hotkey + tray. *Everything else* —
> schema, parsing, the index, serialization — stays in TS, where the domain lives in one
> language and iterates fastest.
>
> Two gotchas to handle from day one:
> - **Watcher feedback loop.** App writes a file → watcher fires → app reloads → can
>   loop. Suppress self-writes: track the hash/mtime of what you just wrote and ignore
>   the next event for it.
> - **Lossy YAML round-trip.** Re-serializing frontmatter reorders keys and strips
>   comments. Write surgically where you can; and note this is *why* volatile state
>   (positions/viewport) lives in `.handshake/layout.json` rather than the prose files —
>   it removes the highest-frequency writes from the files you hand-edit.

### AI

**Anthropic API.** Claude Haiku 4.5 (`claude-haiku-4-5`) for the quick-capture parser
(fast, cheap, more than capable). Sonnet 4.6 (`claude-sonnet-4-6`) for intro drafting
(worth the latency for higher-stakes output). API key in local config; your usage, your
bill. No proxy server, no telemetry.

> *↳ refined: route AI calls through Rust, and force structured output for the parser.*
> - **Calls go through a Rust command → Anthropic**, not from the webview. This keeps the
>   key out of the frontend JS context and sidesteps the browser-CORS dance (it's
>   technically possible client-side with `dangerouslyAllowBrowser` + the
>   browser-access header, but routing through Rust is cleaner in an app you fully own,
>   and lets you add retry/caching for free).
> - **The parser uses structured tool-use (a forced JSON-schema tool call)**, not
>   "return JSON in your text." Forcing the tool call is dramatically more reliable for
>   extraction and is exactly what Haiku is good at. Feed it the vault index (names + ids
>   + tags) so it resolves "sarah" → `sarah-chen` and avoids duplicate people; keep a
>   merge/dedupe affordance for when a near-dupe slips through.

### Assets / textures

> *↳ updated: PBR material sets, not flat textures.* Each material (cork, walnut, paper)
> needs a full PBR set: **albedo + normal map + roughness map**. Source from **Poly
> Haven** and **ambientCG** (both CC0 — free, no attribution, high resolution). Tone the
> albedo into the warm-neutral palette before use; use normal and roughness maps as-is.
> The normal maps are what make the SpotLight physically catch the surface grain — the
> key capability that justifies WebGL. Because the board is framed and bounded, the cork
> tiles zero times. See UX.md §5 for the full rendering model.

## What you're explicitly NOT building in v0.1

- Auth, accounts, multi-user anything.
- Cloud sync. (OneDrive/Dropbox/git on the vault folder gives you cross-device for free
  if you ever want it.)
- Mobile app.
- Onboarding flow. You ARE the onboarding flow.
- Sharing or social features. This is a private tool.
- Import from LinkedIn / Gmail / etc. Manual entry first; importers come after you know
  what shape the data wants to be.
- Any kind of "insights" dashboard or analytics view.

## Build plan

Aggressive but realistic for a senior dev who already knows the stack. The point is to
be using it Monday morning.

> *↳ refined: reframe the timeline, and resequence.* Two honest adjustments to the
> "one weekend to done" plan:
>
> 1. **A weekend buys a skeleton you can start logging into — not the felt-right thing.**
>    The aesthetic (UX.md) is its own iterative arc, and the parser only gets good by
>    being used. So the real target is: *by Monday, reach for the hotkey without
>    thinking*, then iterate the look and the parser by living in it over the following
>    weeks.
> 2. **Build the data-generating loop before the data-consuming features.** Pathfinding
>    and the intro-draft are untestable until the graph is populated — BFS through three
>    fake nodes teaches you nothing, and there's nothing real to draft. So build vault +
>    capture + board first, populate it for a week or two with real people, *then* build
>    pathfinding and the intro-draft against a real graph. (Staleness/photo-fade, by
>    contrast, is part of the core daily loop — it ships with the board, not after.)
>
> The day-by-day below is kept as the original ambition; treat the order as
> dependency-guidance, not a deadline.

### Saturday morning — foundations (3–4h)

- `npm create tauri-app@latest` — React + TS + Vite.
- Set up Tailwind, shadcn/ui, `@react-three/fiber`, `@react-three/drei`,
  `@react-three/postprocessing`, Three.js.
- Define the four TypeScript types (Person, Handshake, Goal, Interaction).
- Write the vault reader: scan a folder, parse all frontmatter, build the in-memory
  index. *(Rust reads files; TS parses + indexes.)*
- Write the vault writer: serialize back to markdown + YAML, atomic file replace. *(Rust
  writes atomically; TS owns serialization. Wire self-write suppression now.)*

### Saturday afternoon — the board (4–5h)

- R3F scene: `OrthographicCamera`, `SpotLight` + `PCFSoftShadowMap`, cork `PlaneGeometry`
  with PBR textures (albedo + normal + roughness), walnut frame `BoxGeometry`.
- Polaroid card as thin `PlaneGeometry` + `MeshStandardMaterial` + photo texture.
  Euler rotation from id. Shadow casting. Drei `<Html>` overlay for name/tags.
- Raycasting for click and drag. Drag card → update position in `.handshake/layout.json`
  (debounced). Drag from card → begin drawing a string.
- **Prototype the yarn `TubeGeometry` + catenary standalone first** (UX.md §6) — get it
  to feel like thread before building anything on top of it. This is the make-or-break.
- Photo support (drag-and-drop image onto a card → copies into `attachments/`).
- Paste-a-URL-to-create: detect a Twitter/LinkedIn URL pasted onto the board → fetch
  public profile → create person stub.
- `@react-three/postprocessing`: film grain pass + vignette.

### Sunday morning — capture (3–4h)

- Global hotkey via Tauri (Windows chord, configurable).
- Quick-add window: borderless, centered, single input, escape-to-dismiss.
- Anthropic integration via Rust command, structured tool-use, vault index in the
  prompt. Get back a structured diff to apply.
- Optimistic commit + undo on confident parses; one-line preview on ambiguous ones;
  offline stub fallback.

### Sunday afternoon — goals & pathfinding (3–4h)

*(Per the resequencing note: meaningful only once the board has real people in it —
expect to revisit this after a week of real use.)*

- Sticky-note rendering on the board for goal entities.
- Goal creation flow (right-click empty board → add goal).
- BFS pathfinding from `isSelf` node to target.
- Yarn highlighting on the path.
- "Draft the ask" → Anthropic (Sonnet) → copyable text in a modal.

### Sunday evening — daily-driver polish (1–2h)

- Editor side panel with frontmatter-as-form + markdown body.
- `Cmd/Ctrl-K` quick-jump and keyboard nav between cards.
- App icon, tray icon, login-on-startup.
- Open the vault folder you've been seeding all weekend. Use it for real this week.

### MONDAY MORNING TEST

If on Monday you reach for the hotkey to log the coffee you had Sunday night without
thinking about it, v0.1 worked. If you forget the app exists by Wednesday, the capture
flow isn't fast enough — fix that before adding anything else.

## Risks and how to defuse them

**"I'll stop logging by week 2"** — the single biggest risk. Defense: the five-second
capture flow is non-negotiable. If you find yourself skipping it because it's too slow,
that's the signal to drop everything and fix capture, not to add features. Also: weekly
review ritual on Sunday night — open the board, look at the faces, log anything you
forgot. *(The photo-fade makes the faces you've neglected obvious — let it do the
nudging.)*

**"The crime-board aesthetic is hard to get right"** — true. The line between "tactile
and beautiful" and "kitschy and bad" is thin. Defense: study reference images (real
corkboards, vintage detective film stills, lamplit rooms) before writing CSS. Lean
toward restraint — slightly faded textures, subtle shadows, real-looking paper colors.
UX.md §13 is the anti-kitsch ruleset. If in doubt, less.

**"The AI parser misreads my quick-captures"** — will happen. Defense: the
preview-before-commit step (now confidence-gated). If the diff looks wrong, you cancel
and rephrase. Over time, the parser prompt gets refined with edge cases. Also: keep the
manual edit path always available — you can always just open the file in your editor.

**"I'll over-engineer instead of using it"** — the senior-dev hazard, and a sharper risk
here because the aesthetic is half the point and aesthetics are a bottomless well.
Defense: the Monday-morning test above. The goal is to be using it, not to be building
it. If you've spent four hours tuning yarn curvature *before you have 20 real people on
the board*, you're in the wrong mode. (Tuning yarn curvature once it's a daily driver
is fair game — that's the game.)

## After v0.1 — possible directions

Not commitments. Just things to think about once you've used v0.1 for a few weeks and
know what actually matters.

- **Smarter pathfinding** — LLM-assisted inference: "who in my graph might know Naval,
  based on tags, notes, and public follower-graphs?"
- **Staleness nudges** — a daily or weekly digest of "these warm relationships have gone
  quiet." (The board already shows this via photo-fade; a digest is the push version.)
- **Channel-aware ingestion** — optional, opt-in, scoped: parse a pasted email thread or
  Twitter DM export into interaction stubs you confirm. Never automatic; always
  reviewed.
- **Public follower-graph enrichment** — "Sarah follows Naval" is a meaningful signal
  for pathfinding even before there's a direct handshake. Used carefully.
- **Public-mode fork** — much later, if ever. Different product, probably different name.
- **Mobile companion** — read-only board view + voice-to-quick-capture. Vault syncs via
  the cloud folder.

---

*End of v0.1 spec. Pair with [UX.md](./UX.md).*
