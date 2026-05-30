import { useEffect } from "react";
import { useApp } from "@/app/store";
import { FloatingWindow } from "@/app/FloatingWindow";

/** Renders all floating windows above the board. Esc closes the most recent. */
export function FloatLayer() {
  const floats = useApp((s) => s.floats);
  const closeFloat = useApp((s) => s.closeFloat);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && floats.length > 0) {
        closeFloat(floats[floats.length - 1].key);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [floats, closeFloat]);

  if (floats.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {floats.map((win) => (
        <FloatingWindow key={win.key} win={win} />
      ))}
    </div>
  );
}
