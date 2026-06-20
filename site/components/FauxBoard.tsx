"use client";

import { motion } from "motion/react";

// A live mini-board built from the app's own card + tie-line aesthetic — not a screenshot.
// Cards spring in, the rose ties draw, and a backlink (dotted rose) + an introduced-by line
// (dotted muted) draw in last, mirroring exactly what the app shows.

type Card = {
  id: string;
  name: string;
  role?: string;
  x: number; // 0–100, percentage across the board
  y: number;
  self?: boolean;
  big?: boolean; // "popular" — more backlinks → bigger polaroid (#16)
  hue: number; // avatar tint
};

const CARDS: Card[] = [
  { id: "you", name: "You", x: 50, y: 55, self: true, hue: 350 },
  { id: "sarah", name: "Sarah Chen", role: "Head of Growth", x: 25, y: 27, big: true, hue: 20 },
  { id: "tom", name: "Tom Okonkwo", role: "Founder", x: 77, y: 29, hue: 150 },
  { id: "maya", name: "Maya Patel", role: "Designer", x: 19, y: 79, hue: 280 },
  { id: "james", name: "James Liu", role: "Partner", x: 81, y: 75, hue: 235 },
  { id: "devon", name: "Devon Ross", role: "Writer", x: 53, y: 13, hue: 95 },
];
const at = (id: string) => CARDS.find((c) => c.id === id)!;

// strength → line weight + opacity (close · warm · cold)
const TIES = [
  { a: "you", b: "sarah", w: 2, o: 0.9 },
  { a: "you", b: "tom", w: 1.5, o: 0.7 },
  { a: "you", b: "maya", w: 1.5, o: 0.7 },
  { a: "you", b: "james", w: 1, o: 0.5 },
  { a: "you", b: "devon", w: 1, o: 0.45 },
];

function initials(name: string) {
  return name === "You"
    ? "★"
    : name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2);
}

export function FauxBoard() {
  return (
    <div className="@container relative aspect-[16/10] w-full select-none">
      {/* faint dotted grid, like the app canvas */}
      <div
        className="absolute inset-0 rounded-xl opacity-[0.5]"
        style={{
          backgroundImage: "radial-gradient(circle, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {TIES.map((t, i) => {
          const a = at(t.a);
          const b = at(t.b);
          return (
            <motion.line
              key={`${t.a}-${t.b}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--color-primary)"
              strokeWidth={t.w}
              strokeOpacity={t.o}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease: "easeOut" }}
            />
          );
        })}
        {/* introduced-by — muted dotted (Tom introduced Devon) */}
        <motion.line
          x1={at("tom").x}
          y1={at("tom").y}
          x2={at("devon").x}
          y2={at("devon").y}
          stroke="var(--color-muted-foreground)"
          strokeWidth={1}
          strokeOpacity={0.4}
          strokeDasharray="2 5"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, delay: 1.1, ease: "easeOut" }}
        />
        {/* backlink — rose dotted (Maya's note [[mentions]] Sarah) */}
        <motion.line
          x1={at("maya").x}
          y1={at("maya").y}
          x2={at("sarah").x}
          y2={at("sarah").y}
          stroke="var(--color-primary)"
          strokeWidth={1.25}
          strokeOpacity={0.55}
          strokeDasharray="2 4"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 1.35, ease: "easeOut" }}
        />
      </svg>

      <div className="absolute inset-0" style={{ fontSize: "min(13px, 2.3cqw)" }}>
        {CARDS.map((c, i) => {
          const scale = c.big ? 1.18 : 1;
          return (
            <motion.div
              key={c.id}
              className="absolute"
              style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%, -50%)" }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 360, damping: 22, delay: i * 0.09 }}
            >
              <div
                className="overflow-hidden rounded-md border bg-card shadow-md"
                style={{
                  width: `${7.4 * scale}em`,
                  borderColor: c.self ? "var(--color-primary)" : "var(--color-border)",
                }}
              >
                <div
                  className="grid aspect-square place-items-center font-semibold text-card-foreground/80"
                  style={{
                    background: `linear-gradient(145deg, oklch(0.4 0.08 ${c.hue}), oklch(0.32 0.04 ${c.hue}))`,
                    fontSize: "1.9em",
                  }}
                >
                  {initials(c.name)}
                </div>
                <div className="px-[0.6em] py-[0.45em] leading-tight">
                  <div className="truncate font-medium" style={{ fontSize: "0.92em" }}>
                    {c.name}
                  </div>
                  {c.role && (
                    <div className="truncate text-muted-foreground" style={{ fontSize: "0.78em" }}>
                      {c.role}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
