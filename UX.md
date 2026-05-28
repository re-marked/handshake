# Handshake — UX & Aesthetic North Star

This document is co-equal with [SPEC.md](./SPEC.md), not subordinate to it. SPEC.md
says what Handshake *does*; this says what it *feels like* — and feel is not polish
here, it is the product. Handshake is **an aesthetic game more than a production tool,
while remaining genuinely both.** The corkboard is a small world you want to live in;
the CRM is the substance underneath that makes living in it worthwhile. A beautiful
board you open every day is the entire mechanism by which the tool succeeds. So every
decision below is load-bearing.

This is the full vision. It describes the destination, not a build order — the order
things get built is a separate conversation (see SPEC.md's build plan).

---

## 1. The north star

**A corkboard in a dimly-lit study, lit by a single warm lamp.**

When you open Handshake, you should feel like you've walked into a quiet room at night
where one warm light falls on a pinboard covered in faces and red thread. The board is
a real, physical, *touchable* object. It has weight, depth, and grain. Light falls on
it from one direction. Things pinned to it cast shadows. Thread sags under gravity.
Photos yellow with age. It is the opposite of a flat dashboard — it is a place.

The emotional target is **calm, tactile, slightly nostalgic, and yours.** Not a
detective-meme "crazy wall" (that's the kitsch failure mode); a beloved personal
artifact — the wall of someone who cares about the people on it.

---

## 2. The two aesthetics, and why the chrome is dark

Handshake holds two looks in deliberate tension:

- **The board** — warm, lit, textured, physical. The corkboard world.
- **The chrome** — the sidebar, editor, settings, and quick-add bar. Dark, quiet,
  restrained, monospace-adjacent. Obsidian-flavored.

These are not arbitrary. **The dark chrome exists to make the warm board glow.** A
warm, lit object reads as precious only against a dark surround — the way a real
pinboard looks when it's the one lit thing on a wall at night. The chrome recedes; the
board advances. When the board is on screen, it is unmistakably the subject, lit like
a focal object in a dark room.

The board is *never* "dark mode." A corkboard is a warm physical thing; it stays warm.
Dark mode is a property of the chrome only.

---

## 3. The color grammar

Beneath the cork-and-string look is a disciplined **two-color semantic system on a
neutral ground.** This single rule settles a hundred downstream decisions.

- **Neutral warm ground — the field.** Cork, walnut, paper, and the photo frames all
  live in a family of desaturated warm neutrals: greige, tan, cream, aged wood. This
  is the calm backdrop. It carries texture but almost no saturation.
- **Red — connection and attention.** The pins, the string, and pathfinding pulses are
  the *only* truly saturated color on the board. Red means "this is a link" or "look
  here." Because red is otherwise absent, lighting up a red path during pathfinding
  reads instantly and feels like the board is pointing.
- **Yellow — your intentions.** Goal stickies are the one other color: Post-it yellow.
  Red is the world's relationships; yellow is what *you* want from it. A small, clear
  grammar: **red = the network, yellow = your will.**

Everything else stays warm-neutral. Two signal colors, one field. If a new element
needs a color, it must justify itself against this grammar or stay neutral.

---

## 4. Light & physical consistency — the one-lamp rule

The single thing that separates "tactile and real" from "stickers stacked on a JPEG"
is **physical consistency under one light source.**

- There is **one warm lamp**, positioned top and slightly left. Warm color temperature —
  a desk lamp, not noon daylight.
- **Everything pinned to the board casts a shadow consistent with that light** — soft,
  directional, offset down-and-right. Polaroids, pins, stickies, string, chips: all
  agree on where the light is.
- **Depth is real.** Cards lift a few millimeters off the cork: the pin holds the top,
  so the card sags slightly forward and its shadow is tighter at the top, softer and
  larger at the bottom.
- A faint **warm vignette / bloom** falls off toward the frame edges, so the board reads
  as *lit by a lamp*, not flatly illuminated. The center is brightest.
- The uncanny-valley failure is mixing "physical" and "flat-UI" elements. If one thing
  casts a shadow, everything does. No element may opt out of the physics.

---

## 5. The rendering model — React Three Fiber + real PBR lighting

The board is rendered with **React Three Fiber** (R3F) — the React reconciler for
Three.js WebGL. This is a deliberate choice for realism, not convenience: CSS can
approximate 70% of the look, but the last 30% — the thing that makes it feel like a
real physical object — requires real lighting on real geometry. A `SpotLight` casting
soft shadows across a normal-mapped cork plane, PBR materials making the grain actually
catch the light, pins as sphere geometries with metalness/roughness, string as a tube
along a catenary curve. None of that is achievable in CSS. All of it is native Three.js.

The board is geometrically simple — a flat surface with objects resting on it — so you
get full PBR realism without paying for it in scene complexity.

**The scene structure:**

- **One `SpotLight`** (warm color temperature, ~2700K), positioned top and slightly
  left. `PCFSoftShadowMap` on the renderer. Everything on the board casts real soft
  directional shadows onto the cork. The one-lamp rule (§4) is enforced at the renderer
  level, not faked in CSS.
- **Cork** — one large `PlaneGeometry`. `MeshStandardMaterial` with albedo + **normal
  map** + roughness map (Poly Haven, CC0). The normal map is the key: it makes the
  SpotLight physically catch the grain texture as a 3D surface. This is the capability
  that justifies WebGL — it is impossible in CSS.
- **Frame** — `BoxGeometry` with walnut PBR textures. Shadow casting enabled.
- **Polaroid cards** — thin `PlaneGeometry`, elevated ~2mm off the cork, euler rotation
  derived from person id. `MeshStandardMaterial` with photo as texture. Shadow casting
  from the SpotLight gives the characteristic polaroid shadow (tighter at top, softer at
  bottom) automatically.
- **Pins** — `SphereGeometry`, `MeshStandardMaterial` (`metalness: 0.3, roughness: 0.2`
  for glossy enamel). The specular highlight from the SpotLight comes for free from PBR.
- **String** — `CatmullRomCurve3` (the catenary), extruded as `TubeGeometry`. A real
  3D cylinder catches the light as thread does, with a highlight on its upper surface and
  a shadow below. Custom shader or rope texture for the fibrous twist.
- **Stickies** — `PlaneGeometry` + Post-it yellow material + paper grain texture. Corner
  curl as geometry displacement.

**Card interactivity — the Drei `<Html>` model.**

Card content (name, tags, channel icons, tape strip) is rendered as real DOM via
`@react-three/drei`'s `<Html>` — actual HTML elements tracked to a 3D world position.
The card *surface* is a real lit 3D plane; the label content on it is HTML (crisp at any
zoom, trivially interactive, styled with Tailwind). Click targets and drag handles use
R3F raycasting; the HTML overlay handles the label content. This is the clean split.

**Postprocessing.**

`@react-three/postprocessing` adds two passes over the rendered frame:

1. **Film grain** — the global binder, now as a postprocessing effect over the entire
   rendered scene. Makes every element read as one photographed surface.
2. **Vignette** — the warm falloff toward the frame edges.

**Camera and navigation.**

`OrthographicCamera` top-down (no perspective distortion on the cards — they sit flat on
the board). Pan and zoom are camera movements, not DOM transforms — smoother, physically
correct, and simpler to implement than react-flow's coordinate system. react-flow drops
entirely; R3F replaces its whole function.

**The chrome stays DOM.**

Sidebar, editor, quick-add, settings — React + Tailwind + shadcn/ui, outside the R3F
canvas. The canvas is one component inside the layout; the dark chrome surrounds it.
No DOM/WebGL mixing in the chrome.

**The discipline stays the same.** Textures are quiet; light is the drama. Every
texture brought into the warm-neutral palette before use — desaturated, toned, contrast
knocked down. The SpotLight supplies the drama; the materials supply the surface. A loud
texture wrecks it even in PBR.

**Texture source.** Poly Haven and ambientCG (both CC0). Pull the full PBR set for each
material: albedo + normal map + roughness map. Tone the albedo into palette; use the
normal and roughness maps as-is.

---

## 6. The materials

Each material below names: the look, whether it's raster or procedural, its physics,
and its states.

### Cork (the field)

- **Look:** slightly aged cork — warm, desaturated greige-tan, fine granular speckle,
  low contrast, subtle tonal variation. Reads as cork on close inspection; *functions*
  as a calm backdrop, like good wallpaper.
- **Aged, lightly:** a faint scatter of old empty pin-holes (history), slightly worn
  near the frame edges. Restraint is everything — aging adds soul, but a hair too much
  tips into kitsch.
- **Three.js `MeshStandardMaterial`** with albedo + normal map + roughness map (Poly
  Haven, CC0). The normal map is what makes this material work — the SpotLight
  physically catches each grain ridge as a 3D surface. Toned into warm-neutral palette
  before use. Because the board is bounded, one large texture tiles zero times.

### The frame (walnut)

- **Look:** dark walnut, real wood grain, warm. It makes the board feel like an object
  hung on a wall — a realistic workspace, bounded and owned, not an infinite plane.
- **`BoxGeometry`** with walnut PBR textures (albedo + normal + roughness). Shadow
  casting enabled. The frame sits proud of the cork plane — its inner-edge shadow falls
  onto the cork naturally from the SpotLight, no faking needed.

### Polaroids (people)

- **Look:** ~140×180px. Cream-white frame (aged a hair, never pure white), the classic
  thick bottom strip. The name is written on that bottom strip **in marker** — this is
  the real way polaroids are labeled, so handwriting earns its place here (a restrained
  marker hand, never loopy script). One tag below. A small colored tape strip in a
  corner encodes warmth.
- **Rotation:** each card sits at a stable ±2–3°, **derived deterministically from the
  person's id** so it never jitters on reload and never needs storing. Slight, organic,
  gridless.
- **Depth:** lifted off the cork, soft directional shadow (tighter top, softer bottom).
  On the photo area, a subtle paper grain overlay.
- **Thin `PlaneGeometry`** elevated ~2mm off the cork. `MeshStandardMaterial` with the
  person's photo composited onto a cream polaroid frame as a texture. Shadow casting
  enabled — the SpotLight gives the characteristic shadow (tighter at top, softer at
  bottom) for free from the geometry. Card label content (name, tags, channel icons,
  tape strip) rendered as a `@react-three/drei` `<Html>` overlay tracked to the card's
  3D position: the surface is real lit geometry; the label is real DOM.
- **States:** see §7 (warmth & staleness). The photo fades with neglect.

### The self card

- **Look:** larger, thicker frame, the **most vividly lit and most saturated** card on
  the board — the lamp is effectively centered on you. A brass corner detail sets it
  apart. You are the center of your own world, rendered as light.

### Red pins

- **Look:** glossy red enamel dome through the top-center of each card, catching one
  tiny specular dot from the lamp and throwing its own small shadow. Uniform red across
  all cards — it's the iconic element and a constant visual rhythm; warmth is encoded
  elsewhere (tape strip), not in pin color.
- **`SphereGeometry`** with `MeshStandardMaterial` (`metalness: 0.3, roughness: 0.2`).
  The specular highlight from the SpotLight comes for free from PBR — one bright dot,
  consistent with the lamp position, no faking. Shadow casting enabled. The pin is the
  most "manufactured" object on the board and PBR renders it that way correctly.
- **Interactive:** raycasted click to unpin/archive a card.

### Red string (yarn)

- **Look:** aged crimson thread (not fire-engine red), fibrous fuzzy edge, ~2px, with a
  **catenary sag** — it hangs under gravity between two pins; straight lines read as
  digital UI, sag reads as real thread. Longer spans sag more. Tied off under the pin
  heads. A thin, soft shadow on the cork, offset by the lamp.
- **`CatmullRomCurve3`** computed as a catenary between the two pin world positions,
  extruded as `TubeGeometry`. A real 3D cylinder — it catches the SpotLight as thread
  does, with a highlight on its upper surface and a soft shadow cast onto the cork below.
  For the fibrous twist: a custom shader material or a thin rope texture mapped along the
  tube's UV coordinates. The geometry is rebuilt on change (drag, new handshake,
  pathfinding) — the catenary curve recomputed in JS, `TubeGeometry` recreated.
- **States:**
  - *Active* — aged crimson, full presence.
  - *Dormant* — thinner, faded grey-red.
  - *On a found path* — saturates to vivid red, and a **pulse travels along it from you
    → target** while every other strand gently dims. Quick and cinematic, then it
    relaxes back.
- **This is the make-or-break element.** Prototype it as a standalone toy before
  committing the aesthetic — if the string doesn't feel like thread, the whole premise
  wobbles. Get it right before building anything on top of it.

### Yellow stickies (goals)

- **Look:** Post-it yellow with a **lifted, curling bottom corner** casting its own
  small shadow — the curl is the detail that sells "stuck on, peeling." Slight rotation.
  Goal text **handwritten** (unambiguously right here — you scrawl on a sticky). A red
  string can run from the sticky to its target card.
- **`PlaneGeometry`** slightly elevated, slight euler rotation. `MeshStandardMaterial`
  with Post-it yellow color + paper grain texture. Shadow casting enabled. The curling
  corner: a second thin geometry piece or a displacement shader lifting the bottom corner
  — it casts its own small shadow onto the cork.
- Yellow = your intentions (§3). Stickies are the only yellow on the board.

### Channel icons

- **Look:** a row of small, favicon-sized marks beneath the name — Twitter, LinkedIn,
  email, Telegram, Discord, GitHub, Zoom — rendered as tiny glossy sticker-dots so they
  don't break the physical metaphor. The **primary channel** is slightly larger and
  carries a touch of color; the rest are quiet.
- **Interactive:** click an icon to open that profile/conversation in the browser.

### Origin chips

- **Look:** for relationships born online, a tiny torn-paper chip pinned beside the card
  — a little evidence label showing the originating tweet/thread, like a receipt scrap.
  Optional, but lovely when present. Click to open the artifact.

### Margin notes

- Sparse handwritten annotations directly on the cork near clusters — a red china-marker
  scrawl. Personal, restrained, never crowded. A later delight, not a v0.1 requirement.

---

## 7. Warmth & staleness, made visible

Two relationship properties are encoded *visually and ambiently*, so you read the state
of your network at a glance rather than from a dashboard.

- **Warmth** (`close | warm | cold | dormant`) — the **colored tape strip** in the
  card's corner. A small, calm indicator within the warm-neutral family (with red
  reserved for connection, the tape uses muted tones: deep warm red for close, soft
  orange for warm, bare cream for cold, faded grey for dormant).
