import { A, B, GuidePage, guideMetadata, H2, Kbd, P, Shot, Steps, Tip } from "@/components/guide";
import { asset } from "@/lib/asset";

export const metadata = guideMetadata("getting-started");

export default function Page() {
  return (
    <GuidePage
      slug="getting-started"
      lead="Handshake is a local-first desktop app for mapping the people you know. This page takes you from download to a living map of your inner circle – it genuinely takes a few minutes."
    >
      <H2 id="install">Install Handshake</H2>
      <P>
        Grab the installer for your platform from the{" "}
        <a href={asset("/download")} className="text-primary underline-offset-4 hover:underline">
          download page
        </a>{" "}
        – macOS, Windows, and Linux are all first-class. Handshake is in public beta and isn&apos;t
        code-signed yet, so your OS may warn on first launch; the download page walks you past
        Gatekeeper and SmartScreen in one click each.
      </P>

      <H2 id="first-network">Create your first network</H2>
      <P>
        On first launch, Handshake asks you to create a <B>network</B> – a plain folder on your disk
        where everything will live, as markdown files you can read forever.
      </P>
      <Steps
        items={[
          <>
            Click <B>New network</B> and pick a folder (or let Handshake create a dedicated one).
          </>,
          <>Name yourself – Handshake seeds your own card as the root of the map.</>,
          <>
            You land on the <B>board</B>, with you at the center. That&apos;s the whole setup.
          </>,
        ]}
      />

      <H2 id="add-people">Add your first people</H2>
      <P>
        Start with your inner circle – the five or ten people you actually talk to. There are two
        natural ways in:
      </P>
      <Steps
        items={[
          <>
            <B>On the board:</B> click the add-person button in the bottom toolbar, type a name, and
            the card materializes next to you.
          </>,
          <>
            <B>In the People view:</B> open People from the left rail and just type a name in the
            search box – if nobody matches, Handshake offers to create them.
          </>,
        ]}
      />
      <P>
        Give each person a role and company on their card, a photo if you like (click the avatar on
        their <A href="/guide/notes-and-backlinks">note</A>), and a tag or two – <B>founder</B>, <B>friend</B>, <B>investor</B> – whatever
        helps you think.
      </P>
      <Shot
        src="/screenshot-people.webp"
        alt="The People view – a searchable, sortable list of everyone in your network"
        width={1998}
        height={1179}
      />

      <H2 id="connect">Connect them</H2>
      <P>
        Ties are what make it a network. Open someone&apos;s note, add a <B>connection</B> to another
        person, and pick how warm it is – close, warm, cold, or dormant. The board draws the line
        immediately, weighted by warmth.
      </P>
      <Tip>
        Don&apos;t aim for completeness on day one. Handshake works best grown slowly – add people
        when you think about them, and the map stays honest.
      </Tip>

      <H2 id="next">Where to go next</H2>
      <P>
        The <A href="/guide/board">board</A> is the heart of the app, so that&apos;s the next stop – then <A href="/guide/notes-and-backlinks">notes and backlinks</A>, where the map starts thinking with you. And whenever you&apos;re
        lost, press <Kbd>Ctrl</Kbd>+<Kbd>P</Kbd> – the command palette can reach everything:
        people, views, settings, snapshots.
      </P>
    </GuidePage>
  );
}
