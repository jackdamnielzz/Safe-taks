// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.ts using ES2015 syntax:
import "./commands";

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Import code coverage support
import "@cypress/code-coverage/support";

// Add global configuration
Cypress.on("uncaught:exception", (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test when there are uncaught exceptions
  // Only ignore specific errors that we expect

  // Ignore ResizeObserver loop limit exceeded (common in modern browsers)
  if (err.message.includes("ResizeObserver loop limit exceeded")) {
    return false;
  }

  // Ignore hydration mismatches in development
  if (err.message.includes("Hydration failed")) {
    return false;
  }

  // Let other errors fail the test
  return true;
});

// Custom configuration
beforeEach(() => {
  // Clear cookies and local storage before each test
  cy.clearCookies();
  cy.clearLocalStorage();

  // Set viewport to consistent size
  cy.viewport(1280, 720);
});

// Add custom types for better TypeScript support
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-cy attribute.
       * @param selector - data-cy attribute value
       * @example cy.dataCy('submit-button')
       */
      dataCy(selector: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Custom command to login as a test user
       * @param email - user email
       * @param password - user password
       * @example cy.login('test@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to seed database with test data
       * @param fixture - fixture file name
       * @example cy.seedDatabase('users')
       */
      seedDatabase(fixture: string): Chainable<void>;
    }
  }
}
