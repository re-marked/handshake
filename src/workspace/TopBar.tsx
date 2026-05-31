import { useApp } from "@/app/store";
import { findLeaf, leaves } from "@/workspace/ops";
import { TabStrip } from "@/workspace/TabStrip";

/**
 * Simple-mode only: ONE top bar that renders the *active* leaf's tab strip and follows the
 * focused pane (clicking another pane re-points it). In tabs mode this isn't mounted — each
 * leaf draws its own strip. Reusing TabStrip means exactly one strip per active-leaf id, so
 * the sliding `layoutId` highlight never collides.
 */
export function TopBar() {
  const activeLeaf = useApp(
    (s) => findLeaf(s.workspace.root, s.workspace.activeLeafId) ?? leaves(s.workspace.root)[0],
  );
  return <TabStrip leaf={activeLeaf} />;
}
