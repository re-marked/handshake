import type { Node } from "@/workspace/model";
import { Leaf } from "@/workspace/Leaf";
import { SplitContainer } from "@/workspace/SplitContainer";

/** Renders the recursive workspace tree: leaves are tabbed panes, splits are resizable groups.
 *  `simple` (one-bar mode) hides the per-leaf tab strips — the single TopBar carries them. */
export function WorkspaceRenderer({ node, simple = false }: { node: Node; simple?: boolean }) {
  if (node.kind === "leaf") return <Leaf leaf={node} simple={simple} />;
  return <SplitContainer split={node} simple={simple} />;
}
