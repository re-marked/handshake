import { AnimatePresence, motion, useSpring } from "motion/react";
import { useApp } from "@/app/store";
import { tabLabel } from "@/workspace/model";
import { findView } from "@/workspace/ops";
import { TabIcon } from "@/workspace/TabStrip";
import { dragX, dragY } from "@/workspace/tabDragMotion";

// A soft, slightly laggy follow so the ghost trails behind the cursor (motion tea).
const FOLLOW = { stiffness: 520, damping: 34, mass: 0.55 } as const;

/**
 * The lifted copy of the tab you're dragging – it springs along behind the cursor and settles
 * (scale + fade) on drop. Rendered once at the app root, shown only while a tab drag is active.
 */
export function TabDragGhost() {
  const drag = useApp((s) => s.tabDrag);
  const view = useApp((s) => {
    if (!s.tabDrag) return undefined;
    const hit = findView(s.workspace.root, s.tabDrag.key);
    return hit ? hit.leaf.tabs[hit.index] : undefined;
  });
  const people = useApp((s) => s.switchboard.people);
  const photos = useApp((s) => s.photos);

  const x = useSpring(dragX, FOLLOW);
  const y = useSpring(dragY, FOLLOW);

  return (
    <AnimatePresence>
      {drag && view && (
        <motion.div
          style={{ x, y }}
          className="pointer-events-none fixed left-0 top-0 z-[60]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1.05 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 600, damping: 30, mass: 0.5 }}
        >
          <div className="ml-3 mt-2 flex h-8 items-center gap-2 rounded-lg border bg-card pl-2.5 pr-3 text-sm text-foreground shadow-2xl ring-1 ring-primary/25">
            <TabIcon view={view} photo={view.type === "person" ? photos.get(view.id) : undefined} />
            <span className="max-w-44 truncate">{tabLabel(view, (id) => people.get(id)?.name)}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
