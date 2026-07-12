// Ephemeral system-style notifications for special actions (undo/redo, snapshots, saves, new
// cards…). Cards with a title, optional body, a timestamp, and a close button. Not a logging
// system – brief, useful confirmations. A leaf module (zustand only), so anything can notify().

import { create } from "zustand";
import type { ComponentType } from "react";

export type ToastTone = "default" | "success" | "muted";
type Icon = ComponentType<{ className?: string }>;

export interface Toast {
  id: number;
  title: string;
  body?: string;
  icon?: Icon;
  tone: ToastTone;
  at: number; // ms timestamp, for the displayed time
}

interface ToastOptions {
  body?: string;
  icon?: Icon;
  tone?: ToastTone;
  /** Coalesce: a later notify with the same key replaces the live card and resets its timer
   *  (so rapid "Saved" notifications collapse into one that lingers, instead of stacking). */
  key?: string;
  durationMs?: number;
}

const DEFAULT_MS = 4500;
const MAX_VISIBLE = 4;

export const useToasts = create<{ toasts: Toast[] }>(() => ({ toasts: [] }));

let seq = 0;
const timers = new Map<number, ReturnType<typeof setTimeout>>();
const byKey = new Map<string, number>(); // key → live toast id

function arm(id: number, ms: number) {
  const prev = timers.get(id);
  if (prev) clearTimeout(prev);
  timers.set(id, setTimeout(() => dismiss(id), ms));
}

/** Show a notification. Returns its id. Pass `key` to coalesce repeats (e.g. auto-save). */
export function notify(title: string, opts: ToastOptions = {}): number {
  const tone = opts.tone ?? "default";
  const ms = opts.durationMs ?? DEFAULT_MS;
  const at = Date.now();

  if (opts.key && byKey.has(opts.key)) {
    const id = byKey.get(opts.key)!;
    useToasts.setState((s) => ({
      toasts: s.toasts.map((t) =>
        t.id === id ? { ...t, title, body: opts.body, icon: opts.icon, tone, at } : t,
      ),
    }));
    arm(id, ms);
    return id;
  }

  const id = ++seq;
  const t: Toast = { id, title, body: opts.body, icon: opts.icon, tone, at };
  useToasts.setState((s) => ({ toasts: [...s.toasts, t].slice(-MAX_VISIBLE) }));
  if (opts.key) byKey.set(opts.key, id);
  arm(id, ms);
  return id;
}

export function dismiss(id: number): void {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  for (const [k, v] of byKey) if (v === id) byKey.delete(k);
  useToasts.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
}
