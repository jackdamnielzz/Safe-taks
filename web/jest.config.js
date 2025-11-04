const nextJest = require("next/jest");

// Providing the path to your Next.js app which will enable loading next.config.js and .env files
const createJestConfig = nextJest({ dir: "./" });

// Any custom config you want to pass to Jest
const customJestConfig = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/app/**/layout.tsx",
    "!src/app/**/loading.tsx",
    "!src/app/**/error.tsx",
    "!src/app/**/not-found.tsx",
    "!src/app/**/global-error.tsx",
    "!**/*.config.{js,ts}",
  ],

  // The test environment that will be used for testing
  testEnvironment: "jsdom",

  // Setup files after env
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Module name mapping for absolute imports and static assets
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^~/(.*)$": "<rootDir>/$1",
    // Handle static assets
    "^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$": "<rootDir>/__mocks__/fileMock.js",
    // Map firebase client imports to our test mocks
    "^firebase/firestore$": "<rootDir>/src/__mocks__/firebase-firestore.ts",
    "^@firebase/firestore$": "<rootDir>/src/__mocks__/firebase-firestore.ts",
    "^firebase/auth$": "<rootDir>/src/__mocks__/firebase-auth.ts",
    "^@firebase/auth$": "<rootDir>/src/__mocks__/firebase-auth.ts",
    "^firebase/analytics$": "<rootDir>/src/__mocks__/firebase-analytics.ts",
    "^@firebase/analytics$": "<rootDir>/src/__mocks__/firebase-analytics.ts",
    "^firebase/app$": "<rootDir>/src/__mocks__/firebase-app.ts",
    // Mock next-intl to avoid ESM parsing issues in tests
    "^next-intl$": "<rootDir>/__mocks__/next-intl.js"
  },

  // Transform configuration
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },

  // Ensure certain modern ESM node_modules are transformed by Babel (allowlist).
  // Packages that export ESM (export ...) can cause Jest to fail unless transformed.
  transformIgnorePatterns: [
    "/node_modules/(?!(@?next-intl|jose|jwks-rsa|firebase-admin|next-.*|@?sentry|@?auth0)/)"
  ],

  // Test match patterns
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}",
    "<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}",
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/coverage/",
    "<rootDir>/dist/",
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage reporters
  coverageReporters: ["text", "lcov", "html", "json-summary"],

  // Verbose output
  verbose: true,

  // Bail on first test failure in CI
  bail: process.env.CI ? 1 : 0,

  // Maximum number of concurrent workers
  maxWorkers: process.env.CI ? 2 : "50%",

  // Test timeout (30 seconds)
  testTimeout: 30000,

  // Watch plugins for better development experience
  watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
