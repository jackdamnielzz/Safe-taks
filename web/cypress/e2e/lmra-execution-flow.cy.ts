/**
 * E2E Test: LMRA Execution Flow
 *
 * Tests the complete Last Minute Risk Analysis (LMRA) execution workflow,
 * including location verification, environmental checks, personnel verification,
 * equipment checks, and hazard assessment.
 */

describe("LMRA Execution Flow", () => {
  const fieldWorker = {
    email: "field-worker@test.com",
    password: "fieldpass123",
    role: "field_worker",
    uid: "field-worker-uid-123",
  };

  beforeEach(() => {
    // Clear emulator data and seed test data
    cy.task("clearEmulatorData");
    cy.task("seedTestData", { user: fieldWorker });

    // Mock geolocation API
    cy.window().then((win) => {
      cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake((success) => {
        success({
          coords: {
            latitude: 51.9225,
            longitude: 4.47917,
            accuracy: 10,
          },
        });
      });
    });

    // Login as field worker
    cy.login(fieldWorker.email, fieldWorker.password);
  });

  describe("Complete LMRA Execution", () => {
    it("should execute full LMRA workflow with all checks", () => {
      // Navigate to LMRA execution page
      cy.visit("/lmra/execute");

      // Select TRA to execute
      cy.dataCy("tra-select").click();
      cy.dataCy("tra-option-electrical-work").click();
      cy.dataCy("start-lmra-button").click();

      // Step 1: Location Verification
      cy.dataCy("lmra-step-location").should("be.visible");
      cy.dataCy("verify-location-button").click();

      // Wait for location to be captured
      cy.dataCy("location-status").should("contain", "Location verified");
      cy.dataCy("location-accuracy").should("contain", "10m");
      cy.dataCy("location-coordinates").should("be.visible");

      cy.dataCy("next-step-button").click();

      // Step 2: Environmental Conditions
      cy.dataCy("lmra-step-environment").should("be.visible");

      // Weather conditions (auto-fetched)
      cy.dataCy("weather-status").should("be.visible");
      cy.dataCy("temperature").should("be.visible");
      cy.dataCy("weather-condition").should("be.visible");

      // Manual environmental checks
      cy.dataCy("lighting-adequate").check();
      cy.dataCy("workspace-clear").check();
      cy.dataCy("ventilation-adequate").check();

      // Add environmental notes
      cy.dataCy("environment-notes").type(
        "Weather conditions are favorable. Workspace is clean and well-lit."
      );

      cy.dataCy("next-step-button").click();

      // Step 3: Personnel Verification
      cy.dataCy("lmra-step-personnel").should("be.visible");

      // Add team members
      cy.dataCy("add-team-member-button").click();
      cy.dataCy("team-member-name-0").type("John Doe");
      cy.dataCy("team-member-competent-0").check();
      cy.dataCy("team-member-certification-0").type("Electrical Safety Level 2");

      cy.dataCy("add-team-member-button").click();
      cy.dataCy("team-member-name-1").type("Jane Smith");
      cy.dataCy("team-member-competent-1").check();
      cy.dataCy("team-member-certification-1").type("LOTO Certified");

      // Verify all team members are fit for work
      cy.dataCy("all-personnel-fit").check();

      cy.dataCy("next-step-button").click();

      // Step 4: Equipment Verification
      cy.dataCy("lmra-step-equipment").should("be.visible");

      // Scan equipment QR codes
      cy.dataCy("scan-equipment-button").click();
      cy.dataCy("qr-scanner-modal").should("be.visible");

      // Simulate QR scan (or manual entry)
      cy.dataCy("manual-entry-tab").click();
      cy.dataCy("equipment-id-input").type("TOOL-12345");
      cy.dataCy("verify-equipment-button").click();

      // Verify equipment status
      cy.dataCy("equipment-status-valid").should("be.visible");
      cy.dataCy("equipment-inspection-date").should("contain", "Last inspected");

      // Add more equipment
      cy.dataCy("add-equipment-button").click();
      cy.dataCy("equipment-id-input").type("PPE-67890");
      cy.dataCy("verify-equipment-button").click();

      cy.dataCy("next-step-button").click();

      // Step 5: Hazard Assessment
      cy.dataCy("lmra-step-hazards").should("be.visible");

      // Review pre-identified hazards from TRA
      cy.dataCy("hazard-list").should("be.visible");
      cy.dataCy("hazard-item-0").should("contain", "Electrical shock");

      // Confirm hazard is still present
      cy.dataCy("hazard-0-present").check();
      cy.dataCy("hazard-0-controls-in-place").check();

      // Add additional hazard identified on-site
      cy.dataCy("add-additional-hazard-button").click();
      cy.dataCy("additional-hazard-description").type("Wet floor near work area");
      cy.dataCy("additional-hazard-category").select("physical");
      cy.dataCy("additional-hazard-severity").select("low");
      cy.dataCy("additional-hazard-control").type("Place warning signs and dry the area");
      cy.dataCy("save-additional-hazard").click();

      cy.dataCy("next-step-button").click();

      // Step 6: Risk Assessment Decision
      cy.dataCy("lmra-step-decision").should("be.visible");

      // Overall risk assessment
      cy.dataCy("overall-assessment-safe").check();
      cy.dataCy("all-controls-verified").check();
      cy.dataCy("team-briefed").check();

      // Add final comments
      cy.dataCy("final-comments").type(
        "All safety measures are in place. Team is briefed and ready to proceed."
      );

      cy.dataCy("next-step-button").click();

      // Step 7: Photo Documentation
      cy.dataCy("lmra-step-photos").should("be.visible");

      // Upload photos
      cy.dataCy("upload-photo-button").click();
      cy.dataCy("photo-input").attachFile("test-images/worksite-before.jpg");
      cy.dataCy("photo-caption-0").type("Worksite before starting");

      cy.dataCy("upload-photo-button").click();
      cy.dataCy("photo-input").attachFile("test-images/safety-equipment.jpg");
      cy.dataCy("photo-caption-1").type("Safety equipment in place");

      cy.dataCy("next-step-button").click();

      // Step 8: Digital Signature
      cy.dataCy("lmra-step-signature").should("be.visible");

      // Sign LMRA
      cy.dataCy("signature-pad").should("be.visible");
      cy.dataCy("signature-pad").trigger("mousedown", { which: 1, pageX: 100, pageY: 100 });
      cy.dataCy("signature-pad").trigger("mousemove", { which: 1, pageX: 200, pageY: 150 });
      cy.dataCy("signature-pad").trigger("mouseup");

      // Complete LMRA
      cy.dataCy("complete-lmra-button").click();

      // Verify completion
      cy.dataCy("success-message").should("contain", "LMRA completed successfully");
      cy.url().should("include", "/lmra/session/");
      cy.dataCy("lmra-status").should("contain", "completed");
      cy.dataCy("lmra-assessment").should("contain", "safe");
    });

    it("should handle stop work decision", () => {
      cy.visit("/lmra/execute");
      cy.dataCy("tra-select").select("High Risk TRA");
      cy.dataCy("start-lmra-button").click();

      // Navigate through steps quickly
      cy.dataCy("verify-location-button").click();
      cy.dataCy("next-step-button").click();

      cy.dataCy("lighting-adequate").check();
      cy.dataCy("next-step-button").click();

      // Personnel step
      cy.dataCy("add-team-member-button").click();
      cy.dataCy("team-member-name-0").type("John Doe");
      cy.dataCy("team-member-competent-0").check();
      cy.dataCy("next-step-button").click();

      // Equipment step
      cy.dataCy("next-step-button").click();

      // Hazard assessment - identify critical issue
      cy.dataCy("hazard-0-present").check();
      cy.dataCy("hazard-0-controls-in-place").uncheck(); // Controls NOT in place
      cy.dataCy("next-step-button").click();

      // Risk decision - STOP WORK
      cy.dataCy("overall-assessment-stop-work").check();
      cy.dataCy("stop-work-reason").type(
        "Critical safety controls are not in place. Electrical panel is not properly locked out."
      );

      cy.dataCy("complete-lmra-button").click();

      // Verify stop work alert
      cy.dataCy("stop-work-alert").should("be.visible");
      cy.dataCy("stop-work-alert").should("contain", "STOP WORK");
      cy.dataCy("lmra-status").should("contain", "stop_work");

      // Verify notification sent
      cy.dataCy("notification-sent").should("contain", "Safety manager notified");
    });
  });

  describe("Offline LMRA Execution", () => {
    it("should save LMRA data offline and sync when online", () => {
      cy.visit("/lmra/execute");

      // Start LMRA
      cy.dataCy("tra-select").select("Electrical Work TRA");
      cy.dataCy("start-lmra-button").click();

      // Go offline
      cy.window().then((win) => {
        cy.stub(win.navigator, "onLine").value(false);
        cy.wrap(win).trigger("offline");
      });

      // Continue LMRA execution offline
      cy.dataCy("offline-indicator").should("be.visible");
      cy.dataCy("verify-location-button").click();
      cy.dataCy("next-step-button").click();

      // Add data while offline
      cy.dataCy("lighting-adequate").check();
      cy.dataCy("environment-notes").type("Working offline - data will sync later");
      cy.dataCy("next-step-button").click();

      // Verify data saved locally
      cy.dataCy("offline-save-indicator").should("contain", "Saved locally");

      // Go back online
      cy.window().then((win) => {
        cy.stub(win.navigator, "onLine").value(true);
        cy.wrap(win).trigger("online");
      });

      // Verify auto-sync
      cy.dataCy("sync-indicator").should("contain", "Syncing");
      cy.dataCy("sync-success").should("be.visible", { timeout: 10000 });
    });
  });

  describe("LMRA History and Review", () => {
    beforeEach(() => {
      // Seed completed LMRA sessions
      cy.task("seedCompletedLMRAs", { count: 5 });
    });

    it("should view LMRA history", () => {
      cy.visit("/lmra/history");

      // Verify list of completed LMRAs
      cy.dataCy("lmra-history-list").should("be.visible");
      cy.dataCy("lmra-session-item").should("have.length.at.least", 5);

      // Filter by date
      cy.dataCy("date-filter-from").type("2025-10-01");
      cy.dataCy("date-filter-to").type("2025-10-03");
      cy.dataCy("apply-filter-button").click();

      // View specific LMRA
      cy.dataCy("lmra-session-item").first().click();

      // Verify LMRA details
      cy.dataCy("lmra-details").should("be.visible");
      cy.dataCy("lmra-tra-title").should("be.visible");
      cy.dataCy("lmra-location").should("be.visible");
      cy.dataCy("lmra-team-members").should("be.visible");
      cy.dataCy("lmra-hazards").should("be.visible");
      cy.dataCy("lmra-photos").should("be.visible");
      cy.dataCy("lmra-signature").should("be.visible");
    });

    it("should filter LMRAs by assessment result", () => {
      cy.visit("/lmra/history");

      // Filter by stop work
      cy.dataCy("assessment-filter").select("stop_work");
      cy.dataCy("apply-filter-button").click();

      // Verify only stop work LMRAs shown
      cy.dataCy("lmra-session-item").each(($el) => {
        cy.wrap($el).find('[data-cy="assessment-badge"]').should("contain", "stop work");
      });
    });

    it("should export LMRA report", () => {
      cy.visit("/lmra/history");
      cy.dataCy("lmra-session-item").first().click();

      // Export as PDF
      cy.dataCy("export-pdf-button").click();
      cy.dataCy("export-modal").should("be.visible");
      cy.dataCy("include-photos").check();
      cy.dataCy("include-signatures").check();
      cy.dataCy("confirm-export-button").click();

      // Verify download initiated
      cy.dataCy("download-success").should("be.visible");
    });
  });

  describe("Real-time LMRA Dashboard", () => {
    it("should show active LMRA sessions in real-time", () => {
      // Login as safety manager
      cy.login("safety-manager@test.com", "safetypass123");

      cy.visit("/dashboard/lmra-realtime");

      // Verify dashboard loads
      cy.dataCy("realtime-dashboard").should("be.visible");
      cy.dataCy("active-sessions-count").should("be.visible");

      // Start LMRA in another session (simulated)
      cy.task("startLMRASession", { traId: "tra-123" });

      // Verify real-time update
      cy.dataCy("active-sessions-list").should("contain", "Electrical Work TRA");
      cy.dataCy("session-status-in-progress").should("be.visible");

      // Simulate stop work alert
      cy.task("triggerStopWork", { sessionId: "session-123" });

      // Verify alert appears
      cy.dataCy("stop-work-alert-notification").should("be.visible");
      cy.dataCy("stop-work-alert-notification").should("contain", "STOP WORK");
      cy.dataCy("alert-sound").should("exist"); // Audio alert
    });
  });

  describe("Mobile-specific LMRA Features", () => {
    beforeEach(() => {
      // Set mobile viewport
      cy.viewport("iphone-x");
    });

    it("should use mobile camera for photos", () => {
      cy.visit("/lmra/execute");
      cy.dataCy("tra-select").select("Electrical Work TRA");
      cy.dataCy("start-lmra-button").click();

      // Navigate to photo step
      cy.dataCy("skip-to-photos").click();

      // Use camera
      cy.dataCy("use-camera-button").click();

      // Verify camera interface
      cy.dataCy("camera-preview").should("be.visible");
      cy.dataCy("capture-button").should("be.visible");
      cy.dataCy("switch-camera-button").should("be.visible");

      // Capture photo
      cy.dataCy("capture-button").click();

      // Verify photo captured
      cy.dataCy("photo-preview").should("be.visible");
      cy.dataCy("photo-caption-input").type("Mobile camera test");
      cy.dataCy("save-photo-button").click();

      cy.dataCy("photo-thumbnail-0").should("be.visible");
    });

    it("should support touch gestures for navigation", () => {
      cy.visit("/lmra/execute");
      cy.dataCy("tra-select").select("Electrical Work TRA");
      cy.dataCy("start-lmra-button").click();

      // Swipe to next step
      cy.dataCy("lmra-step-container")
        .trigger("touchstart", { touches: [{ pageX: 300, pageY: 200 }] })
        .trigger("touchmove", { touches: [{ pageX: 100, pageY: 200 }] })
        .trigger("touchend");

      // Verify moved to next step
      cy.dataCy("lmra-step-environment").should("be.visible");
    });
  });
});
