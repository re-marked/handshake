# Handshake — Shell & Workspace

How the app is structured *around* the board. Companion to SPEC.md (what it does) and
UX.md (what it feels like). This doc is the workspace's design + build plan.

The shell is **Obsidian-grade**: everything you can look at is a **View**, Views live in
a recursive split/tab **workspace**, and a **floating layer** sits on top for quick note
peeks. The board is the View pinned in the main area by default; notes slide and float in
beside it — **the web stays intact.**

> The hard part here is the *model*, not the code (splits and tabs are well-trodden). So
> this nails the model once, then builds it in shippable layers — each layer assumes the
> model below, so nothing gets re-architected later.

---

## 1. The primitive — a `View`

Everything that can occupy a pane, tab, or floating window is a typed, data-bound,
serializable `View`. A new feature is never a layout problem; it's "define a view type +
a command that opens it."

```
View = { type, params, state? }

  board                                  — the network (one logical board)
  person   { id }                        — frontmatter form + markdown body
  list     { kind: people | interactions | goals }
  search   { query }
  settings
  …later: pathfinding, a capture log, etc. — all just Views
```

The **board is a View** like any other — it's simply *pinned in the main leaf by
default*. It must therefore survive being moved, split, or duplicated (its
positions/viewport persist independently — see §6). It is not a hardcoded center.

---

## 2. The workspace

Two coexisting surfaces, both holding Views:

```
┌────┬──────────────────────────────┬───────────────┐
│ n  │                              │  right region │
│ a  │   main area                  │  (Leaf/Split  │
│ v  │   (board, pinned by default) │   of tabs)    │
│    │                              │               │      ╭─ floating ─╮
└────┴──────────────────────────────┴───────────────┘      │ person note│
        Ctrl-P palette · Ctrl-K jump                        │ (content-  │
                                                            │  sized)    │
                                                            ╰────────────╯
```

- **Docked workspace** — a recursive tree:
  ```
  Leaf      = { tabs: View[], activeTab }      // a tabbed pane
  Split     = { dir: row | col, children: (Split | Leaf)[], sizes }
  Workspace = { root: Split | Leaf, left?, right? }   // collapsible side regions
  ```
- **Floating layer** — zero or more floating windows, each holding a View, sized to its
  content, draggable, stackable. This is where a tapped polaroid's note appears (§4).

The left **nav rail** (Board, People, Goals, Search, Settings) is thin and Obsidian-rail-
like; it opens Views, it isn't itself a pane tree.

---

## 3. Opening a View — the one intent

All navigation funnels through a single action:

```
openView(view, target)
  target = panel            // top-right slide-in note (default for `person` — see §4)
         | tab              // new tab in the active leaf
         | replaceActive    // reuse the active *unpinned* tab (Obsidian's "don't drown")
         | split: dir       // split the active leaf and open there
         | sidebar: side    // left/right region
```

- **Tap a card → the note panel slides in** (top-right); tap the same card again / `Esc`
  to close. The board stays put and interactive.
- **Promote** the panel's note → a docked `tab` (for keeping/comparing — workspace layers).
- **`Cmd/Ctrl-click`** → open in a `split`. The command palette and nav use `tab` /
  `replaceActive`.
- **Selection** (the highlighted node on the board) is *separate* from what's open — one
  is "what I'm pointing at," the other is "what's on screen."

---

## 4. The note panel

The signature interaction. Tap a polaroid and its note **slides in from the top-right**;
tap the same card again (or press `Esc`) and it slides back out.

- **Slide-in, non-modal** — a smooth slide + fade; the board stays fully interactive
  behind it. Not a modal sheet, not a draggable window.
- **Tap-to-toggle** — the same card closes it; a different card swaps the content in place.
- **Content-sized card**, capped to the viewport, with scroll for long notes.
- **Moderately large, comfortable reading typography** — distinct from the dense chrome;
  this is where you read and think about a person.

