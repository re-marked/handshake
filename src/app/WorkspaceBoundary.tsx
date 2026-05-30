import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/app/store";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Catches render errors in the workspace tree so a bad layout shows a message + a reset
 * instead of blanking the whole app. The rail and slide-in note stay outside it.
 */
export class WorkspaceBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Workspace render error:", error, info.componentStack);
  }

  private reset = () => {
    useApp.getState().resetWorkspace();
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm font-medium text-destructive">The workspace hit an error.</p>
        <pre className="max-w-xl overflow-auto rounded-md border bg-muted/50 p-3 text-left text-xs text-muted-foreground">
          {error.message}
        </pre>
        <Button variant="outline" size="sm" onClick={this.reset}>
          Reset workspace
        </Button>
      </div>
    );
  }
}
