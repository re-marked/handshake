import { AnimatePresence, motion } from "motion/react";
import { ArrowUpCircle, Download, X } from "lucide-react";
import { checkForUpdates, dismissUpdate, installUpdate, openDownloadPage, useUpdate } from "@/update/updater";

const SPRING = { type: "spring", stiffness: 460, damping: 32, mass: 0.7 } as const;

/**
 * Update prompt, bottom-left (the Toaster owns bottom-right). Appears only when a newer version
 * exists; seamless "Restart & install" on auto platforms, a "Download" nudge on .deb/.rpm.
 * Mounted once at the app root.
 */
export function UpdateBanner() {
  const { state, dismissed } = useUpdate();
  const show = !dismissed && state.phase !== "idle";

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[100] w-80">
      <AnimatePresence initial={false}>
        {show && (
          <motion.div
            initial={{ opacity: 0, x: -28, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -28, scale: 0.96, transition: { duration: 0.16 } }}
            transition={SPRING}
            className="pointer-events-auto overflow-hidden rounded-xl border bg-card text-card-foreground shadow-lg"
          >
            {state.phase === "downloading" ? (
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ArrowUpCircle className="size-4 text-primary" />
                  Downloading {state.version}…
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-200"
                    style={{ width: `${state.pct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {state.pct}% — the app will restart when it&apos;s ready.
                </p>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ArrowUpCircle className="size-4 text-primary" />
                    Handshake {state.version} is available
                  </div>
                  <button
                    onClick={dismissUpdate}
                    aria-label="Dismiss"
                    className="-m-1 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {state.mode === "auto"
                    ? "Install it now — Handshake will restart into the new version."
                    : "A new version is ready to download for your Linux package."}
                </p>
                <div className="mt-3 flex gap-2">
                  {state.mode === "auto" ? (
                    <button
                      onClick={() => void installUpdate()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                    >
                      <ArrowUpCircle className="size-3.5" /> Restart &amp; install
                    </button>
                  ) : (
                    <button
                      onClick={openDownloadPage}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                    >
                      <Download className="size-3.5" /> Download
                    </button>
                  )}
                  <button
                    onClick={dismissUpdate}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    Later
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Fire a silent background check shortly after launch. Call once from the app root. */
export function scheduleUpdateCheck() {
  // A small delay so it never competes with first paint / vault load.
  setTimeout(() => void checkForUpdates(false), 4000);
}
