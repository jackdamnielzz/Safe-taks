/**
 * Notification Service
 * 
 * High-level service for sending notifications across the application
 * Integrates with Resend email service
 */

import { sendEmail, EmailType } from './resend-client';
import { getEmailTemplate } from './email-templates';

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  to: string,
  data: { userName: string; organizationName: string }
) {
  const template = getEmailTemplate(EmailType.WELCOME, data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'welcome' },
      { name: 'app', value: 'safework-pro' },
    ],
  });
}

/**
 * Send TRA approval request to approver
 */
export async function sendTraApprovalRequest(
  to: string,
  data: {
    traTitle: string;
    creatorName: string;
    projectName: string;
    approvalLink: string;
    dueDate?: string;
  }
) {
  const template = getEmailTemplate(EmailType.TRA_APPROVAL_REQUEST, data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'tra_approval_request' },
      { name: 'app', value: 'safework-pro' },
    ],
  });
}

/**
 * Send TRA approved notification to creator
 */
export async function sendTraApprovedNotification(
  to: string,
  data: {
    traTitle: string;
    approverName: string;
    traLink: string;
  }
) {
  const template = getEmailTemplate(EmailType.TRA_APPROVED, data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'tra_approved' },
      { name: 'app', value: 'safework-pro' },
    ],
  });
}

/**
 * Send TRA rejected notification to creator
 */
export async function sendTraRejectedNotification(
  to: string,
  data: {
    traTitle: string;
    rejectorName: string;
    reason: string;
    traLink: string;
  }
) {
  const template = getEmailTemplate(EmailType.TRA_REJECTED, data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'tra_rejected' },
      { name: 'app', value: 'safework-pro' },
    ],
  });
}

/**
 * Send LMRA stop work alert (CRITICAL)
 */
export async function sendLmraStopWorkAlert(
  to: string | string[],
  data: {
    projectName: string;
    location: string;
    reason: string;
    executorName: string;
    lmraLink: string;
  }
) {
  const template = getEmailTemplate(EmailType.LMRA_STOP_WORK, data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'lmra_stop_work' },
      { name: 'priority', value: 'critical' },
      { name: 'app', value: 'safework-pro' },
    ],
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  data: { resetLink: string }
) {
  const template = getEmailTemplate(EmailType.PASSWORD_RESET, data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'password_reset' },
      { name: 'app', value: 'safework-pro' },
    ],
  });
}

/**
 * Send competency expiry warning
 */
export async function sendCompetencyExpiryWarning(
  to: string,
  data: {
    userName: string;
    competencyName: string;
    expiryDate: string;
    daysUntilExpiry: number;
    renewalLink?: string;
  }
) {
  const template = getEmailTemplate(EmailType.COMPETENCY_EXPIRY_WARNING, data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'competency_expiry' },
      { name: 'priority', value: data.daysUntilExpiry <= 7 ? 'high' : 'normal' },
      { name: 'app', value: 'safework-pro' },
    ],
  });
}

/**
 * Send subscription created email
 */
export async function sendSubscriptionCreatedEmail(
  to: string,
  data: {
    planName: string;
    amount: string;
    billingPeriod: string;
  }
) {
  const template = getEmailTemplate(EmailType.SUBSCRIPTION_CREATED, data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'subscription_created' },
      { name: 'app', value: 'safework-pro' },
    ],
  });
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(
  to: string,
  data: {
    amount: string;
    retryDate: string;
  }
) {
  const template = getEmailTemplate(EmailType.PAYMENT_FAILED, data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'payment_failed' },
      { name: 'priority', value: 'high' },
      { name: 'app', value: 'safework-pro' },
    ],
  });
}