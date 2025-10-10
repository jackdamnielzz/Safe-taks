/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to select DOM element by data-cy attribute
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
