import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowUpCircle,
  Bug,
  Camera,
  Contrast,
  FolderOpen,
  History,
  Info,
  Palette,
  Plus,
  RotateCcw,
  Share2,
  SquareArrowOutUpRight,
  StickyNote,
  Wrench,
  X,
} from "lucide-react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import type { Snapshot, TmStats } from "@/vault/io";
import { Input } from "@/components/ui/input";
import {
  APP_SCALE_MAX,
  APP_SCALE_MIN,
  APP_SCALE_STEP,
  CADENCE_MAX,
  CADENCE_MIN,
  DEFAULT_SETTINGS,
  FLOAT_H_MAX,
  FLOAT_H_MIN,
  FLOAT_W_MAX,
  FLOAT_W_MIN,
  type HighlightKeyword,
} from "@/vault/settings";
import { HL_COLORS } from "@/views/remarkHighlight";
import { SWATCH } from "@/views/HighlightPalette";
import { formatBytes, formatCadence, relativeTime } from "@/lib/format";
import { estimateGrowth } from "@/lib/timeMachineStats";
import { notify } from "@/app/toast";
import { LastSnapshot } from "@/app/LastSnapshot";
import { appVersion, buildLine } from "@/lib/buildInfo";
import { checkForUpdates } from "@/update/updater";
import { buildReport, writeReport } from "@/app/debug";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { pickFolder } from "@/vault/appState";

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notes", label: "Notes & workspace", icon: StickyNote },
  { id: "board", label: "Board", icon: Share2 },
  { id: "fade", label: "Card fade", icon: Contrast },
  { id: "timeMachine", label: "Time Machine", icon: History },
  { id: "networks", label: "Networks", icon: FolderOpen },
  { id: "developer", label: "Developer", icon: Wrench },
  { id: "about", label: "About", icon: Info },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

