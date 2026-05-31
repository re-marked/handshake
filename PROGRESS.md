# Handshake — Progress

The living **"what's next"** tracker. Read the `▶ NEXT` line first.

---

## ▶ NEXT
**Window manager v2 — one Leaf/Split model, two render skins (issue #5)** (plan: `.claude/plans/curious-stargazing-music.md`). The browser-style "one global bar + bare panes" model confused Mark on splits, so it was reworked: the canonical model is now the **Leaf/Split tree** (`Leaf{tabs,activeIndex} | Split`, resurrected from git `9fc04ba`) + a `layoutMode: "tabs" | "simple"`. **Tabs mode (default, Obsidian):** every leaf draws its own `TabStrip`. **Simple mode (one-bar):** per-leaf strips hidden; one `TopBar` renders the **active leaf's** tabs and follows the focused pane. Same tree → instant lossless toggle (NavRail button + command palette). `src/workspace/{model,ops}.ts` rewritten (ops verbatim from 9fc04ba + `leafOf`/`detachView`); store rewritten onto the tree (`openView/setActiveLeaf/setActiveTab/closeTab/splitLeaf/resizeSplit/focusBoard/setLayoutMode/setNoteMode/splitNoteWithBoard/revealPerson`); components `WorkspaceRenderer/Leaf/TabStrip/SplitContainer` resurrected, `TopBar` now hosts the active leaf's strip, `PaneRenderer` deleted; `vault/workspace.ts` validates the Leaf tree (+ `layoutMode`). Floats / note-modes (panel⇄float⇄tab + pin) / one-tap note|board split / `WorkspaceBoundary` all carry over unchanged on top. **One-time reset:** the old on-disk `workspace.json` (Pane shape) fails validation → resets to a fresh workspace once; `layout.json` (board positions) untouched. 99 tests pass; build clean. **Verify in `pnpm tauri dev` (full restart — model rename):** fresh = per-pane tabs; split → two strips + focus ring; toggle simple (NavRail/⌘P) → one bar follows the focused pane; toggle back = identical tree; note panel→float→tab→split-with-board (moves not copies); delete a docked person (tab+leaf collapse); ⌘-click a card → split; reload → tree+layoutMode+floats restore. Optional later: **(6)** drag tabs between panes. Deferred: pathfinding, photo upload, markdown, undo. AI stays last.

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
- [~] App shell — Obsidian-grade workspace (everything is a View; board pinned-main; notes slide in). Model + L0–L6 in **SHELL.md**. [L0 store+frame ✓ · L1 note panel ✓ · faint-**+** create-and-connect ✓ · delete + connection settings (click) ✓ · drag-to-connect ✓ · L2 `Ctrl-P` palette ✓ · primary views Board · People · Goals ✓ · People list: search/sort/density/pagination/locate/add ✓ · **L3 workspace** ✓ browser-style (one top bar of tabs + pane tiling, resizable splits, multiple independent boards) · **L3 persist ✓** (`workspace.json` — tabs/tiling/floats/noteDefault survive restart) · **L3 floats ✓** (pop a note out → draggable/resizable window) · **L3 note-modes ✓** (panel⇄float⇄tab inline switch + remembered default) · **WM v2 ✓** (issue #5 — reworked to one Leaf/Split model with a tabs⇄simple layout toggle); optional later: drag tabs between panes]
- [~] Live wiring: `commit()` reflects in place (store swaps in `applyDiff`'s `next` — no reload); external watcher→reload still rebuilds the whole board
- [~] Look polish: ties colored by warmth (shades of rose, intensity = strength) ✓; staleness/freshness signal **dropped on purpose** (too CRM-y); real photos across the cast still TODO (needs photo upload)

## Phase 3 — Capture
- [ ] Global hotkey (Tauri) → quick-add overlay
- [ ] Anthropic Haiku parses free text → structured diff
- [ ] Optimistic commit + undo toast

## Phase 4 — Pathfinding + drafting
- [x] Goals: a standalone **view** (rail Target swaps the main area) AND faint dashed **cards on the board**; tick a goal (either place) **promotes** it into a connected person (solidifies in place). Short aspirations. Per-goal notes/deadline/explicit target-person link deferred.
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
