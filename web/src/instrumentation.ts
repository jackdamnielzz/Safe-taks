export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Server-side instrumentation
    const { init } = await import("@sentry/nextjs");

    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Set tracesSampleRate to 1.0 to capture 100%
      // of the transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

      // Set profilesSampleRate to 1.0 to profile 100%
      // of the sampled transactions.
      // We recommend adjusting this value in production
      profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

      // Environment configuration
      environment: process.env.NODE_ENV || "development",
      release: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",

      // Enhanced error filtering for server-side
      beforeSend(event, hint) {
        // Filter out development-only errors
        if (process.env.NODE_ENV !== "production") {
          // Don't send Firebase admin SDK initialization warnings
          if (event.message?.includes("Firebase admin SDK")) {
            return null;
          }

          // Filter out expected development warnings
          if (event.level === "warning" && event.logger === "firebase") {
            return null;
          }
        }

        // Filter out network timeout errors for non-critical operations
        if (event.exception?.values?.[0]?.type === "TimeoutError") {
          return null;
        }

        return event;
      },

      // User context integration
      initialScope: {
        tags: {
          component: "server",
          app: "safework-pro",
        },
      },

      // Integration configuration
      integrations: [
        // Server-specific integrations (prismaIntegration is optional)
      ],

      // Disable debug mode to reduce console noise
      // Only enable when actively debugging Sentry issues
      debug: false,

      // Server-specific options
      tracePropagationTargets: [
        "localhost",
        /^https:\/\/[^\/]+\.firebaseapp\.com/,
        /^https:\/\/[^\/]+\.vercel\.app/,
        /^https:\/\/[^\/]+\.googleapis\.com/,
      ],
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime instrumentation
    const { init } = await import("@sentry/nextjs");

    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Set tracesSampleRate to 1.0 to capture 100%
      // of the transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

      // Environment configuration
      environment: process.env.NODE_ENV || "development",
      release: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",

      // Enhanced error filtering for edge runtime
      beforeSend(event, hint) {
        // Filter out development-only errors
        if (process.env.NODE_ENV !== "production") {
          // Don't send edge runtime specific warnings in development
          if (event.message?.includes("edge runtime")) {
            return null;
          }
        }

        return event;
      },

      // User context integration
      initialScope: {
        tags: {
          component: "edge",
          app: "safework-pro",
        },
      },

      // Disable debug mode to reduce console noise
      // Only enable when actively debugging Sentry issues
      debug: false,

      // Edge runtime specific options
      tracePropagationTargets: [
        "localhost",
        /^https:\/\/[^\/]+\.firebaseapp\.com/,
        /^https:\/\/[^\/]+\.vercel\.app/,
        /^https:\/\/[^\/]+\.googleapis\.com/,
      ],
    });
  }
}