/** A labelled settings row: title + description on the left, a control on the right. */
function Row({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border/60 py-3.5 last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** A segmented single-choice control for small enum settings. */
function Seg<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      variant="outline"
      size="sm"
      onValueChange={(v) => {
        if (v) onChange(v as T);
      }}
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value} className="px-3 text-xs">
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function AppearanceSection() {
  const s = useApp((x) => x.settings);
  const set = useApp.getState().updateSettings;
  return (
    <>
      <Row label="Theme" description="Dark, light, warm paper, or follow your system.">
        <Seg
          value={s.theme}
          onChange={(theme) => set({ theme })}
          options={[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
            { value: "paper", label: "Paper" },
            { value: "system", label: "System" },
          ]}
        />
      </Row>
      {s.theme === "paper" && (
        <Row label="Paper style" description="Soft ivory, or an aged sepia with a touch of grain.">
          <Seg
            value={s.paperVariant}
            onChange={(paperVariant) => set({ paperVariant })}
            options={[
              { value: "soft", label: "Soft" },
              { value: "vintage", label: "Vintage" },
            ]}
          />
        </Row>
      )}
      <Row label="App scale" description="Zoom the whole interface up or down, from 80% to 300%.">
        <div className="flex items-center gap-3">
          <Slider
            value={[s.appScale]}
            min={APP_SCALE_MIN}
            max={APP_SCALE_MAX}
            step={APP_SCALE_STEP}
            onValueChange={([appScale]) => set({ appScale })}
            className="w-40"
            aria-label="App scale"
          />
          <span className="w-11 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
            {s.appScale}%
          </span>
        </div>
      </Row>
      <Row label="Font" description="The interface typeface.">
        <Seg
          value={s.font}
          onChange={(font) => set({ font })}
          options={[
            { value: "system", label: "System" },
            { value: "serif", label: "Serif" },
            { value: "mono", label: "Mono" },
          ]}
        />
      </Row>
      <Row label="Text weight" description="How heavy body text reads.">
        <Seg
          value={s.textWeight}
          onChange={(textWeight) => set({ textWeight })}
          options={[
            { value: "light", label: "Light" },
            { value: "normal", label: "Normal" },
            { value: "medium", label: "Medium" },
          ]}
        />
      </Row>
      <Row label="Density" description="Row spacing in list views like People.">
        <Seg
          value={s.density}
          onChange={(density) => set({ density })}
          options={[
            { value: "compact", label: "Compact" },
            { value: "comfortable", label: "Comfortable" },
            { value: "spacious", label: "Spacious" },
          ]}
        />
      </Row>
      <Row label="Reduce motion" description="Tone down springs and transitions.">
        <Switch checked={s.reduceMotion} onCheckedChange={(reduceMotion) => set({ reduceMotion })} />
      </Row>
    </>
  );
}

function NotesSection() {
  const s = useApp((x) => x.settings);
  const set = useApp.getState().updateSettings;
  return (
    <>
      <Row label="Default note mode" description="How a person's note opens when you tap a card.">
        <Seg
          value={s.noteDefault}
          onChange={(noteDefault) => set({ noteDefault })}
          options={[
            { value: "panel", label: "Panel" },
            { value: "float", label: "Float" },
            { value: "tab", label: "Tab" },
          ]}
        />
      </Row>
      <Row label="Autosave delay" description="How long after you stop typing before an edit is saved.">
        <Seg
          value={s.autosaveDelay}
          onChange={(autosaveDelay) => set({ autosaveDelay })}
          options={[
            { value: "instant", label: "Instant" },
            { value: "normal", label: "Normal" },
            { value: "relaxed", label: "Relaxed" },
          ]}
        />
      </Row>
      <Row label="Floating note size" description="Default width × height a popped-out note opens at.">
        <SizeControl field="floatSize" label="Float" />
      </Row>
      <Row label="Side panel size" description="Default size of the slide-in note panel (you can also drag its corner).">
        <SizeControl field="panelSize" label="Panel" />
      </Row>
      <KeywordManager />
    </>
  );
}

/** Two clamped number inputs (W × H) for a size setting, plus a one-click 16:9 button. */
function SizeControl({ field, label }: { field: "floatSize" | "panelSize"; label: string }) {
  const { w, h } = useApp((x) => x.settings[field]);
  const set = (next: { w: number; h: number }) => useApp.getState().updateSettings({ [field]: next });
  const clampW = (n: number) => Math.max(FLOAT_W_MIN, Math.min(FLOAT_W_MAX, Math.round(n) || FLOAT_W_MIN));
  const clampH = (n: number) => Math.max(FLOAT_H_MIN, Math.min(FLOAT_H_MAX, Math.round(n) || FLOAT_H_MIN));
  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        aria-label={`${label} width`}
        value={w}
        min={FLOAT_W_MIN}
        max={FLOAT_W_MAX}
        onChange={(e) => set({ w: clampW(e.target.valueAsNumber), h })}
        className="h-8 w-[4.5rem]"
      />
      <span className="text-xs text-muted-foreground">×</span>
      <Input
        type="number"
        aria-label={`${label} height`}
        value={h}
        min={FLOAT_H_MIN}
        max={FLOAT_H_MAX}
        onChange={(e) => set({ w, h: clampH(e.target.valueAsNumber) })}
        className="h-8 w-[4.5rem]"
      />
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        title="Make the height 16:9 against the current width"
        onClick={() => set({ w, h: clampH(Math.round((w * 9) / 16)) })}
      >
        16:9
      </Button>
    </div>
  );
}

