import { B, Code, GuidePage, guideMetadata, H2, P, Shot, Tip } from "@/components/guide";

export const metadata = guideMetadata("notes-and-backlinks");

export default function Page() {
  return (
    <GuidePage
      slug="notes-and-backlinks"
      lead="Every person in Handshake carries a note: structured fields up top, a free-form markdown scratchpad below. It's where the real thinking about a person lives — and writing a name in it wires your graph together."
    >
      <Shot
        src="/screenshot-note.webp"
        alt="A person's note — role, tags, handles, connections, and markdown with rose backlink chips"
        width={1999}
        height={1185}
      />

      <H2 id="anatomy">Anatomy of a note</H2>
      <P>
        Click anyone and their note slides in. The top half is structure: photo, name, role and
        company, tags, handles (Twitter, email, anything), and their <B>connections</B> with the
        warmth of each tie. The bottom half is prose — a markdown field with an{" "}
        <B>Edit / Preview</B> tumbler.
      </P>
      <P>
        The markdown is the real thing: headings, lists, tables, task lists, links. Notes autosave as
        you type, straight into the person&apos;s <Code>.md</Code> file on disk.
      </P>

      <H2 id="backlinks">Backlinks — write a name, draw a line</H2>
      <P>
        Type <Code>[[</Code> anywhere in a note and Handshake autocompletes from your people. Pick
        one — say <Code>[[Sarah Chen]]</Code> — and three things happen:
      </P>
      <P>
        In the note, the mention renders as a <B>rose chip</B> you can click to jump straight to
        Sarah. On the board, a <B>dotted rose line</B> appears between the two people (unless a real
        tie already connects them). And Sarah&apos;s card <B>grows a little</B> with each inbound
        mention — the people your notes orbit become visually central.
      </P>
      <P>
        Mention someone who doesn&apos;t exist yet and the chip renders dimmed — a quiet marker of a
        person worth adding. Backlinks are <B>derived, never stored</B>: they live in your prose, not
        in a hidden database, and they never rewrite the tie strengths you set by hand.
      </P>

      <H2 id="highlights">Highlights</H2>
      <P>
        Wrap text in <Code>==double equals==</Code> and it renders as a soft pastel highlight —
        yellow by default, or pick a color like <Code>==this=={"{green}"}</Code>. Right-click any
        highlight (in preview or in the editor) to recolor or remove it from a small palette. The
        colors are tuned to read gently on every theme.
      </P>

      <H2 id="keywords">Auto-highlighted keywords</H2>
      <P>
        In Settings → Notes you can define <B>keywords</B> — words that highlight themselves in a
        chosen color wherever they appear across all notes. Handy for things you always want to spot:
        &quot;intro&quot;, &quot;follow up&quot;, a project name.
      </P>

      <Tip>
        The editor is a real one — live markdown styling as you type, and your familiar{" "}
        <Code>Ctrl-Z</Code> works everywhere: inside the editor it undoes text, outside it undoes
        data and board moves.
      </Tip>
    </GuidePage>
  );
}
