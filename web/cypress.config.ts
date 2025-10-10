import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    // Base URL for the application (can be overridden per test)
    baseUrl: null,

    // Directory for E2E test files
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",

    // Directory for support files (commands, etc.)
    supportFile: "cypress/support/e2e.ts",

    // Directory for fixtures
    fixturesFolder: "cypress/fixtures",

    // Screenshots and videos
    screenshotsFolder: "cypress/screenshots",
    videosFolder: "cypress/videos",

    // Test configuration
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false, // Enable for CI/debugging
    screenshotOnRunFailure: true,

    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 10000,

    // Retry configuration
    retries: {
      runMode: 2, // Retry failed tests in headless mode
      openMode: 0, // No retries in interactive mode
    },

    // Environment variables
    env: {
      // Add any environment-specific variables here
      coverage: true,
    },

    setupNodeEvents(on, config) {
      // Implement node event listeners here

      // Code coverage setup
      require("@cypress/code-coverage/task")(on, config);

      // Add any custom tasks here
      on("task", {
        log(message) {
          console.log(message);
          return null;
        },
      });

      return config;
    },
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
    specPattern: "src/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/component.ts",
  },
});
