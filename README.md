<div align="center">

<img src="public/handshake-logo.png" alt="Handshake" width="128" />

# Handshake

**Obsidian for your network.**

Turn the people in your orbit into a graph you can actually think with —
plain markdown underneath, a calm rose-on-monochrome canvas on top.

<sub>A local-first desktop app · 100% on your machine · 0% in the cloud</sub>

[![Latest release](https://img.shields.io/badge/release-v0.7.2-b24a6d?style=flat-square&labelColor=2b2b2b)](https://github.com/re-marked/handshake/releases/latest)

</div>

---

## The idea

Most relationship tools are CRMs that feel like spreadsheets — or "AI for your network"
apps that quietly read your inbox. Handshake is neither.

It's a **personal crime-board for your online orbit**: everyone you talk to across DMs,
email, Twitter, Discord, and Zoom, laid out as a clean graph rooted on **you** and webbed
together by ties whose warmth you can read at a glance. Pin a goal — *"meet someone at
Stripe"* — and the board traces a path through the people you already know to the person
you want to reach.

It's a tool for remembering that the best introductions are usually one or two handshakes away.

## Yours, in plain text

Every person, every handshake, every goal is just a **markdown file with YAML
frontmatter** in a folder you choose. No database, no proprietary format, no account, no
telemetry.

- **The vault is the database.** Open it in Obsidian, edit it in any text editor, grep it from the terminal.
- **`git init` it** for full history; drop it in iCloud, Dropbox, or OneDrive and it syncs for free.
- **If Handshake vanished tomorrow**, you'd still have a tidy folder of plain text. Your data outlives the app.

This is the Obsidian philosophy, applied to people: structure where it helps you query,
prose where it helps you think.

## The feel

Handshake is built to be **calm, exact, trustworthy, and fast** — a tool you reach for,
not a toy you admire.

- **Monochrome, plus one accent.** The whole surface is a single near-neutral gray, with
  exactly one color doing real work: a deep, dusty **rose**. Rose means *connection* — the
  self node, the focused control, the path that lights up when the app answers "who do I
  know who can reach X?" Nothing else competes for your eye.
- **Dark-first**, with light, system, and a hand-tuned *Paper Vintage* theme.
- **Motion with weight.** Springs, not fades — notes slide in, cards settle, the found path
  pulses. Motion is a first-class delight here, never decoration.
- **Keyboard-first.** A command palette is the spine of the app; the mouse is for the graph.

## What's inside

**The board — the hero.** A pannable, zoomable card-tree of your whole network, rooted on
you. Each card carries a face, a name, and a role; the ties between them are weighted by
warmth — close, warm, cold, dormant. Drag a card and its whole branch follows.

**Notes — the Obsidian soul.** Click anyone and their note slides in: structured fields up
top, a free-form markdown scratchpad below, rendered live with tables, task lists, and
links. The deeper thinking about a person lives here.

**A real workspace.** Tabs, resizable splits, and pop-out floating notes in a true
Obsidian-style layout. Put a note beside the board, drag a tab into its own pane — and the
whole arrangement is right where you left it next time.

**Networks.** Keep separate worlds separate. Work and personal each get their own vault,
their own layout, their own settings — switch between them in a keystroke.

**Goals and people.** Pin aspirations as cards on the board or work them in a dedicated
view; tick one off and it grows into a real, connected person. A dense, searchable people
list rounds out the spatial view with a tabular one.

**Photos and themes.** Drop a photo onto anyone and it's theirs, on the card and the note.
Dial in density, motion, and theme to taste.

## Under the hood

For the curious — a little of how it's put together:

- **Tauri 2** for the shell: a native webview rather than a bundled browser, so it's a tiny
  app that starts instantly.
- **Thin Rust, fat TypeScript.** Rust does only the careful disk work — reading the vault,
  writing files atomically, noticing edits made outside the app. Everything that *is*
  Handshake — the data model, the graph, the rules — lives in one TypeScript brain called
  **Switchboard**: a pure engine that doesn't know a screen or a filesystem exists.
- **One way in.** Every change flows through a single funnel, so undo, validation, and
  byte-stable file writes are each solved once, in one place — and edits you make in
  Obsidian flow right back in.
- **React 19, Tailwind, and shadcn** for the interface; **motion** for the life in it.

Because the vault is just files, your network on disk reads like this:

```
your-network/
├─ people/         self.md, sarah-chen.md, tom-okonkwo.md …
├─ handshakes/     sarah-chen__tom-okonkwo.md     (one file per connection)
├─ goals/          meet-naval.md
├─ interactions/   2026-05-26-dm-sarah.md         (append-only, date-sorted)
├─ attachments/    the photos
└─ .handshake/     board layout & app settings    (managed for you)
```

## Built in the open

Handshake is a **personal tool, made to be lived in, not sold**. It runs on plain files you
own, and **AI comes last and never load-bearing** — every part of the app stands on its own,
with or without it.

<div align="center">

<br>

<img src="public/handshake-logo.png" alt="" width="44" />

<sub>Plain files. One rose accent. Yours.</sub>

</div>
