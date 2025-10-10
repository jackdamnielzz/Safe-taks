/**
 * E2E Test: User Management Flow
 *
 * Tests the complete user management workflow including registration,
 * login, profile management, team invitations, and role-based access control.
 */

describe("User Management Flow", () => {
  beforeEach(() => {
    // Clear emulator data
    cy.task("clearEmulatorData");
  });

  describe("User Registration", () => {
    it("should register new user successfully", () => {
      cy.visit("/auth/register");

      // Fill registration form
      cy.dataCy("first-name-input").type("John");
      cy.dataCy("last-name-input").type("Doe");
      cy.dataCy("email-input").type("john.doe@company.com");
      cy.dataCy("password-input").type("SecurePassword123!");
      cy.dataCy("confirm-password-input").type("SecurePassword123!");

      // Select organization type
      cy.dataCy("organization-type-select").select("construction");
      cy.dataCy("organization-name-input").type("ABC Construction");

      // Accept terms
      cy.dataCy("terms-checkbox").check();
      cy.dataCy("privacy-checkbox").check();

      // Submit registration
      cy.dataCy("register-button").click();

      // Verify email verification page
      cy.url().should("include", "/auth/verify-email");
      cy.dataCy("verification-message").should("contain", "Check your email");
      cy.dataCy("email-sent-to").should("contain", "john.doe@company.com");
    });

    it("should validate registration form fields", () => {
      cy.visit("/auth/register");

      // Try to submit empty form
      cy.dataCy("register-button").click();

      // Verify validation errors
      cy.dataCy("first-name-error").should("contain", "First name is required");
      cy.dataCy("email-error").should("contain", "Email is required");
      cy.dataCy("password-error").should("contain", "Password is required");

      // Test invalid email
      cy.dataCy("email-input").type("invalid-email");
      cy.dataCy("register-button").click();
      cy.dataCy("email-error").should("contain", "Valid email required");

      // Test weak password
      cy.dataCy("email-input").clear().type("john@company.com");
      cy.dataCy("password-input").type("weak");
      cy.dataCy("register-button").click();
      cy.dataCy("password-error").should("contain", "Password must be at least 8 characters");

      // Test password mismatch
      cy.dataCy("password-input").clear().type("SecurePassword123!");
      cy.dataCy("confirm-password-input").type("DifferentPassword123!");
      cy.dataCy("register-button").click();
      cy.dataCy("confirm-password-error").should("contain", "Passwords must match");
    });

    it("should prevent duplicate email registration", () => {
      // Create existing user
      cy.task("createUser", {
        email: "existing@company.com",
        password: "password123",
      });

      cy.visit("/auth/register");

      // Try to register with existing email
      cy.dataCy("first-name-input").type("Jane");
      cy.dataCy("last-name-input").type("Smith");
      cy.dataCy("email-input").type("existing@company.com");
      cy.dataCy("password-input").type("NewPassword123!");
      cy.dataCy("confirm-password-input").type("NewPassword123!");
      cy.dataCy("organization-name-input").type("Test Org");
      cy.dataCy("terms-checkbox").check();
      cy.dataCy("register-button").click();

      // Verify error message
      cy.dataCy("error-message").should("contain", "Email already in use");
    });
  });

  describe("User Login", () => {
    beforeEach(() => {
      // Seed test user
      cy.task("createUser", {
        email: "test@company.com",
        password: "TestPassword123!",
        emailVerified: true,
      });
    });

    it("should login successfully with valid credentials", () => {
      cy.visit("/auth/login");

      cy.dataCy("email-input").type("test@company.com");
      cy.dataCy("password-input").type("TestPassword123!");
      cy.dataCy("login-button").click();

      // Verify redirect to dashboard
      cy.url().should("include", "/dashboard");
      cy.dataCy("user-menu").should("be.visible");
      cy.dataCy("user-email").should("contain", "test@company.com");
    });

    it("should show error for invalid credentials", () => {
      cy.visit("/auth/login");

      cy.dataCy("email-input").type("test@company.com");
      cy.dataCy("password-input").type("WrongPassword123!");
      cy.dataCy("login-button").click();

      cy.dataCy("error-message").should("contain", "Invalid email or password");
      cy.url().should("include", "/auth/login");
    });

    it("should handle unverified email", () => {
      // Create unverified user
      cy.task("createUser", {
        email: "unverified@company.com",
        password: "Password123!",
        emailVerified: false,
      });

      cy.visit("/auth/login");

      cy.dataCy("email-input").type("unverified@company.com");
      cy.dataCy("password-input").type("Password123!");
      cy.dataCy("login-button").click();

      // Verify email verification prompt
      cy.dataCy("verification-required").should("be.visible");
      cy.dataCy("resend-verification-button").should("be.visible");
    });

    it('should remember user with "Remember me" option', () => {
      cy.visit("/auth/login");

      cy.dataCy("email-input").type("test@company.com");
      cy.dataCy("password-input").type("TestPassword123!");
      cy.dataCy("remember-me-checkbox").check();
      cy.dataCy("login-button").click();

      // Verify logged in
      cy.url().should("include", "/dashboard");

      // Clear session but keep cookies
      cy.clearLocalStorage();
      cy.reload();

      // Should still be logged in
      cy.url().should("include", "/dashboard");
    });
  });

  describe("Password Reset", () => {
    beforeEach(() => {
      cy.task("createUser", {
        email: "reset@company.com",
        password: "OldPassword123!",
      });
    });

    it("should request password reset", () => {
      cy.visit("/auth/forgot-password");

      cy.dataCy("email-input").type("reset@company.com");
      cy.dataCy("reset-button").click();

      // Verify success message
      cy.dataCy("success-message").should("contain", "Password reset email sent");
      cy.dataCy("check-email-message").should("be.visible");
    });

    it("should reset password with valid token", () => {
      // Generate reset token
      cy.task("generatePasswordResetToken", { email: "reset@company.com" }).then((token) => {
        cy.visit(`/auth/reset-password?token=${token}`);

        cy.dataCy("new-password-input").type("NewPassword123!");
        cy.dataCy("confirm-password-input").type("NewPassword123!");
        cy.dataCy("reset-password-button").click();

        // Verify success
        cy.dataCy("success-message").should("contain", "Password reset successful");
        cy.url().should("include", "/auth/login");

        // Login with new password
        cy.dataCy("email-input").type("reset@company.com");
        cy.dataCy("password-input").type("NewPassword123!");
        cy.dataCy("login-button").click();

        cy.url().should("include", "/dashboard");
      });
    });
  });

  describe("Profile Management", () => {
    const testUser = {
      email: "profile@company.com",
      password: "Password123!",
      uid: "profile-user-uid",
    };

    beforeEach(() => {
      cy.task("createUser", testUser);
      cy.login(testUser.email, testUser.password);
    });

    it("should view and edit profile", () => {
      cy.visit("/profile");

      // Verify profile information displayed
      cy.dataCy("profile-email").should("contain", testUser.email);

      // Edit profile
      cy.dataCy("edit-profile-button").click();

      cy.dataCy("first-name-input").clear().type("Updated");
      cy.dataCy("last-name-input").clear().type("Name");
      cy.dataCy("phone-input").type("+31612345678");
      cy.dataCy("job-title-input").type("Safety Manager");

      // Upload profile photo
      cy.dataCy("upload-photo-button").click();
      cy.dataCy("photo-file-input").selectFile("cypress/fixtures/profile-photo.jpg", {
        force: true,
      });

      cy.dataCy("save-profile-button").click();

      // Verify changes saved
      cy.dataCy("success-message").should("contain", "Profile updated");
      cy.dataCy("profile-name").should("contain", "Updated Name");
      cy.dataCy("profile-phone").should("contain", "+31612345678");
    });

    it("should change password", () => {
      cy.visit("/profile/security");

      cy.dataCy("current-password-input").type("Password123!");
      cy.dataCy("new-password-input").type("NewSecurePassword123!");
      cy.dataCy("confirm-new-password-input").type("NewSecurePassword123!");
      cy.dataCy("change-password-button").click();

      // Verify success
      cy.dataCy("success-message").should("contain", "Password changed successfully");

      // Logout and login with new password
      cy.dataCy("user-menu").click();
      cy.dataCy("logout-button").click();

      cy.visit("/auth/login");
      cy.dataCy("email-input").type(testUser.email);
      cy.dataCy("password-input").type("NewSecurePassword123!");
      cy.dataCy("login-button").click();

      cy.url().should("include", "/dashboard");
    });
  });

  describe("Team Invitations", () => {
    const admin = {
      email: "admin@company.com",
      password: "AdminPass123!",
      role: "admin",
      uid: "admin-uid-123",
    };

    beforeEach(() => {
      cy.task("createUser", admin);
      cy.login(admin.email, admin.password);
    });

    it("should send team invitation", () => {
      cy.visit("/team/members");

      cy.dataCy("invite-member-button").click();
      cy.dataCy("invitation-modal").should("be.visible");

      // Fill invitation form
      cy.dataCy("invite-email-input").type("newmember@company.com");
      cy.dataCy("invite-role-select").select("field_worker");
      cy.dataCy("invite-message-input").type("Welcome to our safety team!");

      cy.dataCy("send-invitation-button").click();

      // Verify invitation sent
      cy.dataCy("success-message").should("contain", "Invitation sent");
      cy.dataCy("pending-invitations-list").should("contain", "newmember@company.com");
    });

    it("should accept team invitation", () => {
      // Create invitation
      cy.task("createInvitation", {
        email: "invited@company.com",
        role: "supervisor",
        organizationId: "org-123",
      }).then((invitation: any) => {
        // Visit invitation link
        cy.visit(`/auth/accept-invitation?token=${invitation.token}`);

        // Complete registration
        cy.dataCy("first-name-input").type("Invited");
        cy.dataCy("last-name-input").type("User");
        cy.dataCy("password-input").type("InvitedPassword123!");
        cy.dataCy("confirm-password-input").type("InvitedPassword123!");
        cy.dataCy("accept-invitation-button").click();

        // Verify account created and logged in
        cy.url().should("include", "/dashboard");
        cy.dataCy("welcome-message").should("contain", "Welcome to the team");
        cy.dataCy("user-role-badge").should("contain", "supervisor");
      });
    });

    it("should decline team invitation", () => {
      cy.task("createInvitation", {
        email: "declined@company.com",
        role: "field_worker",
        organizationId: "org-123",
      }).then((invitation: any) => {
        cy.visit(`/auth/accept-invitation?token=${invitation.token}`);

        cy.dataCy("decline-invitation-button").click();
        cy.dataCy("decline-confirmation-modal").should("be.visible");
        cy.dataCy("confirm-decline-button").click();

        // Verify declined
        cy.dataCy("success-message").should("contain", "Invitation declined");
        cy.url().should("include", "/");
      });
    });

    it("should cancel pending invitation", () => {
      cy.visit("/team/members");

      // Send invitation first
      cy.dataCy("invite-member-button").click();
      cy.dataCy("invite-email-input").type("cancel@company.com");
      cy.dataCy("invite-role-select").select("field_worker");
      cy.dataCy("send-invitation-button").click();

      // Cancel invitation
      cy.dataCy("pending-invitations-tab").click();
      cy.dataCy("invitation-item-cancel@company.com").within(() => {
        cy.dataCy("cancel-invitation-button").click();
      });

      cy.dataCy("cancel-confirmation-modal").should("be.visible");
      cy.dataCy("confirm-cancel-button").click();

      // Verify cancelled
      cy.dataCy("success-message").should("contain", "Invitation cancelled");
      cy.dataCy("pending-invitations-list").should("not.contain", "cancel@company.com");
    });
  });

  describe("Role-Based Access Control", () => {
    const users = {
      admin: { email: "admin@test.com", password: "pass123", role: "admin" },
      safetyManager: { email: "safety@test.com", password: "pass123", role: "safety_manager" },
      supervisor: { email: "supervisor@test.com", password: "pass123", role: "supervisor" },
      fieldWorker: { email: "worker@test.com", password: "pass123", role: "field_worker" },
    };

    beforeEach(() => {
      // Create all test users
      Object.values(users).forEach((user) => {
        cy.task("createUser", user);
      });
    });

    it("should allow admin full access", () => {
      cy.login(users.admin.email, users.admin.password);

      // Verify admin can access all pages
      cy.visit("/admin/analytics");
      cy.dataCy("analytics-dashboard").should("be.visible");

      cy.visit("/team/members");
      cy.dataCy("team-management").should("be.visible");

      cy.visit("/tras");
      cy.dataCy("tra-list").should("be.visible");
    });

    it("should restrict field worker access", () => {
      cy.login(users.fieldWorker.email, users.fieldWorker.password);

      // Try to access admin page
      cy.visit("/admin/analytics");
      cy.dataCy("access-denied").should("be.visible");
      cy.url().should("include", "/dashboard");

      // Try to access team management
      cy.visit("/team/members");
      cy.dataCy("access-denied").should("be.visible");

      // Should be able to execute LMRA
      cy.visit("/lmra/execute");
      cy.dataCy("lmra-execution").should("be.visible");
    });

    it("should allow safety manager to manage TRAs", () => {
      cy.login(users.safetyManager.email, users.safetyManager.password);

      // Can create TRAs
      cy.visit("/tras/create");
      cy.dataCy("tra-creation-form").should("be.visible");

      // Can approve TRAs
      cy.visit("/tras");
      cy.dataCy("pending-approvals-tab").should("be.visible");

      // Can view analytics
      cy.visit("/admin/analytics");
      cy.dataCy("analytics-dashboard").should("be.visible");
    });

    it("should enforce role-based UI elements", () => {
      // Login as field worker
      cy.login(users.fieldWorker.email, users.fieldWorker.password);
      cy.visit("/dashboard");

      // Admin menu should not be visible
      cy.dataCy("admin-menu").should("not.exist");
      cy.dataCy("team-management-link").should("not.exist");

      // Logout and login as admin
      cy.dataCy("user-menu").click();
      cy.dataCy("logout-button").click();

      cy.login(users.admin.email, users.admin.password);
      cy.visit("/dashboard");

      // Admin menu should be visible
      cy.dataCy("admin-menu").should("be.visible");
      cy.dataCy("team-management-link").should("be.visible");
    });
  });

  describe("User Session Management", () => {
    const testUser = {
      email: "session@test.com",
      password: "SessionPass123!",
      uid: "session-user-uid",
    };

    beforeEach(() => {
      cy.task("createUser", testUser);
    });

    it("should logout successfully", () => {
      cy.login(testUser.email, testUser.password);
      cy.visit("/dashboard");

      // Logout
      cy.dataCy("user-menu").click();
      cy.dataCy("logout-button").click();

      // Verify redirected to login
      cy.url().should("include", "/auth/login");

      // Try to access protected page
      cy.visit("/dashboard");
      cy.url().should("include", "/auth/login");
    });

    it("should handle session expiration", () => {
      cy.login(testUser.email, testUser.password);
      cy.visit("/dashboard");

      // Simulate session expiration
      cy.task("expireUserSession", { uid: testUser.uid });

      // Try to perform action
      cy.visit("/tras");

      // Should be redirected to login
      cy.url().should("include", "/auth/login");
      cy.dataCy("session-expired-message").should("be.visible");
    });

    it("should prevent concurrent sessions if configured", () => {
      // Login on first device
      cy.login(testUser.email, testUser.password);
      cy.visit("/dashboard");

      // Simulate login on second device
      cy.task("createNewSession", { email: testUser.email, password: testUser.password });

      // First session should be invalidated
      cy.reload();
      cy.url().should("include", "/auth/login");
      cy.dataCy("session-invalidated-message").should("contain", "logged in elsewhere");
    });
  });
});
