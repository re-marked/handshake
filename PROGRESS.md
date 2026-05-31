# Handshake — Progress

The living **"what's next"** tracker. Read the `▶ NEXT` line first.

---

## ▶ NEXT
**0.1.0 SHIPPED** 🤝 — `main` + tag `v0.1.0` + GitHub release. **Release CI** in `.github/workflows/`: `release.yml` (push a `vX.Y.Z` tag → cross-platform Tauri installers build into a **draft** release via `tauri-apps/tauri-action`; add notes + publish) and `ci.yml` (type-check + test + frontend build on push-to-main / PRs). pnpm pinned via `package.json` "packageManager". The whole workspace arc + the minor-bug sweep are done.

**Network manager ✓ (built on `feat/networks`, pending live verify)** — open / create / switch vaults ("networks" in the UI; "vault"/`.handshake` internally). Front door when no network (`FrontDoor`), a NavRail **NetworkChip** + command-palette entries to switch, and a `NewNetworkDialog` (pick folder → name yourself → seed "self"). Recents + last-network persist in the OS app-config dir (Rust `read_app_state`/`write_app_state`); `tauri-plugin-dialog` for the folder picker; store `init(seed?)`/`switchVault`/`createNetwork`/`forgetVault`; live switching resets state + clears `boardCache` (extracted to `src/board/boardCache.ts`) so a new network doesn't inherit the old one's card positions; each network keeps its own `.handshake/` workspace + layout. **Verify (restart `pnpm tauri dev` — Rust + capability change):** first run → front door; New network (pick folder, name) → board rooted on you; switch via the rail chip / ⌘P; recents persist across restarts; missing network → graceful front door.

**Next (Mark's pick):** a **Settings page** — the NavRail gear is a stub (`view:"settings"` renders "coming soon"); make it a real view for truly-global prefs (note default, density, theme…). Also still open: **photo upload** (real faces on cards — top pick), markdown rendering in notes, undo (Ctrl-Z). AI stays last.

<details><summary>Done: Window manager v2 (issue #5)</summary>

**Single Obsidian-style layout (issue #5)** (plan: `.claude/plans/curious-stargazing-music.md`). The browser-style "one global bar + bare panes" model confused Mark on splits, so it was reworked to the **Leaf/Split tree** (`Leaf{tabs,activeIndex} | Split`, resurrected from git `9fc04ba`): every leaf draws its own `TabStrip` (true per-pane tabs). We briefly added a second "simple / one-bar" skin behind a toggle, but it was weird + unpredictable so Mark cut it — **Obsidian layout only** now (no `layoutMode`, no `TopBar`, no NavRail/palette toggle). `src/workspace/{model,ops}.ts` rewritten (ops verbatim from 9fc04ba + `leafOf`/`detachView`); store rewritten onto the tree (`openView/setActiveLeaf/setActiveTab/closeTab/splitLeaf/resizeSplit/focusBoard/setNoteMode/splitNoteWithBoard/revealPerson`); components `WorkspaceRenderer/Leaf/TabStrip/SplitContainer` resurrected; `PaneRenderer`+`TopBar` deleted; `vault/workspace.ts` validates the Leaf tree. **Every tab is closable** (board included); closing the last one shows the empty-leaf state ("You find yourself in a weird place. No tabs are open." + an **Open board** button → `focusBoard`). Floats / note-modes (panel⇄float⇄tab + pin) / one-tap note|board split / `WorkspaceBoundary` carry over unchanged. **One-time reset:** the old on-disk `workspace.json` (Pane shape) fails validation → resets to a fresh workspace once; `layout.json` (board positions) untouched. 99 tests pass; build clean. **Verify in `pnpm tauri dev` (full restart — model rename):** fresh = per-pane tabs; split → two strips + focus ring; close every tab → empty state → Open board; note panel→float→tab→split-with-board (moves not copies); delete a docked person (tab+leaf collapse); ⌘-click a card → split; reload → tree+floats restore. **Tab drag + drag-to-split ✓** — **pointer-based** (`setPointerCapture`, like floats — WebView2 swallowed HTML5 DnD even with `dragDropEnabled:false`, see [[handshake-tauri-dragdrop]]). A press past a 5px threshold starts a drag (else it's a click→activate); `document.elementFromPoint` finds the leaf under the cursor (`data-leaf-id`), `zoneAt` (dropZone.ts) picks the zone, `tabDragOver` drives the per-leaf overlay; on release `ops.dropTab` moves (tab bar/center) or splits (body edge, within 25%, `splitNode(before)`). **Verify:** drag a tab to another pane (moves); drag a tab to a pane's left/right/top/bottom edge (splits); a plain click still just activates. Deferred: pathfinding, photo upload, markdown, undo. AI stays last.

</details>

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
- [~] App shell — Obsidian-grade workspace (everything is a View; board pinned-main; notes slide in). Model + L0–L6 in **SHELL.md**. [L0 store+frame ✓ · L1 note panel ✓ · faint-**+** create-and-connect ✓ · delete + connection settings (click) ✓ · drag-to-connect ✓ · L2 `Ctrl-P` palette ✓ · primary views Board · People · Goals ✓ · People list: search/sort/density/pagination/locate/add ✓ · **L3 workspace** ✓ browser-style (one top bar of tabs + pane tiling, resizable splits, multiple independent boards) · **L3 persist ✓** (`workspace.json` — tabs/tiling/floats/noteDefault survive restart) · **L3 floats ✓** (pop a note out → draggable/resizable window) · **L3 note-modes ✓** (panel⇄float⇄tab inline switch + remembered default) · **WM v2 ✓** (issue #5 — single Obsidian Leaf/Split layout; per-pane tabs; all tabs closable + empty-leaf state; tab drag-between-panes + drag-to-edge-to-split)]
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
