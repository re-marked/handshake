import { cn } from "@/lib/utils";
import type { Node } from "@/workspace/model";
import { Leaf } from "@/workspace/Leaf";

/** Renders the recursive workspace tree. Splits get real (resizable) panes in step 2. */
export function WorkspaceRenderer({ node }: { node: Node }) {
  if (node.kind === "leaf") return <Leaf leaf={node} />;
  // Until step 2, a tree only ever has leaves; this naive equal-flex render keeps
  // the component complete + recursive so the model can already describe splits.
  return (
    <div className={cn("flex h-full w-full", node.dir === "row" ? "flex-row" : "flex-col")}>
      {node.children.map((child) => (
        <div key={child.id} className="min-h-0 min-w-0 flex-1">
          <WorkspaceRenderer node={child} />
        </div>
      ))}
    </div>
  );
}
