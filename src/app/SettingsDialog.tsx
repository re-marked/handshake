import { useState, type ReactNode } from "react";
import { FolderOpen, Info, Palette, Plus, Share2, SquareArrowOutUpRight, StickyNote } from "lucide-react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/store";
import { pickFolder } from "@/vault/appState";

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notes", label: "Notes & workspace", icon: StickyNote },
  { id: "board", label: "Board", icon: Share2 },
  { id: "networks", label: "Networks", icon: FolderOpen },
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
      <Row label="App scale" description="Zoom the whole interface up or down.">
        <Seg
          value={s.appScale}
          onChange={(appScale) => set({ appScale })}
          options={[
            { value: "small", label: "90%" },
            { value: "default", label: "100%" },
            { value: "large", label: "110%" },
            { value: "larger", label: "125%" },
          ]}
        />
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
  const noteDefault = useApp((x) => x.settings.noteDefault);
  const set = useApp.getState().updateSettings;
  return (
    <Row label="Default note mode" description="How a person's note opens when you tap a card.">
      <Seg
        value={noteDefault}
        onChange={(noteDefault) => set({ noteDefault })}
        options={[
          { value: "panel", label: "Panel" },
          { value: "float", label: "Float" },
          { value: "tab", label: "Tab" },
        ]}
      />
    </Row>
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

function AboutSection() {
  const b = __BUILD_INFO__;
  const built = (() => {
    try {
      return new Date(b.time).toLocaleString();
    } catch {
      return b.time;
    }
  })();
  const meta = [b.tag || `v${b.version}`, b.sha, `built ${built}`].filter(Boolean).join(" · ");
  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      <p className="text-base font-medium text-foreground">Handshake {b.version}</p>
      <p>Obsidian for your network — a local-first map of the people you know.</p>
      <p>Your data is a folder of Markdown files on your machine.</p>
      <p className="pt-1 font-mono text-xs text-muted-foreground/80">{meta}</p>
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
              {active === "networks" && <NetworksSection />}
              {active === "about" && <AboutSection />}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
