"use client";

import * as Sentry from "@sentry/nextjs";
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  eventId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, eventId: null };
  }

  public static getDerivedStateFromError(): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, eventId: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Capture the exception in Sentry and get the event ID
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        component: "ErrorBoundary",
      },
    });

    this.setState({ eventId });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h1 className="text-xl font-semibold text-gray-900 mb-2">Er is iets misgegaan</h1>

            <p className="text-gray-600 mb-4">
              Er is een onverwachte fout opgetreden. Het ontwikkelteam is automatisch op de hoogte
              gesteld.
            </p>

            {this.state.eventId && (
              <p className="text-sm text-gray-500 mb-4">Foutcode: {this.state.eventId}</p>
            )}

            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Pagina opnieuw laden
              </button>

              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Ga terug
              </button>
            </div>

            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Ontwikkelaar informatie
                </summary>
                <div className="mt-2 text-xs text-gray-400">
                  <p>Event ID: {this.state.eventId}</p>
                  <p>Timestamp: {new Date().toISOString()}</p>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
