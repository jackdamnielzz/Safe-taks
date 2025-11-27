/**
 * Notification Service Integration Tests
 *
 * Tests the complete email notification flow:
 * - notification-service → email-templates → resend-client
 * - All email types (TRA approvals, LMRA stop-work, subscription events)
 * - Proper template rendering and tag application
 */

// Mock the resend-client module directly
const mockSendEmail = jest.fn();
const mockSendBatchEmails = jest.fn();

jest.mock('../lib/notifications/resend-client', () => ({
  sendEmail: (...args: any[]) => mockSendEmail(...args),
  sendBatchEmails: (...args: any[]) => mockSendBatchEmails(...args),
  EmailType: {
    WELCOME: 'welcome',
    INVITATION: 'invitation',
    TRA_CREATED: 'tra_created',
    TRA_APPROVAL_REQUEST: 'tra_approval_request',
    TRA_APPROVED: 'tra_approved',
    TRA_REJECTED: 'tra_rejected',
    LMRA_STOP_WORK: 'lmra_stop_work',
    LMRA_COMPLETED: 'lmra_completed',
    PASSWORD_RESET: 'password_reset',
    COMPETENCY_EXPIRY_WARNING: 'competency_expiry_warning',
    SUBSCRIPTION_CREATED: 'subscription_created',
    SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
    PAYMENT_FAILED: 'payment_failed',
    TRIAL_ENDING: 'trial_ending',
    USAGE_LIMIT_WARNING: 'usage_limit_warning',
  },
}));

import * as notificationService from '../lib/notifications/notification-service';

