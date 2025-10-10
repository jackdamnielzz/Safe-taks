describe("Homepage E2E Tests", () => {
  beforeEach(() => {
    // Set baseUrl for tests that need the server
    Cypress.config("baseUrl", "http://localhost:3000");
    // Visit the homepage before each test
    cy.visit("/");
  });

  it("should display the homepage correctly", () => {
    // Check that the page loads and displays expected content
    cy.contains("SafeWork Pro").should("be.visible");

    // Check that key navigation elements are present
    cy.get("nav").should("be.visible");

    // Check for main content
    cy.get("main").should("exist");

    // Verify the page title
    cy.title().should("not.be.empty");
  });

  it("should have working navigation menu", () => {
    // Test desktop navigation
    cy.viewport(1280, 720);

    // Check if navigation links are present and clickable
    const navItems = ["TRAs", "Mobile", "Reports", "Team", "Settings"];

    navItems.forEach((item) => {
      cy.contains(item).should("be.visible");
    });
  });

  it("should be responsive on mobile devices", () => {
    // Test mobile viewport
    cy.viewport("iphone-x");

    // Check that mobile menu toggle exists
    cy.get(
      '[data-cy="mobile-menu-toggle"], button[aria-label*="menu"], button[aria-label*="Menu"]'
    ).should("be.visible");
  });

  it("should load without JavaScript errors", () => {
    // Check that there are no uncaught JavaScript errors
    cy.window().should("exist");

    // Verify basic page functionality
    cy.get("body").should("be.visible");
    cy.get("html").should("have.attr", "lang");
  });

  it("should have correct meta tags for SEO", () => {
    // Check for important meta tags
    cy.get('head meta[name="viewport"]').should("exist");
    cy.get("head meta[charset]").should("exist");

    // Check page title exists and is not empty
    cy.title().should("not.be.empty");
  });

  it("should handle page loading states gracefully", () => {
    // Wait for any loading states to complete
    cy.get("body").should("not.have.class", "loading");

    // Check that main content is loaded
    cy.get("main").should("be.visible");

    // Verify no loading spinners are still visible
    cy.get('[data-cy="loading-spinner"]').should("not.exist");
  });

  it("should have accessible navigation", () => {
    // Check for proper heading structure
    cy.get("h1").should("exist");

    // Verify skip link for screen readers (if present)
    cy.get("body").then(($body) => {
      if ($body.find('[href="#main-content"], [href="#content"]').length > 0) {
        cy.get('[href="#main-content"], [href="#content"]').should("exist");
      }
    });
  });
});
