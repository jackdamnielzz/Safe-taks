"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Capture the exception in Sentry
    Sentry.captureException(error, {
      tags: {
        component: "global-error",
        source: "app-router",
      },
      extra: {
        digest: error.digest,
        errorBoundary: "global",
      },
    });
  }, [error]);

  return (
    <html lang="nl">
      <body>
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

            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Er is een onverwachte fout opgetreden
            </h1>

            <p className="text-gray-600 mb-4">
              De applicatie heeft een kritieke fout ondervonden. Het ontwikkelteam is automatisch op
              de hoogte gesteld.
            </p>

            {error.digest && <p className="text-sm text-gray-500 mb-4">Foutcode: {error.digest}</p>}

            <div className="space-y-2">
              <button
                onClick={reset}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Probeer opnieuw
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Ga naar homepage
              </button>
            </div>

            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Ontwikkelaar informatie
                </summary>
                <div className="mt-2 text-xs text-gray-400 font-mono bg-gray-100 p-2 rounded">
                  <p>Error: {error.message}</p>
                  <p>Digest: {error.digest}</p>
                  <p>Stack: {error.stack?.slice(0, 200)}...</p>
                </div>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
