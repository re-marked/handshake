"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Cpu,
  Download as DownloadIcon,
  Rocket,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { APP_VERSION, REPO } from "@/lib/seo";
import { asset } from "@/lib/asset";

// ── OS brand glyphs (lucide dropped brand icons) ──────────────────────────────
function Apple({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.1-2.02-3.77-2.04-1.6-.16-3.13.94-3.94.94-.81 0-2.07-.92-3.4-.9-1.75.03-3.36 1.02-4.26 2.58-1.82 3.16-.47 7.83 1.3 10.39.86 1.25 1.89 2.66 3.24 2.61 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.28 3.15-2.54.99-1.45 1.4-2.85 1.42-2.93-.03-.01-2.73-1.05-2.76-4.17M14.6 4.38c.72-.87 1.2-2.08 1.07-3.28-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.08 3.18 1.15.09 2.32-.58 3.03-1.46" />
    </svg>
  );
}
function Windows({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.351" />
    </svg>
  );
}
function Linux({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M14.62 8.35c-.42.28-1.75 1.03-1.97 1.19-.45.33-.87.29-1.31 0-.22-.16-1.55-.91-1.97-1.19-.42-.29-.34-.6.07-.76.87-.34 1.32-.51 2.55-.51s1.68.17 2.55.51c.41.16.5.47.08.76m1.44 6.05c-.19-.66-.62-1.57-.99-2.24-.35-.63-.68-1.14-.75-1.62-.05-.34.02-.68.1-1.02.14-.6.28-1.2-.05-2.02-.42-1.06-1.48-1.79-2.37-1.79s-1.95.73-2.37 1.79c-.33.82-.19 1.42-.05 2.02.08.34.15.68.1 1.02-.07.48-.4.99-.75 1.62-.37.67-.8 1.58-.99 2.24-.36 1.25-.24 2.36.02 2.72.05.07.1.11.16.13.02-.29.15-.63.44-.95.34-.38.55-.61.55-1.13 0-.28-.02-.5-.02-.72 0-.3.13-.5.28-.5s.29.2.29.5c0 .21-.02.4-.02.66 0 .5.28.83.6 1.19.25.28.44.6.5.9.05-.02.1-.05.14-.11.26-.36.38-1.47.02-2.72M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0m3.53 20.13c-.53-.03-.98-.36-1.32-.72-.34.13-.72.2-1.11.2h-.1c-.4 0-.78-.07-1.12-.2-.34.36-.79.69-1.32.72-.88.05-1.55-.42-1.7-1.08-.13-.6.14-1.02.14-1.5 0-.42-.28-.7-.28-1.2 0-.2.02-.4.02-.6-.35.4-.55.6-.83.9-.35.38-.55.83-.5 1.3.02.16 0 .3-.1.4-.6.6-1.72.26-2.13-.34-.4-.6-.5-1.9-.06-3.4.24-.83.72-1.83 1.13-2.56.4-.72.75-1.24.8-1.66.04-.28-.03-.62-.11-.98-.16-.68-.35-1.45.14-2.66C9.6 3.9 10.83 3 12 3s2.4.9 2.92 2.2c.5 1.2.3 1.98.14 2.66-.08.36-.15.7-.11.98.05.42.4.94.8 1.66.41.73.9 1.73 1.13 2.56.43 1.5.34 2.8-.06 3.4-.4.6-1.53.94-2.13.34-.1-.1-.12-.24-.1-.4.05-.47-.15-.92-.5-1.3-.28-.3-.48-.5-.83-.9 0 .2.02.4.02.6 0 .5-.28.78-.28 1.2 0 .48.27.9.14 1.5-.15.66-.82 1.13-1.71 1.08" />
    </svg>
  );
}

type OS = "mac" | "windows" | "linux";

const OS_LIST: { key: OS; name: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "mac", name: "macOS", Icon: Apple },
  { key: "windows", name: "Windows", Icon: Windows },
  { key: "linux", name: "Linux", Icon: Linux },
];

interface Asset {
  name: string;
  browser_download_url: string;
  size: number;
}
interface Release {
  tag_name: string;
  html_url: string;
  assets: Asset[];
}

const RELEASES_URL = `${REPO}/releases`;
const LATEST_API = `${REPO.replace("github.com/", "api.github.com/repos/")}/releases/latest`;

function detectOS(): OS {
  if (typeof navigator === "undefined") return "mac";
  const s = `${navigator.userAgent} ${navigator.platform}`;
  if (/Win/i.test(s)) return "windows";
  if (/Mac|iPhone|iPad/i.test(s)) return "mac";
  if (/Linux|X11/i.test(s)) return "linux";
  return "mac";
}

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Pick the recommended + secondary release files for each OS from a release's assets. */
function pickAssets(assets: Asset[]) {
  const find = (re: RegExp) => assets.find((a) => re.test(a.name));
  const all = (re: RegExp) => assets.filter((a) => re.test(a.name));
  return {
    mac: { primary: find(/aarch64.*\.dmg$/i) ?? find(/\.dmg$/i), intel: find(/(x64|x86_64).*\.dmg$/i) },
    windows: { primary: find(/\.msi$/i) ?? find(/setup\.exe$/i) ?? find(/\.exe$/i) },
    linux: {
      primary: find(/\.AppImage$/i),
      deb: find(/\.deb$/i),
      rpm: find(/\.rpm$/i),
      all: all(/\.(AppImage|deb|rpm)$/i),
    },
  };
}

