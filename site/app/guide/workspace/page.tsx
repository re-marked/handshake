import { B, GuidePage, guideMetadata, H2, P, Shot, Tip } from "@/components/guide";

export const metadata = guideMetadata("workspace");

export default function Page() {
  return (
    <GuidePage
      slug="workspace"
      lead="Handshake has a true Obsidian-style workspace: tabs in every pane, resizable splits, and notes that pop out into floating windows. Arrange it how you think — it's saved as you go, per network."
    >
      <Shot
        src="/screenshot-split.webp"
        alt="A split workspace — goals and a floating note beside the board"
        width={1999}
        height={1181}
      />

      <H2 id="tabs">Tabs</H2>
      <P>
        Every pane has its own tab strip, and tabs behave exactly like a browser&apos;s: drag to
        reorder, drag one into another pane to move it, close from the always-visible ×. Crowd a pane
        with enough tabs and they shrink to icons rather than scrolling away.
      </P>

      <H2 id="splits">Splits</H2>
      <P>
        Drag a tab to any <B>edge</B> of a pane — left, right, top, bottom — and the workspace splits
        there, with a live preview of where it&apos;ll land. Splits resize by dragging the divider and
        nest as deep as you like: board on the left, a person&apos;s note top-right, your goals below
        it.
      </P>

      <H2 id="note-modes">Panel, float, or tab</H2>
      <P>
        A person&apos;s note can live three ways: as the <B>slide-in panel</B> (the default — quick,
        transient), as a <B>floating window</B> you can move and resize anywhere, or as a{" "}
        <B>tab</B> docked into the workspace like any other view. The icons in the note&apos;s header
        switch between them, and a pin keeps a panel open while you click around the board.
      </P>
      <P>
        Which mode notes open in by default — and how big floats and panels start — is yours to set
        in Settings → Notes.
      </P>

      <H2 id="persistence">It stays where you left it</H2>
      <P>
        The whole arrangement — the split tree, every pane&apos;s tabs, floating windows, sizes — is
        saved continuously, per network. Quit, reopen, and the workspace is exactly as you left it.
        Work and personal networks each remember their own layout.
      </P>

      <Tip>
        Close every tab and you&apos;ll find a small empty-state with an <B>Open board</B> button —
        the board itself is just a tab, so even it can be closed. You&apos;re never stuck.
      </Tip>
    </GuidePage>
  );
}
