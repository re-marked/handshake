import { B, Code, GuidePage, guideMetadata, H2, Kbd, P, Tip } from "@/components/guide";
import { VaultWindow } from "@/components/VaultWindow";

export const metadata = guideMetadata("networks-and-files");

export default function Page() {
  return (
    <GuidePage
      slug="networks-and-files"
      lead="A network is just a folder of markdown files on your disk — that's the whole trick. This page covers keeping separate worlds separate, what's actually in the folder, and how to sync or back it up."
    >
      <H2 id="networks">Multiple networks</H2>
      <P>
        Work and personal don&apos;t have to share a map. Each <B>network</B> is its own folder with
        its own people, layout, workspace, and settings. Create as many as you like; switch with the
        network chip in the top-right corner or through the command palette (<Kbd>Ctrl</Kbd>+
        <Kbd>P</Kbd>). Handshake reopens where you left off.
      </P>

      <H2 id="files">What&apos;s in the folder</H2>
      <P>
        Every entity is one markdown file with YAML frontmatter — human-readable, greppable, yours:
      </P>
      <VaultWindow />
      <P>
        <Code>people/</Code> holds a file per person, <Code>handshakes/</Code> one per connection,{" "}
        <Code>goals/</Code> and <Code>interactions/</Code> what they say, <Code>attachments/</Code>{" "}
        the photos. The <Code>.handshake/</Code> folder is the app&apos;s managed sidecar — board
        positions, workspace layout, settings — and can always be regenerated.
      </P>

      <H2 id="editing-outside">Edit files outside the app</H2>
      <P>
        The folder is a valid <B>Obsidian vault</B> — open it there, or in any text editor, and
        change whatever you like. Handshake watches the folder: external edits flow back into the app
        live. Writes go the other way byte-stably, so your files never churn under version control.
      </P>

      <H2 id="sync">Sync & backup</H2>
      <P>
        Handshake deliberately ships no cloud. Because a network is plain files, everything works:
        put the folder in iCloud, Dropbox, OneDrive, or Syncthing to sync it between machines;{" "}
        <Code>git init</Code> it (or just use the built-in Time Machine, which is already git) for
        history you can push anywhere.
      </P>

      <Tip>
        The real promise of plain text: if Handshake vanished tomorrow, your network would still be a
        tidy, readable folder. Nothing about your relationships is locked in.
      </Tip>
    </GuidePage>
  );
}
