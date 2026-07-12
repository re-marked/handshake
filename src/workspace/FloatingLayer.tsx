import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useApp } from "@/app/store";
import { FloatingWindow } from "@/workspace/FloatingWindow";

/**
 * Holds the floating note windows. An overlay over the board area: transparent to pointer
 * events itself (the board stays interactive), with the windows re-enabling them. Windows are
 * z-ordered by their stored `z` and painted in a band below the slide-in panel (z-40). The
 * layer clips them to the board area, so floats are in-app only – never lost off-screen.
 */
export function FloatingLayer() {
  const floats = useApp((s) => s.workspace.floats);
  const ref = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setBounds({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ordered = [...floats].sort((a, b) => a.z - b.z);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <AnimatePresence>
        {ordered.map((f, i) => (
          <FloatingWindow key={f.id} float={f} bounds={bounds} zIndex={21 + i} />
        ))}
      </AnimatePresence>
    </div>
  );
}
