import { A, B, GuidePage, guideMetadata, H2, P, Shot, Tip, WarmthLegend } from "@/components/guide";

export const metadata = guideMetadata("board");

export default function Page() {
  return (
    <GuidePage
      slug="board"
      lead="The board is Handshake's home view: a pannable, zoomable map of your whole network, rooted on you. Every person is a card with a face; every relationship is a line you can read at a glance."
    >
      <Shot
        src="/screenshot-hero.webp"
        alt="The Handshake board – people connected by warmth-weighted ties, with a note slid in"
        width={1999}
        height={1074}
      />

      <H2 id="reading">Reading the board</H2>
      <P>
        You sit at the center. Everyone else fans out around you, connected by ties whose{" "}
        <B>warmth</B> sets how strongly the line reads:
      </P>
      <WarmthLegend />
      <P>
        Two other kinds of lines appear as your network deepens: <B>introduced-by</B> lines (dotted,
        muted) trace who brought whom into your orbit, and <A href="/guide/notes-and-backlinks"><B>backlink</B> lines</A> (dotted, rose) appear
        when one person&apos;s note mentions another. Cards with many inbound mentions grow slightly –
        the people your notes keep coming back to literally loom larger.
      </P>

      <H2 id="moving">Moving around</H2>
      <P>
        Drag the canvas to pan, scroll to zoom. The <B>toolbar</B> at the bottom center carries
        everything else: add a person, zoom out/in or reset, fit the whole network in view, and the
        wand – <B>re-tidy</B> – which re-flows every card back to a clean auto-layout (undoable, like
        everything).
      </P>
      <P>
        Cards go where you drop them, and the layout is saved per network – your spatial memory is
        part of the data. If you lose someone, the command palette jumps to them and flashes their
        card.
      </P>

      <H2 id="filter">Filtering</H2>
      <P>
        The funnel icon in the toolbar opens the <B>board filter</B>: pick tags or tie strengths, and
        everyone who doesn&apos;t match fades back while the matches stay bright. It dims rather than
        hides, so the shape of your network stays intact while you focus – &quot;show me the
        investors I&apos;m close to&quot; is two clicks.
      </P>

      <H2 id="goals">Goals on the board</H2>
      <P>
        Goals – <B>&quot;meet someone at Stripe&quot;</B>, <B>&quot;hire a founding designer&quot;</B>{" "}
        – can live directly on the board as dashed cards. Pin one near the people who can get you
        there; tick it off when it happens. They&apos;re managed in the Goals view and can be hidden
        entirely in <A href="/guide/customization">Settings → Board</A>.
      </P>

      <Tip>
        A quiet setting worth knowing: <B>fade inactive cards</B> (<A href="/guide/customization">Settings → Card fade</A>) dims people
        you haven&apos;t touched in a while, so the active edge of your network stands out. It&apos;s
        off by default – try it once your map grows past a few dozen people.
      </Tip>
    </GuidePage>
  );
}