describe('Notification Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock response
    mockSendEmail.mockResolvedValue({
      success: true,
      messageId: 'mock-message-id-123',
    });
    
    mockSendBatchEmails.mockResolvedValue([
      { success: true, messageId: 'mock-batch-id-1' },
      { success: true, messageId: 'mock-batch-id-2' },
    ]);
  });

  describe('TRA Approval Flow', () => {
    it('should send TRA approval request with correct template and tags', async () => {
      const result = await notificationService.sendTraApprovalRequest(
        'approver@example.com',
        {
          traTitle: 'Hoogwerker Inspectie',
          creatorName: 'Jan Jansen',
          projectName: 'Project Alpha',
          approvalLink: 'https://test.safeworkpro.nl/approvals/tra-123',
          dueDate: '2025-01-15',
        }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-message-id-123');

      // Verify email was sent with correct structure
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'approver@example.com',
          subject: 'Goedkeuring Vereist: Hoogwerker Inspectie',
          tags: [
            { name: 'type', value: 'tra_approval_request' },
            { name: 'app', value: 'safework-pro' },
          ],
        })
      );

      // Verify HTML content includes key elements
      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Goedkeuring Vereist');
      expect(callArgs.html).toContain('Hoogwerker Inspectie');
      expect(callArgs.html).toContain('Jan Jansen');
      expect(callArgs.html).toContain('Project Alpha');
      expect(callArgs.html).toContain('2025-01-15');
      expect(callArgs.html).toContain('https://test.safeworkpro.nl/approvals/tra-123');

      // Verify plain text version exists
      expect(callArgs.text).toContain('Goedkeuring Vereist');
      expect(callArgs.text).toContain('Hoogwerker Inspectie');
    });

    it('should send TRA approved notification', async () => {
      const result = await notificationService.sendTraApprovedNotification(
        'creator@example.com',
        {
          traTitle: 'Hoogwerker Inspectie',
          approverName: 'Piet Pietersen',
          traLink: 'https://test.safeworkpro.nl/tras/tra-123',
        }
      );

      expect(result.success).toBe(true);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.subject).toBe('TRA Goedgekeurd: Hoogwerker Inspectie');
      expect(callArgs.html).toContain('TRA Goedgekeurd');
      expect(callArgs.html).toContain('Piet Pietersen');
      expect(callArgs.tags).toContainEqual({ name: 'type', value: 'tra_approved' });
    });

    it('should send TRA rejected notification with reason', async () => {
      const result = await notificationService.sendTraRejectedNotification(
        'creator@example.com',
        {
          traTitle: 'Hoogwerker Inspectie',
          rejectorName: 'Klaas Klaassen',
          reason: 'Onvoldoende beheersmaatregelen voor werken op hoogte',
          traLink: 'https://test.safeworkpro.nl/tras/tra-123',
        }
      );

      expect(result.success).toBe(true);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.subject).toBe('TRA Afgekeurd: Hoogwerker Inspectie');
      expect(callArgs.html).toContain('TRA Afgekeurd');
      expect(callArgs.html).toContain('Klaas Klaassen');
      expect(callArgs.html).toContain('Onvoldoende beheersmaatregelen');
      expect(callArgs.tags).toContainEqual({ name: 'type', value: 'tra_rejected' });
    });
  });

  describe('LMRA Stop Work Flow', () => {
    it('should send critical stop work alert with high priority tags', async () => {
      const result = await notificationService.sendLmraStopWorkAlert(
        ['supervisor@example.com', 'safety@example.com'],
        {
          projectName: 'Project Alpha',
          location: 'Bouwplaats A, Sector 3',
          reason: 'Onveilige situatie: geen valbeveiliging aanwezig',
          executorName: 'Henk Hendriks',
          lmraLink: 'https://test.safeworkpro.nl/lmra/lmra-456',
        }
      );

      expect(result.success).toBe(true);

      const callArgs = mockSendEmail.mock.calls[0][0];
      
      // Verify critical subject line
      expect(callArgs.subject).toBe('🚨 STOP WERK - Project Alpha');
      
      // Verify recipients
      expect(callArgs.to).toEqual(['supervisor@example.com', 'safety@example.com']);
      
      // Verify critical priority tag
      expect(callArgs.tags).toContainEqual({ name: 'type', value: 'lmra_stop_work' });
      expect(callArgs.tags).toContainEqual({ name: 'priority', value: 'critical' });
      
      // Verify content emphasizes urgency
      expect(callArgs.html).toContain('STOP WERK SITUATIE');
      expect(callArgs.html).toContain('Onveilige situatie');
      expect(callArgs.html).toContain('Bouwplaats A, Sector 3');
      expect(callArgs.html).toContain('Henk Hendriks');
      
      // Verify plain text also has urgency markers
      expect(callArgs.text).toContain('🚨 STOP WERK');
      expect(callArgs.text).toContain('ACTIE VEREIST');
    });
  });

  describe('Subscription Event Flow', () => {
    it('should send subscription created email', async () => {
      const result = await notificationService.sendSubscriptionCreatedEmail(
        'customer@example.com',
        {
          planName: 'Professional',
          amount: '49.00',
          billingPeriod: 'maand',
        }
      );

      expect(result.success).toBe(true);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.subject).toBe('Abonnement Geactiveerd - SafeWork Pro');
      expect(callArgs.html).toContain('Abonnement Geactiveerd');
      expect(callArgs.html).toContain('Professional');
      expect(callArgs.html).toContain('€49.00');
      expect(callArgs.html).toContain('maand');
      expect(callArgs.tags).toContainEqual({ name: 'type', value: 'subscription_created' });
    });

    it('should send payment failed email with high priority', async () => {
      const result = await notificationService.sendPaymentFailedEmail(
        'customer@example.com',
        {
          amount: '49.00',
          retryDate: '2025-01-20',
        }
      );

      expect(result.success).toBe(true);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.subject).toBe('Betaling Mislukt - SafeWork Pro');
      expect(callArgs.html).toContain('Betaling Mislukt');
      expect(callArgs.html).toContain('€49.00');
      expect(callArgs.html).toContain('2025-01-20');
      expect(callArgs.tags).toContainEqual({ name: 'type', value: 'payment_failed' });
      expect(callArgs.tags).toContainEqual({ name: 'priority', value: 'high' });
    });
  });

  describe('Welcome and Onboarding Flow', () => {
    it('should send welcome email to new users', async () => {
      const result = await notificationService.sendWelcomeEmail(
        'newuser@example.com',
        {
          userName: 'Marie Jansen',
          organizationName: 'Bouwbedrijf XYZ',
        }
      );

      expect(result.success).toBe(true);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.subject).toBe('Welkom bij SafeWork Pro');
      expect(callArgs.html).toContain('Welkom bij SafeWork Pro');
      expect(callArgs.html).toContain('Marie Jansen');
      expect(callArgs.html).toContain('Bouwbedrijf XYZ');
      expect(callArgs.html).toContain('dashboard');
      expect(callArgs.tags).toContainEqual({ name: 'type', value: 'welcome' });
    });

    it('should send password reset email', async () => {
      const result = await notificationService.sendPasswordResetEmail(
        'user@example.com',
        {
          resetLink: 'https://test.safeworkpro.nl/reset-password?token=abc123',
        }
      );

      expect(result.success).toBe(true);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.subject).toBe('Wachtwoord Reset - SafeWork Pro');
      expect(callArgs.html).toContain('Wachtwoord Reset');
      expect(callArgs.html).toContain('https://test.safeworkpro.nl/reset-password?token=abc123');
      expect(callArgs.html).toContain('1 uur geldig');
    });
  });

  describe('Competency Management Flow', () => {
    it('should send competency expiry warning with normal priority', async () => {
      const result = await notificationService.sendCompetencyExpiryWarning(
        'worker@example.com',
        {
          userName: 'Kees de Vries',
          competencyName: 'VCA Basis',
          expiryDate: '2025-02-15',
          daysUntilExpiry: 30,
          renewalLink: 'https://test.safeworkpro.nl/competencies/renew/vca-123',
        }
      );

      expect(result.success).toBe(true);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.subject).toContain('Competentie Verloopt Binnenkort');
      expect(callArgs.html).toContain('Kees de Vries');
      expect(callArgs.html).toContain('VCA Basis');
      expect(callArgs.html).toContain('30 dagen');
      expect(callArgs.tags).toContainEqual({ name: 'priority', value: 'normal' });
    });

    it('should send urgent competency expiry warning for <7 days', async () => {
      const result = await notificationService.sendCompetencyExpiryWarning(
        'worker@example.com',
        {
          userName: 'Kees de Vries',
          competencyName: 'VCA Basis',
          expiryDate: '2025-01-16',
          daysUntilExpiry: 5,
        }
      );

      expect(result.success).toBe(true);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.subject).toContain('⚠️ URGENT');
      expect(callArgs.html).toContain('URGENTE WAARSCHUWING');
      expect(callArgs.html).toContain('5 dagen');
      expect(callArgs.tags).toContainEqual({ name: 'priority', value: 'high' });
    });
  });

  describe('Error Handling', () => {
    it('should handle Resend API errors', async () => {
      mockSendEmail.mockResolvedValueOnce({
        success: false,
        error: 'Invalid email address',
      });

      const result = await notificationService.sendWelcomeEmail(
        'invalid-email',
        {
          userName: 'Test User',
          organizationName: 'Test Org',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address');
    });

    it('should handle network errors', async () => {
      mockSendEmail.mockResolvedValueOnce({
        success: false,
        error: 'Network timeout',
      });

      const result = await notificationService.sendWelcomeEmail(
        'test@example.com',
        {
          userName: 'Test User',
          organizationName: 'Test Org',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });
  });

  describe('Template Rendering', () => {
    it('should render all required fields in TRA approval template', async () => {
      await notificationService.sendTraApprovalRequest(
        'approver@example.com',
        {
          traTitle: 'Test TRA',
          creatorName: 'Creator Name',
          projectName: 'Project Name',
          approvalLink: 'https://example.com/approve',
          dueDate: '2025-01-15',
        }
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      
      // Check all required fields are present
      expect(callArgs.html).toContain('Test TRA');
      expect(callArgs.html).toContain('Creator Name');
      expect(callArgs.html).toContain('Project Name');
      expect(callArgs.html).toContain('https://example.com/approve');
      expect(callArgs.html).toContain('2025-01-15');
      
      // Check both HTML and text versions exist
      expect(callArgs.html).toBeTruthy();
      expect(callArgs.text).toBeTruthy();
      
      // Check text version has same content
      expect(callArgs.text).toContain('Test TRA');
      expect(callArgs.text).toContain('Creator Name');
    });

    it('should handle optional fields gracefully', async () => {
      await notificationService.sendTraApprovalRequest(
        'approver@example.com',
        {
          traTitle: 'Test TRA',
          creatorName: 'Creator Name',
          projectName: 'Project Name',
          approvalLink: 'https://example.com/approve',
          // dueDate is optional
        }
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      
      // Should still render successfully without optional fields
      expect(callArgs.html).toContain('Test TRA');
      expect(callArgs.html).not.toContain('undefined');
      expect(callArgs.html).not.toContain('null');
    });
  });

  describe('Email Tags and Metadata', () => {
    it('should apply consistent tags across all email types', async () => {
      const emailFunctions = [
        () => notificationService.sendWelcomeEmail('test@example.com', {
          userName: 'Test',
          organizationName: 'Org',
        }),
        () => notificationService.sendTraApprovalRequest('test@example.com', {
          traTitle: 'TRA',
          creatorName: 'Creator',
          projectName: 'Project',
          approvalLink: 'https://example.com',
        }),
        () => notificationService.sendLmraStopWorkAlert('test@example.com', {
          projectName: 'Project',
          location: 'Location',
          reason: 'Reason',
          executorName: 'Executor',
          lmraLink: 'https://example.com',
        }),
      ];

      for (const fn of emailFunctions) {
        await fn();
      }

      // Verify all emails have the app tag
      const calls = mockSendEmail.mock.calls;
      calls.forEach((call: any) => {
        expect(call[0].tags).toContainEqual({ name: 'app', value: 'safework-pro' });
      });
    });
  });
});