- **Staleness** — **the photo fades.** A relationship you've neglected desaturates and
  yellows toward sepia over time; a close, recently-touched one stays vivid. This is
  physically honest (old photos fade), guilt-free (no nagging digest), and turns "who
  have I gone quiet on?" into something you *see* the instant the board opens. It makes
  the prettiness a forcing function: the board literally shows your neglect, and acting
  on it brings the face back to life. Driven by shader uniforms on the card's
  `MeshStandardMaterial` (a desaturation + sepia blend computed from last-interaction
  recency), tweened smoothly via GSAP or a spring when a new interaction is logged.

Together these make recency and warmth first-class *in the aesthetic itself* — the board
is not just spatial but temporal.

---

## 8. Motion & feel — the tactile grammar

Motion is half of "want to open it every day." The board must feel like a real object
you can touch. The motion vocabulary:

- **Pin-pop on drag.** Grab a card and it *lifts* — shadow grows, slight scale-up, the
  pin pops out and the card swings a hair. Drop it and the pin presses back in with a
  tiny settle/bounce, and the card lands at its stable derived angle. This pin-pop is
  the board's tactile signature.
- **Hover.** A very subtle lift — enough to feel responsive, not enough to fidget.
- **Drawing a string.** Drag from a card and a sagging string trails from the cursor,
  then snaps to the target pin and ties off.
