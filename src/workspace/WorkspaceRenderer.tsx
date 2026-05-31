import type { Node } from "@/workspace/model";
import { Leaf } from "@/workspace/Leaf";
import { SplitContainer } from "@/workspace/SplitContainer";

/** Renders the recursive workspace tree: leaves are tabbed panes, splits are resizable groups. */
export function WorkspaceRenderer({ node }: { node: Node }) {
  if (node.kind === "leaf") return <Leaf leaf={node} />;
  return <SplitContainer split={node} />;
}