/** Manage the auto-highlight keyword list (#17): a phrase + a colour, added/removed inline. */
function KeywordManager() {
  const keywords = useApp((x) => x.settings.highlightKeywords);
  const update = (next: HighlightKeyword[]) => useApp.getState().updateSettings({ highlightKeywords: next });
  return (
    <div className="border-b border-border/60 py-3.5 last:border-0">
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <div className="text-sm font-medium">Highlight keywords</div>
          <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Phrases auto-highlighted in your notes, in the colour you pick (e.g. “Why I met them”).
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => update([...keywords, { text: "", color: "yellow" }])}
        >
          <Plus /> Keyword
        </Button>
      </div>
      {keywords.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {keywords.map((k, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={k.text}
                placeholder="phrase…"
                onChange={(e) => update(keywords.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                className="h-8 min-w-0 flex-1"
              />
              <div className="flex shrink-0 gap-1">
                {HL_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    aria-label={`${c}${k.color === c ? " (selected)" : ""}`}
                    aria-pressed={k.color === c}
                    onClick={() => update(keywords.map((x, j) => (j === i ? { ...x, color: c } : x)))}
                    className={cn(
                      "size-6 overflow-hidden rounded-md ring-1 ring-inset transition-all hover:scale-110",
                      k.color === c ? "ring-2 ring-primary" : "ring-border/70",
                    )}
                  >
                    <span className="block size-full" style={{ backgroundColor: SWATCH[c] }} />
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-label="Remove keyword"
                onClick={() => update(keywords.filter((_, j) => j !== i))}
                className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground/60 transition hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BoardSection() {
  const s = useApp((x) => x.settings);
  const set = useApp.getState().updateSettings;
  return (
    <>
      <Row label="Show goal cards" description="Display aspirational goals as faint cards on the board.">
        <Switch checked={s.showGoalsOnBoard} onCheckedChange={(showGoalsOnBoard) => set({ showGoalsOnBoard })} />
      </Row>
      <Row label="Show “introduced by” links" description="Faint dotted lines from a person to whoever introduced them.">
        <Switch checked={s.showIntroducedBy} onCheckedChange={(showIntroducedBy) => set({ showIntroducedBy })} />
      </Row>
      <Row label="Show backlink links" description="Faint rose dotted lines from a [[mention]] in a note (no tie behind it).">
        <Switch checked={s.showBacklinks} onCheckedChange={(showBacklinks) => set({ showBacklinks })} />
      </Row>
      <Row label="Size cards by backlinks" description="Grow a card by how many other notes [[mention]] them.">
        <Switch
          checked={s.sizeCardsByBacklinks}
          onCheckedChange={(sizeCardsByBacklinks) => set({ sizeCardsByBacklinks })}
        />
      </Row>
      <Row label="Card spacing" description="Room the board gives cards when it arranges + spawns them.">
        <Seg
          value={s.cardSpacing}
          onChange={(cardSpacing) => set({ cardSpacing })}
          options={[
            { value: "compact", label: "Compact" },
            { value: "comfortable", label: "Comfortable" },
            { value: "spacious", label: "Spacious" },
          ]}
        />
      </Row>
      <Row label="Zoom range" description="How far you can zoom the board out and in.">
        <Seg
          value={s.zoomRange}
          onChange={(zoomRange) => set({ zoomRange })}
          options={[
            { value: "standard", label: "Standard" },
            { value: "wide", label: "Wide" },
          ]}
        />
      </Row>
      <Row label="Locate flash" description="How long a card stays highlighted after you jump to it.">
        <Seg
          value={s.locateFlash}
          onChange={(locateFlash) => set({ locateFlash })}
          options={[
            { value: "brief", label: "Brief" },
            { value: "normal", label: "Normal" },
            { value: "long", label: "Long" },
          ]}
        />
      </Row>
      <Row label="Default connection strength" description="Warmth a new tie starts at.">
        <Seg
          value={s.defaultTieStrength}
          onChange={(defaultTieStrength) => set({ defaultTieStrength })}
          options={[
            { value: "cold", label: "Cold" },
            { value: "dormant", label: "Dormant" },
            { value: "warm", label: "Warm" },
            { value: "close", label: "Close" },
          ]}
        />
      </Row>
    </>
  );
}

function FadeSection() {
  const s = useApp((x) => x.settings);
  const set = useApp.getState().updateSettings;
  return (
    <>
      <p className="-mt-1 mb-1 text-xs leading-relaxed text-muted-foreground">
        Cards dim as a connection goes quiet, so the people you’re most active with stand out. Turn it
        off to keep every card at full strength.
      </p>
      <Row label="Fade inactive cards" description="Dim cards by how long since you last interacted (staleness).">
        <Switch checked={s.fadeStaleCards} onCheckedChange={(fadeStaleCards) => set({ fadeStaleCards })} />
      </Row>
      {s.fadeStaleCards && (
        <Row label="Fade strength" description="How far stale cards dim.">
          <Seg
            value={s.fadeStrength}
            onChange={(fadeStrength) => set({ fadeStrength })}
            options={[
              { value: "subtle", label: "Subtle" },
              { value: "medium", label: "Medium" },
              { value: "strong", label: "Strong" },
            ]}
          />
        </Row>
      )}
    </>
  );
}

function NetworksSection() {
  const vaultPath = useApp((x) => x.vaultPath);
  async function openExisting() {
    const path = await pickFolder("Open a network folder");
    if (path) void useApp.getState().switchVault(path);
  }
  return (
    <>
      <Row label="Current network" description={vaultPath ?? "—"}>
        <Button
          variant="outline"
          size="sm"
          disabled={!vaultPath}
          onClick={() => vaultPath && void revealItemInDir(vaultPath)}
        >
          <SquareArrowOutUpRight /> Reveal
        </Button>
      </Row>
      <Row label="Manage networks" description="Create a new network or open an existing folder.">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => useApp.getState().setNewNetworkOpen(true)}>
            <Plus /> New
          </Button>
          <Button variant="outline" size="sm" onClick={openExisting}>
            <FolderOpen /> Open
          </Button>
        </div>
      </Row>
    </>
  );
}

function TimeMachineSection() {
  const tm = useApp((x) => x.settings.timeMachine);
  const session = useApp((x) => x.session);
  const vaultPath = useApp((x) => x.vaultPath);
  const set = useApp.getState().updateSettings;

  const [history, setHistory] = useState<Snapshot[]>([]);
  const [stats, setStats] = useState<TmStats | null>(null);
  const [headId, setHeadId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Snapshot | null>(null);
  const [unit, setUnit] = useState<"min" | "hr">(() =>
    tm.cadenceMin % 60 === 0 && tm.cadenceMin >= 60 ? "hr" : "min",
  );

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const [log, st2, st] = await Promise.all([session.tmLog(100), session.tmStats(), session.tmStatus()]);
      setHistory(log);
      setStats(st2);
      setHeadId(st.headId);
    } catch {
      // not a repo yet / disabled — leave the panel empty
    }
  }, [session]);

  function setCadence(value: number, u: "min" | "hr") {
    if (!Number.isFinite(value)) return;
    const mins = Math.max(CADENCE_MIN, Math.min(CADENCE_MAX, Math.round(u === "hr" ? value * 60 : value)));
    set({ timeMachine: { ...tm, cadenceMin: mins } });
  }

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function snapshotNow() {
    if (!session) return;
    setBusy(true);
    setNote(null);
    try {
      const id = await session.tmSnapshot("Manual snapshot");
      setNote(id ? "Snapshot taken." : "No changes since the last snapshot.");
      notify(id ? "Snapshot taken" : "No changes to snapshot", {
        body: id ? "A restore point was created." : "Nothing has changed since the last one.",
        icon: Camera,
        tone: id ? "success" : "muted",
      });
      if (id) useApp.getState().refreshLastSnapshot();
      await refresh();
    } catch {
      setNote("Couldn't snapshot.");
    } finally {
      setBusy(false);
    }
  }

  async function restore(snap: Snapshot) {
    if (!session || !vaultPath) return;
    setBusy(true);
    setConfirming(null);
    try {
      const short = snap.id.slice(0, 7);
      await session.tmSnapshot(`Before restore to ${short}`); // never lose the present
      await session.tmRestore(snap.id);
      await session.tmSnapshot(`Restored to ${short}`); // append-only — the restore is itself undoable
      await useApp.getState().switchVault(vaultPath); // full reload: rebuild switchboard + board
      await refresh();
      setNote(`Restored to ${relativeTime(snap.time)} snapshot.`);
      notify("Restored", { body: `Rolled back to the ${relativeTime(snap.time)} snapshot.`, icon: RotateCcw, tone: "success" });
    } catch {
      setNote("Restore failed.");
    } finally {
      setBusy(false);
    }
  }

  const est = stats ? estimateGrowth(stats, tm.cadenceMin) : null;
  const display = unit === "hr" ? Math.max(1, Math.round(tm.cadenceMin / 60)) : tm.cadenceMin;

  return (
    <>
      <Row
        label="Time Machine"
        description="Version this network with git — snapshot its history and roll back anytime."
      >
        <Switch
          checked={tm.enabled}
          onCheckedChange={(enabled) => {
            set({ timeMachine: { ...tm, enabled } });
            if (enabled) void session?.tmInit().then(refresh);
          }}
        />
      </Row>

      <div className="-mt-1 pb-1">
        <LastSnapshot />
      </div>

      {tm.enabled && (
        <>
          <Row label="Backups" description="Snapshot only on demand, or automatically as you work.">
            <Seg
              value={tm.mode}
              onChange={(mode) => set({ timeMachine: { ...tm, mode } })}
              options={[
                { value: "manual", label: "Manual" },
                { value: "auto", label: "Automatic" },
              ]}
            />
          </Row>
          {tm.mode === "auto" && (
            <Row
              label="Snapshot every"
              description="Shortest gap between automatic snapshots while you work (1 min – 1 day). Frequent is good — snapshots are tiny, and dense history makes richer visuals."
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={unit === "hr" ? 24 : CADENCE_MAX}
                  value={display}
                  onChange={(e) => setCadence(e.target.valueAsNumber, unit)}
                  className="h-8 w-20"
                />
                <Seg
                  value={unit}
                  onChange={(u) => {
                    setUnit(u);
                    setCadence(display, u);
                  }}
                  options={[
                    { value: "min", label: "min" },
                    { value: "hr", label: "hr" },
                  ]}
                />
              </div>
            </Row>
          )}
          <Row label="Snapshot now" description={note ?? "Capture the current state as a restore point."}>
            <Button variant="outline" size="sm" disabled={busy || !session} onClick={snapshotNow}>
              <Camera /> Snapshot
            </Button>
          </Row>
          {est && (
            <Row
              label="Growth estimate"
              description={
                est.ready
                  ? `You write ≈${formatBytes(est.writtenPerActiveDay)} of notes per active day (${est.activeDays} active day${est.activeDays === 1 ? "" : "s"} so far). At a snapshot every ${formatCadence(tm.cadenceMin)}, your history would grow ≈${formatBytes(est.perMonth)}/month.`
                  : "Keep using it — a personalised growth estimate appears once you have a few days of history."
              }
            >
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {stats ? `${formatBytes(stats.dataBytes)} data · ${formatBytes(stats.gitBytes)} history` : ""}
              </span>
            </Row>
          )}

          {/* History — newest first; restore rolls back (snapshotting the present first). */}
          <div className="border-b border-border/60 py-3.5">
            <div className="text-sm font-medium">History</div>
            {confirming && (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-md bg-muted/60 px-3 py-2 text-sm">
                <span>
                  Restore to <span className="font-medium">{relativeTime(confirming.time)}</span>? Your current
                  state is snapshotted first, so this is reversible.
                </span>
                <div className="flex shrink-0 gap-2">
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirming(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" disabled={busy} onClick={() => void restore(confirming)}>
                    <RotateCcw /> Restore
                  </Button>
                </div>
              </div>
            )}
            <div className="mt-2 max-h-72 space-y-0.5 overflow-y-auto">
              {history.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">No snapshots yet.</p>
              ) : (
                history.map((snap) => {
                  const current = snap.id === headId;
                  return (
                    <div
                      key={snap.id}
                      className="group flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm" title={snap.message || "Snapshot"}>
                          {snap.message || "Snapshot"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {relativeTime(snap.time)}
                          {current && " · current"}
                          {(snap.insertions > 0 || snap.deletions > 0) && (
                            <>
                              {" · "}
                              <span className="text-emerald-600 dark:text-emerald-400">+{snap.insertions}</span>{" "}
                              <span className="text-rose-600 dark:text-rose-400">−{snap.deletions}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 opacity-0 transition group-hover:opacity-100"
                        disabled={current || busy}
                        onClick={() => setConfirming(snap)}
                      >
                        Restore
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Reserved for the next release: a visual timeline + growth stats. */}
          <div className="mt-3.5 rounded-md border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground/70">
            Timeline &amp; growth insights — coming soon.
          </div>
        </>
      )}
    </>
  );
}

function DeveloperSection() {
  const dev = useApp((x) => x.settings.dev) ?? DEFAULT_SETTINGS.dev;
  const set = useApp.getState().updateSettings;
  const [reportPath, setReportPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function writeNow() {
    setBusy(true);
    try {
      setReportPath(await writeReport("manual"));
    } finally {
      setBusy(false);
    }
  }
  async function copyNow() {
    try {
      await navigator.clipboard.writeText(buildReport("clipboard"));
      setReportPath("Copied to clipboard.");
    } catch {
      setReportPath("Couldn't copy.");
    }
  }

  return (
    <>
      <p className="-mt-1 pb-2 text-xs leading-relaxed text-muted-foreground">
        Debugging tools — including a state report that Claude can read to help diagnose issues without
        seeing the app. All off by default.
      </p>
      <Row label="Snapshot status line" description="Show the ambient 'last snapshot' line in the board corner.">
        <Switch
          checked={dev.showStatusLine}
          onCheckedChange={(showStatusLine) => set({ dev: { ...dev, showStatusLine } })}
        />
      </Row>
      <Row label="Auto-report on error" description="Write a debug report automatically when an error is caught.">
        <Switch
          checked={dev.autoReportOnError}
          onCheckedChange={(autoReportOnError) => set({ dev: { ...dev, autoReportOnError } })}
        />
      </Row>
      <Row label="Redact personal data" description="Mask the vault path + platform in reports (safer to share).">
        <Switch checked={dev.redact} onCheckedChange={(redact) => set({ dev: { ...dev, redact } })} />
      </Row>
      <Row
        label="Debug report"
        description={
          reportPath ?? "Writes a full state report to .handshake/debug/latest.md (also Ctrl-Shift-D)."
        }
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={busy} onClick={writeNow}>
            <Bug /> Write
          </Button>
          <Button variant="outline" size="sm" onClick={copyNow}>
            Copy
          </Button>
          {reportPath?.startsWith("/") || reportPath?.includes(":\\") ? (
            <Button variant="outline" size="sm" onClick={() => void revealItemInDir(reportPath)}>
              <FolderOpen /> Reveal
            </Button>
          ) : null}
        </div>
      </Row>
    </>
  );
}

function AboutSection() {
  const [checking, setChecking] = useState(false);
  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      <p className="text-base font-medium text-foreground">Handshake {appVersion()}</p>
      <p>Obsidian for your network — a local-first map of the people you know.</p>
      <p>Your data is a folder of Markdown files on your machine.</p>
      <p className="pt-1 font-mono text-xs text-muted-foreground/80">{buildLine()}</p>
      <div className="pt-2">
        <button
          onClick={async () => {
            setChecking(true);
            try {
              await checkForUpdates(true);
            } finally {
              setChecking(false);
            }
          }}
          disabled={checking}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          <ArrowUpCircle className="size-3.5" />
          {checking ? "Checking…" : "Check for updates"}
        </button>
      </div>
      <div className="pt-1">
        <LastSnapshot />
      </div>
    </div>
  );
}

/** The Settings modal: a near-fullscreen dialog with a section rail + scrolling content. */
export function SettingsDialog() {
  const open = useApp((s) => s.settingsOpen);
  const [active, setActive] = useState<SectionId>("appearance");

  return (
    <Dialog open={open} onOpenChange={(o) => useApp.getState().setSettingsOpen(o)}>
      <DialogContent
        showCloseButton
        className="flex h-[85vh] w-[92vw] !max-w-5xl flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="border-b px-5 py-3">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-1">
          <nav className="w-52 shrink-0 border-r p-2">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActive(sec.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                  active === sec.id
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <sec.icon className="size-4 shrink-0" strokeWidth={1.75} />
                {sec.label}
              </button>
            ))}
          </nav>
          <ScrollArea className="min-h-0 flex-1">
            <div className="mx-auto max-w-2xl px-7 py-6">
              {active === "appearance" && <AppearanceSection />}
              {active === "notes" && <NotesSection />}
              {active === "board" && <BoardSection />}
              {active === "fade" && <FadeSection />}
              {active === "timeMachine" && <TimeMachineSection />}
              {active === "networks" && <NetworksSection />}
              {active === "developer" && <DeveloperSection />}
              {active === "about" && <AboutSection />}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
