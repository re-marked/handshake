// A small note card showing the backlinks feature: `[[mentions]]` as rose chips + a soft ==highlight==.
const chip = "rounded bg-primary/15 px-1 py-0.5 font-medium text-primary";

export function FauxNote() {
  return (
    <div className="w-full max-w-sm rounded-xl border bg-card p-4 text-[15px] leading-relaxed shadow-xl">
      <div className="mb-3 flex items-center gap-2.5 border-b border-border/60 pb-3">
        <div
          className="grid size-9 place-items-center rounded-md font-semibold text-card-foreground/80"
          style={{ background: "linear-gradient(145deg, oklch(0.4 0.08 280), oklch(0.32 0.04 280))" }}
        >
          MP
        </div>
        <div className="min-w-0">
          <div className="font-medium">Maya Patel</div>
          <div className="text-xs text-muted-foreground">Designer · Figma</div>
        </div>
      </div>
      <p className="text-foreground/90">
        Coffee was lovely. She used to work with <span className={chip}>Sarah Chen</span> — could be a
        warm intro to <span className={chip}>Tom Okonkwo</span>.{" "}
        <span
          style={{
            backgroundColor: "oklch(0.85 0.12 95 / 0.28)",
            borderRadius: "0.25em",
            padding: "0.02em 0.18em",
          }}
        >
          Follow up in two weeks.
        </span>
      </p>
    </div>
  );
}