- **Pinning a new card.** A new person presses onto the board with a little settle, as
  if pushed in.
- **Capture landing.** When a quick-capture commits, the affected card/interaction
  settles into place — a small acknowledgment that something real happened.
- **Pathfinding.** The path saturates, a pulse runs you → target, the rest of the board
  gently desaturates; then it relaxes. Cinematic but brief.

All motion obeys the physics (§4): things that move are things with weight and a pin
holding them. Implementation: GSAP (or a spring library) tweening Three.js mesh
properties — position, rotation, scale, material uniforms — not CSS transitions. The
motion lives in the renderer, not the DOM.

---

## 9. Capture, as felt

The quick-add bar is chrome, not board — dark, quiet, centered, borderless. But its
*feel* is part of the UX:

- It appears instantly over whatever you're doing and takes a single line.
- On a confident parse it **commits optimistically** and flashes a one-line undo toast
  (`logged dm w/ sarah · Ctrl-Z`) — no confirmation step, so the common case is truly
  five seconds.
- On an ambiguous parse it shows a **one-line preview** and Enter confirms.
- Offline, it never blocks — it files a raw stub to resolve later.

The dark, frictionless capture surface contrasts with the warm, slow, lingering board.
You capture in a blink and you *dwell* on the board. Two speeds, on purpose.

