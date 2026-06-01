// Tiny ephemeral "pill" notifications for special actions (undo/redo, snapshots, new cards,
// auto-save…). Not a logging system — just brief, useful confirmations. A leaf module: depends
// only on zustand, so anything (store, undo, scheduler, components) can `toast(...)` freely.

import { create } from "zustand";
import type { ComponentType } from "react";

export type ToastTone = "default" | "success" | "muted";
type Icon = ComponentType<{ className?: string }>;

export interface Toast {
  id: number;
  message: string;
  detail?: string;
  icon?: Icon;
  tone: ToastTone;
}

interface ToastOptions {
  detail?: string;
  icon?: Icon;
  tone?: ToastTone;
  /** Coalesce: a later toast with the same key replaces the live one and resets its timer
   *  (so rapid "Saved" pills collapse into one that lingers, instead of stacking). */
  key?: string;
  durationMs?: number;
}

const DEFAULT_MS = 2200;
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

/** Show a pill. Returns its id. Pass `key` to coalesce repeats (e.g. auto-save). */
export function toast(message: string, opts: ToastOptions = {}): number {
  const tone = opts.tone ?? "default";
  const ms = opts.durationMs ?? DEFAULT_MS;

  if (opts.key && byKey.has(opts.key)) {
    const id = byKey.get(opts.key)!;
    useToasts.setState((s) => ({
      toasts: s.toasts.map((t) =>
        t.id === id ? { ...t, message, detail: opts.detail, icon: opts.icon, tone } : t,
      ),
    }));
    arm(id, ms);
    return id;
  }

  const id = ++seq;
  const t: Toast = { id, message, detail: opts.detail, icon: opts.icon, tone };
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
