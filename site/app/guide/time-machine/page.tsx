import { A, B, GuidePage, guideMetadata, H2, Kbd, P, Tip } from "@/components/guide";

export const metadata = guideMetadata("time-machine");

export default function Page() {
  return (
    <GuidePage
      slug="time-machine"
      lead="Every Handshake network is quietly a git repository. The Time Machine turns that into something you can feel: undo anything, snapshot moments, and roll the whole network back to any point in its history."
    >
      <H2 id="undo">Undo, everywhere</H2>
      <P>
        <Kbd>Ctrl</Kbd>+<Kbd>Z</Kbd> undoes your last change — an edit, a new person, a deleted
        connection, even a card you dragged across the board — and <Kbd>Ctrl</Kbd>+<Kbd>Shift</Kbd>+
        <Kbd>Z</Kbd> brings it back. Data changes and board moves share one chronological timeline,
        so undo always means &quot;the last thing I did,&quot; whatever kind of thing it was.
      </P>
      <P>
        Text fields keep their own undo: while you&apos;re typing in a note, <Kbd>Ctrl</Kbd>+
        <Kbd>Z</Kbd> undoes text like any editor, and only acts on the network once you&apos;re back
        out.
      </P>

      <H2 id="snapshots">Snapshots</H2>
      <P>
        A <B>snapshot</B> is a named point-in-time of your entire <A href="/guide/networks-and-files">network</A> — every person, tie, goal,
        and note. Out of the box Handshake takes them automatically: after your edits settle, when
        you switch networks, and when you close the app, rate-limited to a cadence you control
        (every 5 minutes by default). You can also take one deliberately any time — from Settings →
        Time Machine or the command palette.
      </P>
      <P>
        There&apos;s no git to learn and no system git required — the engine is built in. Snapshots
        are tiny (text diffs), so dense history costs almost nothing.
      </P>

      <H2 id="restore">Restoring</H2>
      <P>
        Settings → Time Machine lists your history. Pick any snapshot and <B>restore</B> — Handshake
        snapshots the present first, rolls the network back, then records the restore itself. History
        is <B>append-only</B>: a restore never destroys anything, so you can always change your mind
        about changing your mind.
      </P>

      <Tip>
        The board&apos;s corner can show an ambient <B>&quot;Last snapshot&quot;</B> status line
        (Settings → Developer) — a quiet heartbeat that your history is being kept.
      </Tip>
    </GuidePage>
  );
}
