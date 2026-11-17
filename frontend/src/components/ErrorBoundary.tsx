import { Component, type ReactNode } from "react";
import { ErrorState } from "./StateViews";

interface Props {
  children: ReactNode;
  resetKey?: string; // when this changes (e.g. the URL), the boundary clears itself
}
interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Statskill page error:", error);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          message="This page hit an unexpected error. You can try again or go to another page."
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}