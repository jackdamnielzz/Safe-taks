/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Custom command to select DOM element by data-cy attribute.
 * @param selector - data-cy attribute value
 * @example cy.dataCy('submit-button')
 */
Cypress.Commands.add("dataCy", (selector: string) => {
  return cy.get(`[data-cy="${selector}"]`);
});

/**
 * Custom command to login as a test user
 * @param email - user email
 * @param password - user password
 * @example cy.login('test@example.com', 'password123')
 */
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit("/auth/login");

    // Fill in the login form
    cy.dataCy("email-input").type(email);
    cy.dataCy("password-input").type(password);

    // Submit the form
    cy.dataCy("login-button").click();

    // Wait for successful login (adjust URL as needed)
    cy.url().should("not.include", "/auth/login");
    cy.url().should("include", "/dashboard"); // or wherever users are redirected after login
  });
});

/**
 * Custom command to seed database with test data
 * @param fixture - fixture file name
 * @example cy.seedDatabase('users')
 */
Cypress.Commands.add("seedDatabase", (fixture: string) => {
  cy.task("log", `Seeding database with ${fixture} data`);

  // Load the fixture data
  cy.fixture(fixture).then((data) => {
    // Make API call to seed the database
    cy.request({
      method: "POST",
      url: "/api/test/seed",
      body: { fixture, data },
      headers: {
        "Content-Type": "application/json",
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });
});
