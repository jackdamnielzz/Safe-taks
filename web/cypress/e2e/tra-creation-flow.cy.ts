/**
 * E2E Test: TRA Creation Flow
 *
 * Tests the complete workflow of creating a Task Risk Analysis (TRA) from scratch,
 * including template selection, hazard identification, risk assessment, and submission.
 */

describe("TRA Creation Flow", () => {
  const testUser = {
    email: "safety-manager@test.com",
    password: "testpassword123",
    role: "safety_manager",
    uid: "test-user-uid-123",
  };

  beforeEach(() => {
    // Clear emulator data and seed test data
    cy.task("clearEmulatorData");
    cy.task("seedTestData", { user: testUser });

    // Login as safety manager
    cy.login(testUser.email, testUser.password);
  });

  describe("TRA Creation from Scratch", () => {
    it("should create a complete TRA with hazards and control measures", () => {
      // Navigate to TRA creation page
      cy.visit("/tras/create");
      cy.url().should("include", "/tras/create");

      // Step 1: Basic Information
      cy.dataCy("tra-title-input").type("Electrical Panel Maintenance TRA");
      cy.dataCy("tra-description-input").type(
        "Risk analysis for routine electrical panel maintenance work"
      );

      // Select project
      cy.dataCy("project-select").click();
      cy.dataCy("project-option-1").click();

      // Select compliance framework
      cy.dataCy("compliance-framework-select").select("vca");

      cy.dataCy("next-step-button").click();

      // Step 2: Task Steps
      cy.dataCy("add-task-step-button").click();

      // Add first task step
      cy.dataCy("task-step-0-description").type("Isolate power supply and verify de-energization");
      cy.dataCy("task-step-0-duration").type("15");
      cy.dataCy("task-step-0-personnel").type("2");
      cy.dataCy("task-step-0-location").type("Main electrical room");

      // Add hazard to first task step
      cy.dataCy("task-step-0-add-hazard").click();
      cy.dataCy("hazard-search-input").type("electrical shock");
      cy.dataCy("hazard-result-electrical-shock").click();

      // Set risk scores (Kinney & Wiruth)
      cy.dataCy("hazard-0-effect-score").select("15"); // Very serious
      cy.dataCy("hazard-0-exposure-score").select("3"); // Occasional
      cy.dataCy("hazard-0-probability-score").select("1"); // Not unusual

      // Verify risk calculation
      cy.dataCy("hazard-0-risk-score").should("contain", "45"); // 15 * 3 * 1
      cy.dataCy("hazard-0-risk-level").should("contain", "acceptable");

      // Add control measure
      cy.dataCy("hazard-0-add-control").click();
      cy.dataCy("control-0-type").select("engineering");
      cy.dataCy("control-0-description").type("Use lockout/tagout (LOTO) procedures");
      cy.dataCy("control-0-responsible").type("Electrical Supervisor");

      // Add second control measure
      cy.dataCy("hazard-0-add-control").click();
      cy.dataCy("control-1-type").select("ppe");
      cy.dataCy("control-1-description").type("Wear insulated gloves and safety glasses");

      // Add second task step
      cy.dataCy("add-task-step-button").click();
      cy.dataCy("task-step-1-description").type("Inspect panel components and connections");
      cy.dataCy("task-step-1-duration").type("30");

      cy.dataCy("next-step-button").click();

      // Step 3: Team Members
      cy.dataCy("add-team-member-button").click();
      cy.dataCy("team-member-search").type("John");
      cy.dataCy("team-member-result-john-doe").click();

      cy.dataCy("add-team-member-button").click();
      cy.dataCy("team-member-search").type("Jane");
      cy.dataCy("team-member-result-jane-smith").click();

      // Add required competencies
      cy.dataCy("add-competency-button").click();
      cy.dataCy("competency-input-0").type("Electrical Safety Certification");

      cy.dataCy("add-competency-button").click();
      cy.dataCy("competency-input-1").type("LOTO Training");

      cy.dataCy("next-step-button").click();

      // Step 4: Review and Submit
      cy.dataCy("tra-review-title").should("contain", "Electrical Panel Maintenance TRA");
      cy.dataCy("tra-review-task-steps").should("contain", "2 task steps");
      cy.dataCy("tra-review-hazards").should("contain", "1 hazard");
      cy.dataCy("tra-review-team-members").should("contain", "2 members");

      // Save as draft first
      cy.dataCy("save-draft-button").click();
      cy.dataCy("success-message").should("contain", "TRA saved as draft");

      // Submit for approval
      cy.dataCy("submit-for-approval-button").click();
      cy.dataCy("submit-confirmation-modal").should("be.visible");
      cy.dataCy("confirm-submit-button").click();

      // Verify submission success
      cy.dataCy("success-message").should("contain", "TRA submitted for approval");
      cy.url().should("match", /\/tras\/[a-zA-Z0-9-]+$/);

      // Verify TRA details page
      cy.dataCy("tra-status-badge").should("contain", "submitted");
      cy.dataCy("tra-title").should("contain", "Electrical Panel Maintenance TRA");
    });

    it("should create TRA from template", () => {
      cy.visit("/tras/create");

      // Select template option
      cy.dataCy("use-template-button").click();
      cy.dataCy("template-modal").should("be.visible");

      // Browse templates
      cy.dataCy("template-category-electrical").click();
      cy.dataCy("template-electrical-work").click();

      // Verify template loaded
      cy.dataCy("tra-title-input").should("have.value", "Electrical Work - Standard TRA");
      cy.dataCy("task-steps-count").should("contain", "5");

      // Customize template
      cy.dataCy("tra-title-input").clear().type("Custom Electrical Work TRA");
      cy.dataCy("project-select").select("Project Alpha");

      // Modify a task step
      cy.dataCy("task-step-0-description").clear().type("Modified: Prepare work area");

      // Save
      cy.dataCy("save-draft-button").click();
      cy.dataCy("success-message").should("be.visible");
    });
  });

  describe("TRA Validation", () => {
    it("should validate required fields", () => {
      cy.visit("/tras/create");

      // Try to proceed without filling required fields
      cy.dataCy("next-step-button").click();

      // Verify validation errors
      cy.dataCy("tra-title-error").should("contain", "Title is required");
      cy.dataCy("project-select-error").should("contain", "Project is required");
    });

    it("should validate risk assessment scores", () => {
      cy.visit("/tras/create");

      // Fill basic info
      cy.dataCy("tra-title-input").type("Test TRA");
      cy.dataCy("project-select").select("Project Alpha");
      cy.dataCy("next-step-button").click();

      // Add task step with hazard
      cy.dataCy("add-task-step-button").click();
      cy.dataCy("task-step-0-description").type("Test step");
      cy.dataCy("task-step-0-add-hazard").click();

      // Try invalid risk scores
      cy.dataCy("hazard-0-effect-score").select("0"); // Invalid
      cy.dataCy("hazard-0-error").should("contain", "Valid effect score required");
    });

    it("should prevent submission without hazards", () => {
      cy.visit("/tras/create");

      // Fill basic info
      cy.dataCy("tra-title-input").type("Test TRA");
      cy.dataCy("project-select").select("Project Alpha");
      cy.dataCy("next-step-button").click();

      // Add task step without hazards
      cy.dataCy("add-task-step-button").click();
      cy.dataCy("task-step-0-description").type("Test step");
      cy.dataCy("next-step-button").click();

      // Try to submit
      cy.dataCy("submit-for-approval-button").should("be.disabled");
      cy.dataCy("validation-warning").should("contain", "At least one hazard required");
    });
  });

  describe("TRA Editing", () => {
    it("should edit draft TRA", () => {
      // Create a draft TRA first
      cy.task("createDraftTRA", { userId: testUser.uid });

      // Navigate to TRA list
      cy.visit("/tras");
      cy.dataCy("tra-list-item-draft").first().click();

      // Edit TRA
      cy.dataCy("edit-tra-button").click();
      cy.url().should("include", "/edit");

      // Modify title
      cy.dataCy("tra-title-input").clear().type("Updated TRA Title");

      // Add new task step
      cy.dataCy("add-task-step-button").click();
      cy.dataCy("task-step-2-description").type("New additional step");

      // Save changes
      cy.dataCy("save-changes-button").click();
      cy.dataCy("success-message").should("contain", "TRA updated successfully");
    });

    it("should not allow editing approved TRA", () => {
      cy.task("createApprovedTRA", { userId: testUser.uid });

      cy.visit("/tras");
      cy.dataCy("tra-list-item-approved").first().click();

      // Edit button should not be visible or disabled
      cy.dataCy("edit-tra-button").should("not.exist");
      cy.dataCy("tra-status-message").should("contain", "approved");
    });
  });

  describe("TRA Search and Filtering", () => {
    beforeEach(() => {
      // Seed multiple TRAs with different statuses
      cy.task("seedMultipleTRAs", { count: 10 });
    });

    it("should search TRAs by title", () => {
      cy.visit("/tras");

      cy.dataCy("tra-search-input").type("Electrical");
      cy.dataCy("search-button").click();

      // Verify filtered results
      cy.dataCy("tra-list-item").should("have.length.at.least", 1);
      cy.dataCy("tra-list-item").each(($el) => {
        cy.wrap($el).should("contain", "Electrical");
      });
    });

    it("should filter TRAs by status", () => {
      cy.visit("/tras");

      cy.dataCy("status-filter").click();
      cy.dataCy("status-option-approved").click();

      cy.dataCy("tra-list-item").each(($el) => {
        cy.wrap($el).find('[data-cy="tra-status-badge"]').should("contain", "approved");
      });
    });

    it("should filter TRAs by risk level", () => {
      cy.visit("/tras");

      cy.dataCy("risk-level-filter").click();
      cy.dataCy("risk-level-option-high").click();

      cy.dataCy("tra-list-item").each(($el) => {
        cy.wrap($el).find('[data-cy="risk-level-badge"]').should("contain", "high");
      });
    });
  });

  describe("TRA Approval Workflow", () => {
    it("should complete approval workflow", () => {
      // Create submitted TRA
      cy.task("createSubmittedTRA", { userId: testUser.uid });

      // Login as approver
      cy.login("approver@test.com", "approverpass123");

      cy.visit("/tras");
      cy.dataCy("pending-approvals-tab").click();
      cy.dataCy("tra-list-item-submitted").first().click();

      // Review TRA
      cy.dataCy("approve-button").click();
      cy.dataCy("approval-modal").should("be.visible");

      // Add approval comments
      cy.dataCy("approval-comments").type(
        "Reviewed and approved. All safety measures are adequate."
      );

      // Add digital signature
      cy.dataCy("signature-pad").trigger("mousedown", { which: 1, pageX: 100, pageY: 100 });
      cy.dataCy("signature-pad").trigger("mousemove", { which: 1, pageX: 200, pageY: 150 });
      cy.dataCy("signature-pad").trigger("mouseup");

      // Confirm approval
      cy.dataCy("confirm-approval-button").click();

      // Verify approval success
      cy.dataCy("success-message").should("contain", "TRA approved successfully");
      cy.dataCy("tra-status-badge").should("contain", "approved");
      cy.dataCy("approval-history").should("contain", "Approved by");
    });

    it("should reject TRA with comments", () => {
      cy.task("createSubmittedTRA", { userId: testUser.uid });

      cy.login("approver@test.com", "approverpass123");
      cy.visit("/tras");
      cy.dataCy("pending-approvals-tab").click();
      cy.dataCy("tra-list-item-submitted").first().click();

      // Reject TRA
      cy.dataCy("reject-button").click();
      cy.dataCy("rejection-modal").should("be.visible");

      cy.dataCy("rejection-reason").type(
        "Insufficient control measures for high-risk hazards. Please add additional engineering controls."
      );
      cy.dataCy("confirm-rejection-button").click();

      // Verify rejection
      cy.dataCy("success-message").should("contain", "TRA rejected");
      cy.dataCy("tra-status-badge").should("contain", "rejected");
    });
  });
});