(A docked tab — for persistent, multi-pane work — renders the same person view and
arrives with the workspace layers below. Panel and tab are the same content, different
containers.)

---

## 5. State — one `zustand` store

The store is the backbone everything reads from:

```
vault:      { session, switchboard (live), photos }
workspace:  { root (split tree), left, right, floats: FloatingWindow[], activeLeaf }
selection:  selectedId | null
actions:    openView(view, target) · closeTab · closeFloat · pin(float)
            splitLeaf · moveTab · setActive · select · commit(diff) · capture(text) · …
```

Components subscribe to slices. `commit`/`capture` go through `VaultSession` (the one
writer); the watcher reload updates `switchboard` in place.

---

## 6. Persistence — two sidecars, two lifecycles

- **`.handshake/layout.json`** — the *board's* state: card positions + viewport. (Built.)
- **`.handshake/workspace.json`** — the *shell's* state: the open tabs, the pane tiling +
  split sizes, the active pane, floating windows, and the note-mode default. (Built —
  `src/vault/workspace.ts` defensive parse/serialize; Rust `read_workspace`/`write_workspace`;
  loaded in store `init`, written via a 500ms-debounced `useApp.subscribe`.) Restored on open.
  The transient slide-in note (`openPersonId`), locate, and command state are deliberately
  **not** persisted — launch never auto-pops a note. Extra (non-`main`) board positions are
  session-only (in-memory cache); only `main`'s positions persist (in `layout.json`).

Separate because they change at different rates and mean different things (where the
people sit vs which panes are open).

---

## 7. Build in layers

> **Status (built):** the workspace is a single **Leaf/Split tree** (`Leaf{tabs,activeIndex} | Split`)
> in `src/workspace/`, with a `layoutMode` toggle over two render skins — **tabs** (per-pane tab
> strips, Obsidian-style, the default) and **simple** (one top bar that follows the focused pane).
> We briefly shipped a "one global bar + bare panes" browser model but it was confusing on splits
> (issue #5), so the model was reworked to this. Done: per-pane tabs · resizable splits · multiple
> independent boards · floating windows · inline note-mode switch (panel⇄float⇄tab) + remembered
> default · one-tap note|board split · the tabs⇄simple layout toggle (NavRail + ⌘P) · persistence
> (`.handshake/workspace.json`). Still open: dragging tabs between panes. The layer notes below are
> kept for the original intent.

Each layer is shippable and assumes the model above — no re-architecting.

- **L0 — Store + frame.** Stand up the `zustand` store; refactor `App` (load → store).
  Render the static frame: nav rail · main area (board, from the store) · empty right
  region · palette mount. *The board keeps working, now driven by the store.*
- **L1 — The note panel.** Tap a card → the person's note slides in top-right (tap again /
  `Esc` to close); a content-sized, comfortably-typeset read view, board live behind.
  Editing (fields + body → commit) follows. The signature interaction.
- **L2 — Command palette.** `Ctrl-P` unified: commands (add person, log interaction, new
  goal, switch view, settings) + quick-jump to people (`Ctrl-K`) + capture (sentence →
  diff). Wired to store actions.
- **L3 — Docked tabs + right region.** Promote a float → docked tab; the right region as
  a tabbed `Leaf`; resize. Persist the workspace (`workspace.json`) from here on.
- **L4 — Splits.** Split a leaf (row/col) + resize: the recursive tree realized.
- **L5 — Tab drag.** Drag tabs between leaves and into new splits. *The complexity
  hotspot — last, because the model already allows it.*
- **L6 — The other Views.** `list` (people / interactions / goals), `search`, `settings`
  as Views the nav opens.

(Capture parsing stays manual/deterministic; AI is last and never load-bearing.)

---

## 8. Not now (deliberately)

- OS-level pop-out windows (in-app floats only).
- Vault folder-picker / first-run flow — still `VITE_VAULT_PATH` for dev.
- Pathfinding UI, intro-drafting, any AI.
