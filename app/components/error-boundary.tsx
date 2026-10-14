import {
  Component,
  Fragment,
  type ErrorInfo,
  type ReactNode,
} from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
  /** Number of times we've remounted children after a caught error. Used as a
   *  React `key` on the children fragment so a bumped count forces a fresh
   *  unmount/remount instead of a re-render. */
  retryKey: number;
  /** Whether the auto-retry slot has been consumed. We auto-retry exactly once
   *  per boundary lifetime (until a manual reset via "Try again"), then surface
   *  the error UI on a second consecutive throw so we don't loop forever. */
  autoRetryUsed: boolean;
}

const AUTO_RETRY_DELAY_MS = 100;

/**
 * Route-level error boundary. Without this, a render-phase throw anywhere
 * inside the routed tree unmounts the whole MFE and the single-spa host
 * renders a blank div — the classic "white screen, no console error" symptom.
 *
 * The boundary auto-retries once on the first error. This catches the common
 * "cache-cold race on initial mount" pattern: the first mount throws because a
 * dependent dataset is still empty, but that failed mount triggered the fetch
 * that warms the cache, so the remount succeeds against populated data. The
 * 100ms delay lets any in-flight `setState` from the failed mount flush and
 * the dependent fetches start resolving. If the retry also fails, we stop and
 * show the visible error panel instead of looping forever.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null,
    info: null,
    retryKey: 0,
    autoRetryUsed: false,
  };

  private retryTimer: number | null = null;

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Prefix is intentional — makes the error easy to spot in the host console
    // where other MFEs may also be logging.
    console.error("[ROUTE BOUNDARY]", error, info);
    this.setState({ info });

    if (this.state.autoRetryUsed) {
      // Already auto-retried once — don't loop. The user will see the visible
      // error panel below (and can still reset manually via "Try again").
      return;
    }

    // Schedule the remount on a macrotask so React finishes commit on the
    // failed mount before we clear the error and bump the key. A synchronous
    // setState here would be coalesced into the same batch as the error-derived
    // state update and the unmount/remount cycle wouldn't happen.
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null;
      this.setState((s) => ({
        error: null,
        info: null,
        retryKey: s.retryKey + 1,
        autoRetryUsed: true,
      }));
    }, AUTO_RETRY_DELAY_MS);
  }

  componentWillUnmount(): void {
    if (this.retryTimer !== null) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  handleReset = (): void => {
    this.setState((s) => ({
      error: null,
      info: null,
      retryKey: s.retryKey + 1,
      autoRetryUsed: false,
    }));
  };

  render(): ReactNode {
    if (this.state.error) {
      const message = this.state.error.message || String(this.state.error);
      const stack = this.state.error.stack ?? "";
      const componentStack = this.state.info?.componentStack ?? "";
      // Stack + component stack are leaky in prod (file paths, internal symbol
      // names) and aren't useful to end users — show them in dev only. The full
      // error is still logged via `componentDidCatch` for any deploy.
      const showDiagnostics = import.meta.env.DEV;

      return (
        <div className="copa:flex copa:min-h-svh copa:items-start copa:justify-center copa:bg-background copa:p-6">
          <div className="copa:w-full copa:max-w-3xl copa:space-y-4">
            <div>
              <h1 className="copa:text-xl copa:font-semibold copa:text-foreground">
                Something went wrong on this page
              </h1>
              <p className="copa:mt-1 copa:text-sm copa:text-muted-foreground">
                The page errored while rendering. Details are below — share this
                with engineering if it keeps happening.
              </p>
            </div>
            <div className="copa:rounded-md copa:border copa:border-destructive/40 copa:bg-destructive/5 copa:p-4">
              <p className="copa:text-sm copa:font-medium copa:text-destructive">
                {message}
              </p>
            </div>
            {showDiagnostics && (
              <details className="copa:rounded-md copa:border copa:bg-muted/30 copa:p-4 copa:text-xs">
                <summary className="copa:cursor-pointer copa:text-sm copa:font-medium">
                  Stack trace
                </summary>
                <pre className="copa:mt-2 copa:overflow-auto copa:whitespace-pre-wrap">
                  {stack}
                </pre>
              </details>
            )}
            {showDiagnostics && componentStack && (
              <details className="copa:rounded-md copa:border copa:bg-muted/30 copa:p-4 copa:text-xs">
                <summary className="copa:cursor-pointer copa:text-sm copa:font-medium">
                  Component stack
                </summary>
                <pre className="copa:mt-2 copa:overflow-auto copa:whitespace-pre-wrap">
                  {componentStack}
                </pre>
              </details>
            )}
            <div className="copa:flex copa:gap-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="copa:inline-flex copa:items-center copa:rounded-md copa:border copa:border-input copa:bg-background copa:px-4 copa:py-2 copa:text-sm copa:font-medium copa:hover:bg-accent"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => {
                  // Full reload of the CURRENT url — preserves the host-provided
                  // MFE basename. Navigating to "/" would escape the mounted app
                  // to the host root.
                  window.location.reload();
                }}
                className="copa:inline-flex copa:items-center copa:rounded-md copa:bg-primary copa:px-4 copa:py-2 copa:text-sm copa:font-medium copa:text-primary-foreground copa:hover:bg-primary/90"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    // `key` is the lynchpin of the auto-retry: bumping it on retry causes React
    // to fully unmount the old subtree and mount a fresh one, resetting every
    // hook's local state. Without the key, React would re-render in place with
    // the same hook state that just threw, and we'd loop on the same error.
    return (
      <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>
    );
  }
}
