# Handshake — Progress

The living **"what's next"** tracker. Read the `▶ NEXT` line first.

---

## ▶ NEXT
**Writer + command palette done — pick the next thread.** Shipped: full writer loop (edit / **+** create-connect / delete / connection settings on click / drag-to-link) and the **`Ctrl-P` palette** — jump to anyone, or type a fresh name to create them connected to you (also opens from the rail's search). Candidate next threads: **board polish** (staleness glow on cards going cold + real photos), **capture** (Phase 3 global quick-add overlay), or more **shell layers** (L3 docked tabs → splits). Deferred: photo upload in the note, markdown rendering, undo (Ctrl-Z rides the funnel's inverse diffs). AI stays last; BFS `route` deferred.

---

## Phase 0 — Scaffold ✅
- [x] Tauri 2 + React + Vite + TypeScript
- [x] MSVC C++ Build Tools — Rust compiles
- [x] App runs (`pnpm tauri dev`)

## Phase 1 — Data layer  ◀ current
The engine is **Switchboard** — pure TS in `src/switchboard/`, zero Tauri/React/Three imports.
- [x] TypeScript types: `Person`, `Handshake`, `Goal`, `Interaction` → `types.ts`
- [x] Frontmatter parse + serialize (gray-matter + js-yaml JSON_SCHEMA), round-trip tested
- [x] Index builder: `buildSwitchboard(files)` → live state (adjacency, staleness, problems) + `ids.ts`
- [x] Mutation funnel: `applyDiff` — the one writer; emits inverse for undo + `ids.ts` minting
- [x] Rust IO: `read_vault`, `write_file` (atomic temp+swap, pure std), `delete_file` — `src-tauri/src/lib.rs`
- [x] TS adapter: `VaultIO` port + `createTauriIO` + `VaultSession` (load + commit), tested via fake IO
- [x] Rust `start_watching` (`notify-debouncer-mini`) + Rust-side echo-suppression (content hash) → `VaultSession` reload — unit-tested both sides AND **live-verified in a running window** (load → external edit → notify → emit → listen → reload)
- [ ] BFS pathfinding: `route(sb, from, to)` — deferred to end (data-consuming)
- [x] Fixture vault for tests (`src/switchboard/__tests__/fixtures/`); real people seeded later

## Phase 2 — The board (card-tree corkboard — see UX.md)  ◀ current
NOT a force/jelly graph: clean cards, fixed positions, hierarchy rooted at you; dragging a card moves its whole subtree rigidly.
- [x] Strip dead WebGL deps; shadcn/Tailwind-v4 foundation + dark-first rose theme (re-tool)
- [x] Card-tree model (`board/tree.ts`): tree rooted at self (parent = introducer ?? nearest connector ?? you), all handshakes drawn, cross-links flagged, tidy radial seed + staleness. Tested.
- [x] `BoardView`: clean DOM cards + SVG links; pan / zoom / rigid subtree-drag; bound to `VaultSession`
- [x] Opaque polaroid cards: photo (data URL) or silhouette; name + role; warmth = link weight; self in rose
- [x] Look landed ("it's nice")
- [x] Persist positions + viewport to `.handshake/layout.json` (debounced); first open centers on self; manual re-parent reserved
- [~] App shell — Obsidian-grade workspace (everything is a View; board pinned-main; notes slide in). Model + L0–L6 in **SHELL.md**. [L0 store+frame ✓ · L1 note panel ✓ · faint-**+** create-and-connect ✓ · delete + connection settings on click (note + board line) ✓ · drag-to-connect ✓ · L2 `Ctrl-P` palette ✓ (jump + type-to-create, shadcn `Command`) · next: board polish / capture / L3 tabs]
- [~] Live wiring: `commit()` reflects in place (store swaps in `applyDiff`'s `next` — no reload); external watcher→reload still rebuilds the whole board
- [ ] Look polish + re-introduce a staleness signal (card opacity was dropped); real photos across the cast

## Phase 3 — Capture
- [ ] Global hotkey (Tauri) → quick-add overlay
- [ ] Anthropic Haiku parses free text → structured diff
- [ ] Optimistic commit + undo toast

## Phase 4 — Pathfinding + drafting
- [ ] BFS from self → target through handshake graph
- [ ] Yarn highlights path
- [ ] Anthropic Sonnet drafts intro ask

---

## Decisions
- Build order: data → board → capture → pathfinding. Not UI first.
- Rust does exactly four things: read dir, write file, watch dir, register hotkey.
- All domain logic (types, parsing, index, BFS) stays in TypeScript.
- Board positions live in `.handshake/layout.json`, never in markdown frontmatter.
- Engine named **Switchboard** (`src/switchboard/`); pure TS, tested with vitest.
- One write funnel: `applyDiff` is the only writer — undo, validation, echo-suppression live there once.
- YAML via js-yaml JSON_SCHEMA (no "Norway problem", no auto-dates); fixed key order + verbatim body → byte-stable rewrites.
- AI is the lowest priority — built last, never load-bearing. Not an AI-native product.
- Frontend/engine is browser-only (WebView2 — no Node `fs`/`Buffer`/`process`). gray-matter was dropped for needing them; parse.ts hand-rolls the frontmatter split + js-yaml. Verify data-layer changes by running the app, not just vitest (Node globals mask browser-incompatible deps).
- **Aesthetic pivot (2026-05):** photoreal corkboard / WebGL / PBR / R3F is RETIRED → clean "Obsidian for your network" (monochrome + one rose accent, graph hero, shadcn/Radix, dark-first). UX.md rewritten top-to-bottom. SPEC §Tech-stack/Frontend + Board visual language are now stale (need a follow-up reconciliation). Dead deps to strip: `@react-three/fiber|drei|postprocessing`, `three`, `postprocessing`, `public/textures/`.