---

## 10. The hero moment

Design explicitly toward one image: **the board zoomed all the way out — a wall of
faces webbed in red string, glowing warm in a dark room.** This is the
wallpaper-worthy moment, the thing that makes you *want* to open the app. It is also,
not coincidentally, the most useful view: your whole network, at a glance, with the
dormant faces faded and the live connections bright.

Zoomed in, you focus on a cluster and do deeper work. Zoomed out, you feel the whole
thing. The transition between the two should be smooth and a pleasure in itself.

---

## 11. Typography

- **Marker hand** — polaroid name strips, sticky-note goals, margin notes. Restrained,
  legible, never loopy script. This is where handwriting belongs because it's physically
  honest (you write on polaroids and Post-its with a marker).
- **Typewriter / label-maker** — origin chips, small printed labels, anything that reads
  as "typed onto the board." Ages far better than faux-handwriting for non-margin text.
- **Monospace-adjacent / clean sans** — the dark chrome (sidebar, editor, settings,
  quick-add). Obsidian-flavored, quiet.

Discipline: handwriting carries *personal* marks only; never let it carry UI. The
fastest way to tip into kitsch is loopy handwriting doing a UI job.

---

## 12. The chrome

The non-board surfaces. Restrained, dark, monospace-adjacent — they recede so the board
glows.

