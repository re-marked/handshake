import { B, GuidePage, guideMetadata, H2, Kbd, P, Tip } from "@/components/guide";

export const metadata = guideMetadata("customization");

export default function Page() {
  return (
    <GuidePage
      slug="customization"
      lead="Handshake is monochrome plus one rose accent — but inside that frame, nearly everything is a dial. Settings live behind the gear in the left rail (or the command palette), and every choice is saved per network."
    >
      <H2 id="appearance">Appearance</H2>
      <P>
        Four themes: <B>dark</B> (the default), <B>light</B>, <B>system</B> (follows your OS), and a
        hand-tuned <B>Paper</B> theme in two flavors — soft ivory, or a vintage sepia with a touch of
        grain. Pick the interface font (system, serif, or mono), the text weight, and the density of
        list views.
      </P>
      <P>
        <B>App scale</B> is a real slider from 80% to 300% — the whole interface zooms live as you
        drag. And if motion isn&apos;t your thing, <B>reduce motion</B> tones the springs down
        app-wide.
      </P>

      <H2 id="board-settings">Board</H2>
      <P>
        Settings → Board controls what the map shows and how it breathes: goal cards on or off, the
        default warmth for new ties, introduced-by lines, backlink lines, whether cards grow with
        inbound mentions, card spacing for the auto-layout, and how far the zoom will travel. The{" "}
        <B>card fade</B> section handles dimming inactive people — off by default, with a strength
        dial when you want it.
      </P>

      <H2 id="notes-settings">Notes</H2>
      <P>
        Choose where notes open by default — slide-in panel, floating window, or tab — plus the
        starting size for floats and panels, the autosave delay, and your auto-highlighted{" "}
        <B>keywords</B> with their colors.
      </P>

      <H2 id="keyboard">The keyboard</H2>
      <P>
        The command palette is the spine of the app: <Kbd>Ctrl</Kbd>+<Kbd>P</Kbd> (or right-click
        anywhere) reaches people, views, networks, snapshots, and settings. <Kbd>Ctrl</Kbd>+
        <Kbd>Z</Kbd> / <Kbd>Ctrl</Kbd>+<Kbd>Shift</Kbd>+<Kbd>Z</Kbd> run the global undo timeline.{" "}
        <Kbd>Ctrl</Kbd>+<Kbd>Shift</Kbd>+<Kbd>D</Kbd> writes a debug report.
      </P>

      <H2 id="developer">Developer</H2>
      <P>
        A small honest corner: an ambient status line, automatic debug reports on errors, and a{" "}
        <B>redact</B> toggle that masks your vault path and platform in those reports — useful when
        you&apos;re sharing one in a bug report.
      </P>

      <Tip>
        A combination worth trying: <B>Paper Vintage</B> theme + <B>Mono</B> font + <B>Medium</B>{" "}
        weight. The app wears it well.
      </Tip>
    </GuidePage>
  );
}
