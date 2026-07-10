import type { Metadata } from "next";
import { Footer, Nav } from "@/components/chrome";
import { CTA, Ghost } from "@/components/chrome";
import { asset } from "@/lib/asset";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/**
 * 404, in the app's own vocabulary: in Handshake, a [[mention]] of someone who doesn't exist
 * renders as a dimmed, dash-underlined "unresolved backlink." This page IS one.
 */
export default function NotFound() {
  return (
    <div className="relative">
      <Nav />
      <main className="mx-auto flex w-full max-w-[2000px] flex-col items-start justify-center px-6 py-28 sm:px-12 sm:py-36 lg:px-20">
        <p className="font-mono text-sm text-muted-foreground">404 · unresolved backlink</p>

        <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] sm:text-7xl">
          <span className="cursor-default text-muted-foreground/70 underline decoration-muted-foreground/40 decoration-dashed underline-offset-8">
            [[this page]]
          </span>
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
          You followed a link to a page that isn&apos;t in the network. In Handshake, mentioning
          someone who doesn&apos;t exist yet renders exactly like this — dimmed, dashed, waiting to
          be created. This page, however, will remain a stranger.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <CTA href={asset("/")}>Back to the board</CTA>
          <Ghost href={asset("/guide")}>Read the guide</Ghost>
        </div>

        <p className="mt-8 text-sm text-muted-foreground/60">
          Convinced this page should exist?{" "}
          <a
            href="https://github.com/re-marked/handshake/issues"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Tell us on GitHub
          </a>
          .
        </p>
      </main>
      <Footer />
    </div>
  );
}