- **Sidebar** — quiet navigation/list of people, search, goals. Dark.
- **Editor side panel** — frontmatter as form fields, markdown body below. shadcn/ui,
  dark. Where you do deeper thinking about a person.
- **Quick-add bar** — see §9.
- **Settings** — vault folder, API key, hotkey, lamp warmth (let the lamp color
  temperature be tunable — it's the soul of the board's mood). Dark, minimal.

The board remembers itself between sessions via `.handshake/layout.json` (positions +
viewport); card rotation is derived from id, not stored. Reopening the app restores the
*exact* board you left, down to the pan and zoom.

---

## 13. The discipline — anti-kitsch rules

The line between "tactile and beautiful" and "kitschy and bad" is thin. These rules
keep it on the right side:

1. **One light source. Everything obeys it.** No element opts out of the physics.
2. **Textures are quiet; light is the drama.** Desaturate and tone every texture into
   the warm-neutral palette before use.
3. **Two signal colors only** — red (connection) and yellow (intention) — on a neutral
   ground. New colors must justify themselves or stay neutral.
4. **Restraint on aging.** A little wear adds soul; too much is a costume.
5. **Handwriting for personal marks only**, never for UI.
6. **Bind everything with the global grain layer** so it reads as one photograph.
7. **When in doubt, less.** Study real corkboards and lamplit rooms before reaching for
   another effect.
8. **Prototype the string first.** It's the make-or-break element; if it doesn't feel
   like thread, fix that before building anything on top of it.
