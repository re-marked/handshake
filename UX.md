# Handshake — UX & Aesthetic North Star

This document is co-equal with [SPEC.md](./SPEC.md), not subordinate to it. SPEC.md
says what Handshake *does*; this says what it *feels like*. The two are read together.

> **↳ Full rewrite (2026-05), aesthetic pivot — reasoning preserved, not silently
> overwritten.** The original north star was a photorealistic corkboard: polaroids,
> brass pins, sagging red yarn, lit by one warm lamp, rendered in WebGL/PBR. It was a
> beautiful, specific vision — and it was the project's two biggest risks fused into
> one ("the aesthetic is hard to get right" + "I'll over-engineer instead of using
> it"). A real attempt proved the game-grade realism wasn't reachable in a webview at
> the bar it demanded, and a *half*-real corkboard is worse than none — it lands in the
> exact "stickers on a JPEG" kitsch the old doc warned against. So the direction turns:
> **from a tactile object you dwell in, to a clean instrument you reach for.** The data
> layer never cared — it was built UI-agnostic precisely so this could happen. Nothing
> below depends on WebGL, Three.js, R3F, or PBR; those are retired.

This is the destination, not a build order (see SPEC.md's build plan).

---

## 1. The north star

**Obsidian for your network — a mature Obsidian plugin that grew up into its own app.**

When you open Handshake it should feel like opening Obsidian or Linear: a quiet,
precise, fast, keyboard-driven tool that respects your attention and gets out of your
way. Local files underneath, a clean graph of people on top, everything one keystroke
away. Calm and monochrome, with a single accent doing real work.

**The thesis inverts from the old vision, on purpose.** The corkboard's premise was
"beauty is the retention mechanism — you log because the board is gorgeous." The new
premise is **"frictionlessness is the retention mechanism — you log because it costs
nothing and the result is instantly legible."** That's the proven model: Linear,
Obsidian, and Height are monochrome and restrained, and people open them every day not
because they're pretty objects but because they're *effortless and clear*. The craft is
still load-bearing — a clean tool done carelessly is just bland — but the craft now
lives in speed, density-without-clutter, consistency, and typographic calm, not in
skeuomorphic warmth.

The emotional target: **calm, exact, trustworthy, fast.** Quietly premium.

---

## 2. The identity, and what it implies

"A mature Obsidian plugin gone standalone" is generative — it settles most decisions
before they're asked:

- **A workspace, not a website.** Resizable panes, not pages: a left rail, a center
  pane, a right panel. You arrange your space.
- **The command palette is the spine.** `Ctrl-P` reaches every action; `Ctrl-K`
  jumps to any person. Capture, navigation, and commands are keyboard-first. The mouse
  is for the graph; the keyboard is for everything else.
- **The markdown note is first-class.** Each person is frontmatter (structured) plus a
  free prose body — edited in-app the way you'd edit a note in Obsidian.
- **The graph is the home view.** Your network as a clean force-directed graph is the
  thing you land on, the thing that makes Handshake *Handshake*.
- **Local-first, plain files, yours.** The vault is a folder of markdown you can open in
  Obsidian itself. Handshake is a *lens* on that folder, not a silo.

---

## 3. Monochrome + one accent — the color discipline

The whole look rests on one rule: **a neutral monochrome scale, plus exactly one brand
accent.** This single constraint is what makes it read as crafted rather than busy.

- **The neutral scale — the entire surface.** Backgrounds, panels, borders, text, icons,
  graph nodes and edges at rest: all live on a single near-neutral gray ramp (a hair
  warm, never cold-blue). Dark-first (see below). This is ~95% of every pixel.
- **The accent — `rose`.** One saturated color, used deliberately. **Rose means
  connection, brand, and primary action** — the selected node, a found path, the focused
  control, the one button that matters. Because it's the only saturation on screen, it
  draws the eye exactly where intended.
  - *The shade:* a deep, dusty, magenta-leaning rose — desaturated, never hot-pink,
    never baby-pink. It sits on the red↔magenta border. It lives in a single token
    (`--primary` in the shadcn theme), so the exact value is tuned live against a real
    screen, in one place, app-wide.
  - *Why rose over red:* red is already spoken for in any clean UI — it's the universal
    "destructive / danger" signal. Making red the brand accent means every primary
    button flirts with looking like a delete button. Rose frees the split cleanly:
    **rose = brand + connection, red = danger.** Rose is also simply rarer as a product
    accent, which helps Handshake feel like itself.
- **Functional state colors, used as state, never decoration.** Red for destructive
  confirmation. A muted amber *only* for time pressure (a goal past its deadline). These
  are system signals, sparse and earned — not part of the palette you decorate with.

If a new element wants color, it is rose (and therefore it must mean connection/primary)
or it is neutral. There is no third brand color. (This is the disciplined descendant of
the old "two signal colors" rule — red+yellow collapses to one accent.)

**Dark-first.** The default theme is dark — Obsidian's instinct, and the ground on which
a rose accent looks most precise and premium. A light theme is supported for free
through the same tokens (shadcn/Tailwind), but dark is the face of the product.

---

## 4. The graph — the hero

The connections graph is the centerpiece and the make-or-break element. In the old
vision the warning was "prototype the string first — if it doesn't feel like thread, the
premise wobbles." The clean-era equivalent: **the graph is the new string. Get it
feeling alive — calm, legible, responsive — before any chrome wraps it.**

- **Nodes — people.** A small circular avatar (the photo) or, with no photo, a neutral
  monogram chip with initials. A quiet label beside or below. Clean, uniform, restrained.
- **You — the self node.** Slightly larger, with a rose ring. You are the center of your
  own network, marked by the accent, not by ornament.
- **Edges — handshakes.** Thin neutral lines. Strength is encoded structurally, not
  colorfully: `close` reads as a solid, slightly heavier line; `warm` lighter; `cold`
  thin; `dormant` faint and dashed. No edge is rose at rest — rose is reserved for the
  path moment.
- **Staleness, ambient.** A neglected person's node desaturates and dims (grayscale +
  lowered opacity) the longer it's been since the last interaction; a recently-touched
  one is full-strength. This is the clean descendant of the corkboard's "photo fades to
  sepia" — same honest, guilt-free signal ("who have I gone quiet on?" is *visible*),
  rendered as opacity/desaturation rather than aging. Driven by the engine's
  `lastInteractionDate`.
- **Layout.** Force-directed (d3-force), settling gently into clusters that mean what you
  make them mean. Nodes are draggable; positions persist to `.handshake/layout.json`
  (debounced); pan and zoom are smooth and remembered between sessions.
- **The path moment — the one bit of drama.** When pathfinding finds a route from you to
  a target, the path's edges and nodes saturate to rose and a quick pulse runs you →
  target while the rest of the graph dims; then it relaxes. Brief, cinematic, restrained.
  This is the single place the accent gets to perform.
- **Interactions.** Click a node → the person opens in the detail panel. Hover →
  subtle emphasis on the node and its immediate neighbors. Drag node → node → propose a
  handshake. Right-click → context menu (find path to…, log interaction, archive).
  Double-click empty space → add a person.
- **Rendering.** d3-force for layout; Canvas 2D for the draw (crisp, fast, fine to a few
  hundred nodes — Obsidian's own graph is canvas/WebGL). SVG is viable at small counts if
  it buys easier interactivity; that's a build-time call. No WebGL/PBR — the look is flat,
  clean, and lit by hierarchy, not by a lamp.

---

## 5. The workspace & layout

The Obsidian three-pane model, in clean shadcn surfaces:

- **Left rail** — navigation: the graph, the people list, goals, and search. Collapsible.
  Quiet; it's scaffolding, not content.
- **Center pane** — the subject: the graph (home), or a person's note, or a list/table
  view. This is where you work.
- **Right panel** — the inspector: details and metadata for the current selection
  (a person's handles, warmth, last-touched, recent interactions). Collapsible.

Panes are resizable and remembered. The chrome is calm and recedes; the center pane is
unmistakably the focus.

---

## 6. The command palette & capture

Capture must take five seconds or it dies (SPEC §3). The command palette is how:

- **`Ctrl-P` — the command palette.** Every action lives here: add person, log
  interaction, create goal, find a path, open settings, switch theme. Keyboard-first,
  fuzzy-matched.
- **Quick capture.** A single-line input (its own global-hotkey window, and also reachable
  from the palette). You type a sentence; Enter. On a confident parse it **commits
  optimistically** and flashes a one-line undo toast (`logged dm w/ sarah · Ctrl-Z`). On
  an ambiguous one it shows a one-line preview first. Offline, it never blocks — it files
  a raw stub to resolve later. (Parsing is deterministic/manual first; AI is the last
  thing added, never load-bearing.)
- **`Ctrl-K` — quick-jump.** Fuzzy-find any person and fly the graph to them (or open
  their note). Spatial memory fades past ~50 people; this is the constant escape hatch.

Capture is a blink; the graph is where you linger. Two tempos, one clean surface.

---

## 7. The person view — the note

Selecting a person opens their note, the Obsidian soul of the app:

- **Frontmatter as form.** Name, handles, role, company, tags, warmth, primary channel —
  clean shadcn form fields, live-bound. Editing a field writes through the engine's
  mutation funnel.
- **Body as markdown.** Below the fields, the free-form prose scratchpad — a real
  markdown editor. This is where the deeper thinking about a person lives.
- **Channel handles** appear as small monochrome icons (Twitter, LinkedIn, email,
  Telegram, Discord, GitHub, Zoom); the primary one carries a touch of the accent. Click
  to open that profile/conversation in the browser. Function preserved, decoration gone.
- **Origin** (where the relationship was born) is a clean link/field, not a torn-paper
  chip.

---

## 8. Lists & tables — the Notion side

Not everything is spatial. Clean, dense, sortable list/table views over the same data:

- **People** — a filterable, sortable table (name, company, warmth, last touched, tags).
- **Interactions** — the chronological log; your activity stream.
- **Goals** — open/active/done targets and criteria, with deadlines.

Saved/filtered views (e.g. "VCs gone cold," "people I met this month") are the natural
extension. Tables are calm and information-dense — Linear-grade, not spreadsheet-noisy.

---

## 9. Warmth & staleness, made visible

Two relationship properties stay ambient and glanceable, rendered in the clean grammar:

- **Warmth** (`close | warm | cold | dormant`) — a small, calm indicator: a muted dot or
  a quiet label/tag on the node, the list row, and the inspector. Within the neutral
  family; warmth is structure, not a rainbow.
- **Staleness** — node desaturation/dimming (§4) plus a plain "last touched 3 weeks ago"
  relative date in lists and the inspector. Honest, guilt-free, and visible the instant
  you open the app.

These keep recency and warmth first-class in the interface itself, not buried in a
dashboard.

---

## 10. Typography

- **Clean sans for the UI** — a precise, neutral interface typeface (Inter or the system
  UI stack). This carries everything: nav, labels, form fields, table text, the editor
  chrome. Obsidian-flavored: legible, quiet, no personality cosplay.
- **Monospace for the machine-y bits** — ids, handles, dates, file paths, keyboard hints.
  A small, deliberate texture that signals "this is data."
- **No handwriting, anywhere.** The marker hand belonged to the polaroid world; it has no
  place here. Faux-handwriting is the fastest way to cheapen a clean tool.

---

## 11. Motion & feel — "motion tea"

Motion is a **first-class delight**, not afterthought polish — this is a tool opened every
day, and it should feel alive in the hand. Spring-based, smooth, satisfying; present but
tasteful (motion serves the moment, it never flails). Built on **`motion` (framer-motion)**:
springs, enter/exit via `AnimatePresence`, and later layout/gesture animation.

- **The note panel** — slides in from the top-right on tap; tapping a *different* person
  slides the current note out, *then* the new one in (`mode="wait"`). Never an abrupt swap.
- **Board** — cards settle with spring physics; hover and selection lift lightly.
- **Capture landing** — a small, crisp spring when something commits.
- **The path moment** — the path saturates and a pulse runs you → target; the rest dims.

The rule: motion should feel *intentional* — a spring with weight, not a linear fade. When
in doubt, make it springier, not flatter.

---

## 12. Density & calm

The hardest clean-UI skill: dense *and* calm at once (this is what makes Linear feel the
way it does). Lots of information, no noise. Achieved with hierarchy and spacing, not
with lines and boxes everywhere — generous-but-tight padding, clear type scale, hairline
separators only where they earn it, alignment to a grid. Calm is a feature; whitespace is
not wasted space.

---

## 13. How the UI binds to the engine

The data layer is built and UI-agnostic — the UI is a pure consumer:

- Views **read** the live `Switchboard` state: `people` → nodes/rows, `handshakes` →
  edges, `goals` → goal items, `adjacency` → pathfinding, `lastInteractionDate` →
  staleness, `interactionsByPerson` → activity.
- Every change — add, edit, log, archive, move a node — is a `Diff` sent through
  `VaultSession.commit()`, the single mutation funnel. The UI **never** writes files
  directly; it describes intent and the engine does the rest (atomic write, inverse for
  undo).
- External edits (you in Obsidian, a git pull) arrive via the watcher and reload the
  state automatically; the UI just re-renders.

The clean boundary means the look can keep evolving without ever touching the brain.

---

## 14. The discipline — anti-clutter rules

The clean-era descendant of the old anti-kitsch rules. The line between "Linear-clean"
and "generic-bland" is thin; these keep it on the right side:

1. **Monochrome + one accent.** Neutral ground, rose for connection/primary. No third
   brand color. New color must justify itself as the accent or stay neutral.
2. **Red is destructive only.** Never the brand, never a button you want pressed.
3. **Keyboard-first.** Every action reachable from the command palette; the UI is
   navigable without the mouse (the graph excepted).
4. **Dense but calm.** Hierarchy and spacing over borders and boxes. Whitespace earns
   its place.
5. **Motion clarifies, never decorates.**
6. **Consistency over cleverness.** One way to do each thing; one component for each job
   (shadcn/Radix, restyled to taste). No bespoke snowflakes.
7. **When in doubt, remove it.** The Obsidian/Linear reflex. Subtraction is the default
   edit.
8. **The graph is make-or-break.** Make it feel alive before building anything around it.

---

## 15. The hero moment

The old vision aimed at one image: a wall of faces webbed in red string, glowing in a
dark room. The clean-era hero is its sibling: **your whole network as a calm, legible
graph on a dark ground — and the instant you ask "who do I know who can reach X," a
single path lights up rose while everything else recedes.** The wallpaper-worthy moment
is no longer warmth; it's *clarity* — the feeling of a complex web suddenly answering a
question. That moment is the entire pitch in one screen.

---

*End of UX north star (clean-era rewrite). Pair with [SPEC.md](./SPEC.md) — note that
SPEC's Tech-stack §Frontend (R3F/Three/PBR) and its Board visual language are superseded
by this document and want a follow-up reconciliation.*
