// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your component test files.
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

// Add global configuration for component tests
Cypress.on("uncaught:exception", (err, runnable) => {
  // Ignore ResizeObserver loop limit exceeded (common in modern browsers)
  if (err.message.includes("ResizeObserver loop limit exceeded")) {
    return false;
  }

  // Ignore hydration mismatches in development
  if (err.message.includes("Hydration failed")) {
    return false;
  }

  return true;
});

// Note: Component testing mount command will be available when cypress/react is installed
// For now, this is a placeholder for future component testing setup
