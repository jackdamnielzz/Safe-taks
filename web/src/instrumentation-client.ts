import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of the transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Set profilesSampleRate to 1.0 to profile 100%
  // of the sampled transactions.
  // We recommend adjusting this value in production
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  // Environment configuration
  environment: process.env.NODE_ENV || "development",
  release: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",

  // Enhanced error filtering
  beforeSend(event, hint) {
    // Filter out development-only errors
    if (process.env.NODE_ENV !== "production") {
      // Don't send hydration errors in development
      if (event.exception?.values?.[0]?.value?.includes("Hydration")) {
        return null;
      }

      // Don't send ResizeObserver loop errors
      if (event.exception?.values?.[0]?.value?.includes("ResizeObserver loop limit exceeded")) {
        return null;
      }
    }

    // Filter out network errors for non-critical requests
    if (event.exception?.values?.[0]?.type === "ChunkLoadError") {
      return null;
    }

    return event;
  },

  // User context integration
  initialScope: {
    tags: {
      component: "client",
      app: "safework-pro",
    },
  },

  // Integration configuration
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
    Sentry.browserProfilingIntegration(),
  ],

  // Disable debug mode to reduce console noise
  // Only enable when actively debugging Sentry issues
  debug: false,
});

// Export router transition hook for Sentry navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
