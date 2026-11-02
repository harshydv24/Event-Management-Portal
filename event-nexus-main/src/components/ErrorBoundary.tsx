import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { logError } from '@/lib/errorUtils';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * React Error Boundary that catches uncaught render/lifecycle errors.
 *
 * Displays a friendly fallback UI instead of a blank screen or stack trace.
 * Logs the full error + component stack via `logError` for debugging.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logError('ErrorBoundary', { error, componentStack: errorInfo.componentStack });
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="text-center max-w-md mx-auto space-y-6">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 rounded-full surface-translucent-3 border border-border flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {/* Heading */}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Something went wrong
            </h1>

            {/* Description */}
            <p className="text-muted-foreground">
              An unexpected error occurred. Please try refreshing the page. If the problem
              persists, contact support.
            </p>

            {/* Action */}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center px-6 py-3 rounded-comfortable bg-primary text-primary-foreground font-emphasis hover:bg-primary/80 transition-all duration-200"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