export function Download() {
  const [os, setOs] = useState<OS>("mac");
  const [release, setRelease] = useState<Release | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setOs(detectOS());
    let alive = true;
    fetch(LATEST_API, { headers: { Accept: "application/vnd.github+json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: Release) => alive && setRelease(data))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const picks = useMemo(() => (release ? pickAssets(release.assets) : null), [release]);
  const version = release?.tag_name ?? `v${APP_VERSION}`;
  const active = OS_LIST.find((o) => o.key === os)!;

  const primary = picks?.[os]?.primary;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-28 pt-16 sm:pt-24">
      {/* ── Hero ── */}
      <div className="text-center">
        <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
          Public Beta
        </span>
        <h1 className="font-display text-4xl font-semibold sm:text-6xl">Download Handshake</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Free, open source, and entirely on your machine. {version} is the latest release – Handshake
          is in public beta (pre-1.0), moving fast toward a stable 1.0.
        </p>
      </div>

      {/* ── OS tabs ── */}
      <div className="mt-10 flex justify-center">
        <div className="inline-flex rounded-xl border bg-card/40 p-1">
          {OS_LIST.map((o) => {
            const on = o.key === os;
            return (
              <button
                key={o.key}
                onClick={() => setOs(o.key)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  on ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <o.Icon className="size-4" />
                {o.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── The download (essentials, front and center) ── */}
      <section className="mt-10 rounded-2xl border bg-card/40 p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <active.Icon className="size-10 text-foreground" />
          <a
            href={primary?.browser_download_url ?? release?.html_url ?? RELEASES_URL}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
          >
            <DownloadIcon className="size-5" />
            {primary ? `Download for ${active.name}` : `Get Handshake for ${active.name}`}
          </a>
          <p className="text-sm text-muted-foreground">
            {primary ? (
              <>
                {version} · {primary.name.split(".").pop()?.toUpperCase()} · {mb(primary.size)}
              </>
            ) : failed ? (
              <>Opens the GitHub releases page</>
            ) : (
              <>Finding the latest build…</>
            )}
          </p>
          <a
            href={release?.html_url ?? RELEASES_URL}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            All files &amp; previous versions <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </section>

      {/* ── Install steps (essentials) ── */}
      <Steps os={os} />

      {/* ── Everything below is the "a bit lower" detail for anyone who needs it ── */}
      <div className="mt-14 space-y-4">
        {os === "mac" && (
          <Panel icon={ShieldAlert} title="If macOS won’t open it">
            <p>
              Handshake isn’t notarized yet, so macOS may say it’s from an “unidentified developer.”
              Right-click (or Control-click) the app → <b className="text-foreground">Open</b> →{" "}
              <b className="text-foreground">Open</b>. You only do this once.
            </p>
          </Panel>
        )}
        {os === "windows" && (
          <Panel icon={ShieldAlert} title="If SmartScreen warns you">
            <p>
              Handshake isn’t code-signed yet, so Windows Defender SmartScreen may flag it as an
              unrecognized app. Click <b className="text-foreground">More info</b> →{" "}
              <b className="text-foreground">Run anyway</b>. The full source is on GitHub if you’d like to
              check it first.
            </p>
          </Panel>
        )}
        {os === "linux" && picks?.linux && (
          <Panel icon={DownloadIcon} title="Other formats">
            <p className="mb-3">Prefer a system package? AppImage is the most portable, but these also work:</p>
            <ul className="space-y-2">
              {picks.linux.deb && (
                <li>
                  <Code>sudo dpkg -i {picks.linux.deb.name}</Code> <span className="text-xs">Debian / Ubuntu</span>
                </li>
              )}
              {picks.linux.rpm && (
                <li>
                  <Code>sudo rpm -i {picks.linux.rpm.name}</Code> <span className="text-xs">Fedora / RHEL</span>
                </li>
              )}
            </ul>
          </Panel>
        )}
        {os === "linux" && (
          <Panel icon={Terminal} title="Blank window on Wayland?">
            <p className="mb-3">
              On wlroots compositors (Hyprland, sway), WebKitGTK’s DMABUF renderer can throw a protocol
              error and show nothing. Launch it with the renderer disabled:
            </p>
            <Code block>WEBKIT_DISABLE_DMABUF_RENDERER=1 handshake</Code>
          </Panel>
        )}

        <Panel icon={Cpu} title="System requirements">
          <p>{REQUIREMENTS[os]}</p>
        </Panel>

        {os === "linux" && (
          <Detail icon={Terminal} title="Build it from source">
            <p className="mb-3">
              A native Tauri app – Rust backend, web frontend. On Arch, for example:
            </p>
            <Code block>{`git clone ${REPO}
cd handshake
# deps (Arch): sudo pacman -S --needed webkit2gtk-4.1 base-devel rust nodejs pnpm
pnpm install
pnpm tauri build`}</Code>
            <p className="mt-3 text-xs">
              On Debian/Fedora, install <code>webkit2gtk-4.1</code>, <code>rustup</code>, and{" "}
              <code>pnpm</code> from your package manager instead.
            </p>
          </Detail>
        )}

        <Detail icon={ShieldAlert} title="Verify your download">
          <p>
            Every release on GitHub lists its files and Tauri signatures. Compare the file name and size
            against what’s shown above, or check the{" "}
            <a href={RELEASES_URL} className="text-primary underline-offset-4 hover:underline">
              release page
            </a>{" "}
            for the exact assets.
          </p>
        </Detail>
      </div>

      {/* ── First run (shared, since the app is the same everywhere) ── */}
      <section className="mt-16 border-t pt-12">
        <div className="flex items-center gap-2 text-primary">
          <Rocket className="size-5" />
          <h2 className="font-display text-2xl font-semibold text-foreground">Your first two minutes</h2>
        </div>
        <ol className="mt-6 space-y-4">
          <FirstRun n={1}>
            <b className="text-foreground">Create a network</b> and name it – “Personal,” “Work,” whatever
            you’re mapping. It’s a plain folder of markdown files you choose.
          </FirstRun>
          <FirstRun n={2}>
            Handshake seeds <b className="text-foreground">your own card</b> at the center of the board –
            that’s you, the root everything connects back to.
          </FirstRun>
          <FirstRun n={3}>
            <b className="text-foreground">Add people</b> – type a name in the People view or right on the
            board. Set how you met and how warm the tie is.
          </FirstRun>
          <FirstRun n={4}>
            Open anyone’s note and write. Type <Code>[[Name]]</Code> to link people together – the board
            draws the connection for you.
          </FirstRun>
        </ol>
        <p className="mt-8 text-sm text-muted-foreground">
          Want the full tour?{" "}
          <a href={asset("/guide/getting-started")} className="text-primary underline-offset-4 hover:underline">
            Read the getting-started guide
          </a>{" "}
          – fifteen minutes, cover to cover.
        </p>
      </section>
    </main>
  );
}

const REQUIREMENTS: Record<OS, string> = {
  mac: "macOS 11 Big Sur or later. Universal – runs on Apple Silicon and Intel.",
  windows: "Windows 10 or 11, 64-bit. The WebView2 runtime installs automatically if it’s missing.",
  linux: "A modern 64-bit Linux with GTK 3 and webkit2gtk-4.1. Wayland and X11 both work.",
};

const INSTALL_STEPS: Record<OS, React.ReactNode[]> = {
  mac: [
    "Open the downloaded .dmg.",
    <>
      Drag <b className="text-foreground">Handshake</b> into your Applications folder.
    </>,
    "Open it from Applications or Spotlight.",
  ],
  windows: [
    "Run the downloaded .msi installer.",
    <>
      If SmartScreen appears, click <b className="text-foreground">More info → Run anyway</b>.
    </>,
    "Launch Handshake from the Start menu.",
  ],
  linux: [
    "Download the .AppImage.",
    <>
      Make it executable: <Code>chmod +x handshake_*.AppImage</Code>
    </>,
    <>
      Run it: <Code>./handshake_*.AppImage</Code>
    </>,
  ],
};

function Steps({ os }: { os: OS }) {
  return (
    <ol className="mt-8 space-y-3">
      {INSTALL_STEPS[os].map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {i + 1}
          </span>
          <span className="leading-relaxed text-muted-foreground">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card/30 p-5">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h3 className="font-display font-medium text-foreground">{title}</h3>
      </div>
      <div className="text-[15px] leading-relaxed text-muted-foreground [&_code]:font-mono">{children}</div>
    </div>
  );
}

function Detail({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-xl border bg-card/30 px-5 open:pb-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-4">
        <span className="flex items-center gap-2 font-display font-medium text-foreground">
          <Icon className="size-4 text-primary" />
          {title}
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="text-[15px] leading-relaxed text-muted-foreground">{children}</div>
    </details>
  );
}

function FirstRun({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {n}
      </span>
      <span className="leading-relaxed text-muted-foreground">{children}</span>
    </li>
  );
}

function Code({ children, block }: { children: React.ReactNode; block?: boolean }) {
  if (block) {
    return (
      <pre className="mt-1 overflow-x-auto rounded-lg border bg-card/60 p-3 font-mono text-[13px] leading-relaxed text-foreground/90">
        {children}
      </pre>
    );
  }
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground/90">{children}</code>
  );
}
