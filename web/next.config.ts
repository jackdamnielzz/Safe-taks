import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";
import withPWA from "next-pwa";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./src/i18n/config.ts");

// Bundle analyzer configuration
const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// PWA configuration - temporarily disabled for troubleshooting
const pwaConfig = {
  dest: "public",
  disable: true, // Temporarily disable PWA to fix build issues
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.firebaseapp\.com\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "firebase-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
        cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
          return `${request.url}?${Math.floor(Date.now() / 1000 / 60 / 60)}`;
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.googleapis\.com\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "googleapis-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
};

// Next.js configuration with PWA and optimizations
const nextConfig: NextConfig = withBundleAnalyzerConfig(
  withPWA(pwaConfig)({
    // Experimental optimizations
    experimental: {
      optimizePackageImports: ["recharts", "react-icons", "@sentry/nextjs"],
    },

    // Webpack configuration for bundle optimization
    webpack: (config: any, { isServer }: { isServer: boolean }) => {
      if (!isServer) {
        // Client-side bundle optimization
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: "all",
            cacheGroups: {
              default: false,
              vendors: false,
              // Vendor chunk for shared dependencies
              vendor: {
                name: "vendor",
                chunks: "all",
                test: /node_modules/,
                priority: 20,
              },
              // Recharts in separate chunk (lazy loaded)
              recharts: {
                name: "recharts",
                test: /[\\/]node_modules[\\/]recharts[\\/]/,
                priority: 30,
                reuseExistingChunk: true,
              },
              // jsPDF and xlsx (server-side only, but separate if used)
              reports: {
                name: "reports",
                test: /[\\/]node_modules[\\/](jspdf|xlsx)[\\/]/,
                priority: 30,
                reuseExistingChunk: true,
              },
              // Common components
              common: {
                minChunks: 2,
                priority: 10,
                reuseExistingChunk: true,
              },
            },
          },
        };
      }
      return config;
    },

    async headers() {
      return [
        {
          // Apply security headers to all routes
          source: "/(.*)",
          headers: [
            // Content Security Policy - Comprehensive policy for B2B SaaS
            {
              key: "Content-Security-Policy",
              value: [
                "default-src 'self'",
                // Scripts: Allow self, Firebase, Vercel Analytics, Sentry, Google Tag Manager, and specific inline scripts
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.googleapis.com https://*.gstatic.com https://vercel.live https://*.vercel-analytics.com https://*.vercel-insights.com https://va.vercel-scripts.com https://apis.google.com https://www.googletagmanager.com https://*.sentry.io",
                // Styles: Allow self and inline styles (needed for Tailwind and component styles)
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                // Images: Allow self, Firebase, Vercel, and common image sources
                "img-src 'self' data: blob: https://*.firebaseapp.com https://*.googleapis.com https://*.gstatic.com https://vercel.com https://*.vercel.app",
                // Fonts: Allow self and Google Fonts
                "font-src 'self' https://fonts.gstatic.com",
                // Connect: Allow Firebase, Vercel Analytics, Sentry, Google Analytics, and API endpoints
                "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com wss://*.firebaseio.com https://*.vercel-analytics.com https://*.vercel-insights.com https://api.stripe.com https://*.sentry.io https://region1.google-analytics.com",
                // Frame: Allow Firebase auth popups and Stripe
                "frame-src 'self' https://*.firebaseapp.com https://*.google.com https://js.stripe.com",
                // Object/Embed: Block all plugins
                "object-src 'none'",
                // Media: Allow self and Firebase Storage
                "media-src 'self' https://*.firebaseapp.com https://*.googleapis.com",
                // Worker: Allow self for service workers
                "worker-src 'self' blob:",
                // Manifest: Allow self
                "manifest-src 'self'",
                // Base URI: Restrict to same origin
                "base-uri 'self'",
                // Form action: Allow self and Stripe
                "form-action 'self' https://api.stripe.com",
                // Frame ancestors: Prevent embedding (clickjacking protection)
                "frame-ancestors 'none'",
                // Upgrade insecure requests in production
                ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
              ].join("; "),
            },
            // X-Frame-Options: Prevent embedding in frames (clickjacking protection)
            {
              key: "X-Frame-Options",
              value: "DENY",
            },
            // Strict Transport Security: Force HTTPS in production
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            },
            // X-Content-Type-Options: Prevent MIME type sniffing
            {
              key: "X-Content-Type-Options",
              value: "nosniff",
            },
            // Referrer Policy: Control referrer information
            {
              key: "Referrer-Policy",
              value: "strict-origin-when-cross-origin",
            },
            // X-DNS-Prefetch-Control: Control DNS prefetching
            {
              key: "X-DNS-Prefetch-Control",
              value: "on",
            },
            // Permissions Policy: Control browser features
            {
              key: "Permissions-Policy",
              value: [
                "camera=(self)",
                "microphone=()",
                "geolocation=(self)",
                "payment=(self)",
                "usb=()",
                "bluetooth=()",
                "magnetometer=()",
                "gyroscope=()",
                "accelerometer=()",
              ].join(", "),
            },
            // X-Permitted-Cross-Domain-Policies: Prevent cross-domain policies
            {
              key: "X-Permitted-Cross-Domain-Policies",
              value: "none",
            },
            // Cross-Origin Embedder Policy: Enable cross-origin isolation
            {
              key: "Cross-Origin-Embedder-Policy",
              value: "credentialless",
            },
            // Cross-Origin Opener Policy: Protect from window references
            {
              key: "Cross-Origin-Opener-Policy",
              value: "same-origin-allow-popups",
            },
            // Cross-Origin Resource Policy: Control cross-origin resource sharing
            {
              key: "Cross-Origin-Resource-Policy",
              value: "same-site",
            },
          ],
        },
        {
          // API routes specific headers
          source: "/api/(.*)",
          headers: [
            // Cache Control for API routes
            {
              key: "Cache-Control",
              value: "no-store, no-cache, must-revalidate, max-age=0",
            },
            // Pragma for older browsers
            {
              key: "Pragma",
              value: "no-cache",
            },
            // X-Robots-Tag: Prevent API routes from being indexed
            {
              key: "X-Robots-Tag",
              value: "noindex, nofollow, noarchive, nosnippet, noimageindex",
            },
          ],
        },
      ];
    },

    // Additional security and performance configurations
    poweredByHeader: false, // Remove X-Powered-By header
    reactStrictMode: true,

    // Environment-specific configurations
    ...(process.env.NODE_ENV === "production" && {
      // Production-only optimizations
      compress: true,
      generateEtags: true,
    }),
  })
);

// Export the configuration with internationalization and Sentry integration
export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,

  // Upload source maps in production for better error debugging
  widenClientFileUpload: true,

  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: "/monitoring",

  // Configure source maps handling
  sourcemaps: {
    disable: process.env.NODE_ENV === "production",
  },

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: process.env.NODE_ENV === "production",

  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: true,
});
