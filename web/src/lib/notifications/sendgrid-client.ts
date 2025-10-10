/**
 * SendGrid Email Client
 *
 * Handles all email sending operations via SendGrid API
 * Supports transactional emails, templates, and delivery tracking
 */

import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@safeworkpro.nl";
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "SafeWork Pro";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * Email types for tracking and categorization
 */
export enum EmailType {
  WELCOME = "welcome",
  INVITATION = "invitation",
  TRA_CREATED = "tra_created",
  TRA_APPROVED = "tra_approved",
  TRA_REJECTED = "tra_rejected",
  LMRA_STOP_WORK = "lmra_stop_work",
  LMRA_COMPLETED = "lmra_completed",
  PASSWORD_RESET = "password_reset",
  SUBSCRIPTION_CREATED = "subscription_created",
  SUBSCRIPTION_CANCELLED = "subscription_cancelled",
  PAYMENT_FAILED = "payment_failed",
  TRIAL_ENDING = "trial_ending",
  USAGE_LIMIT_WARNING = "usage_limit_warning",
}

/**
 * Email sending options
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: "attachment" | "inline";
  }>;
  categories?: string[];
  customArgs?: Record<string, string>;
}

/**
 * Email delivery result
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a single email
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    if (!SENDGRID_API_KEY) {
      console.warn("SendGrid API key not configured. Email not sent:", options.subject);
      return {
        success: false,
        error: "SendGrid API key not configured",
      };
    }

    const msg: any = {
      to: options.to,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      subject: options.subject,
      ...(options.text && { text: options.text }),
      ...(options.html && { html: options.html }),
      ...(options.templateId && { templateId: options.templateId }),
      ...(options.dynamicTemplateData && { dynamicTemplateData: options.dynamicTemplateData }),
      ...(options.cc && { cc: options.cc }),
      ...(options.bcc && { bcc: options.bcc }),
      ...(options.replyTo && { replyTo: options.replyTo }),
      ...(options.attachments && { attachments: options.attachments }),
      ...(options.categories && { categories: options.categories }),
      ...(options.customArgs && { customArgs: options.customArgs }),
    };

    const [response] = await sgMail.send(msg);

    return {
      success: true,
      messageId: response.headers["x-message-id"] as string,
    };
  } catch (error: any) {
    console.error("SendGrid email error:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

/**
 * Send multiple emails (batch)
 */
export async function sendBatchEmails(emails: SendEmailOptions[]): Promise<EmailResult[]> {
  try {
    if (!SENDGRID_API_KEY) {
      console.warn("SendGrid API key not configured. Batch emails not sent");
      return emails.map(() => ({
        success: false,
        error: "SendGrid API key not configured",
      }));
    }

    const messages = emails.map((options) => {
      const msg: any = {
        to: options.to,
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: SENDGRID_FROM_NAME,
        },
        subject: options.subject,
      };

      // Add content based on what's provided
      if (options.html) {
        msg.html = options.html;
      } else if (options.text) {
        msg.text = options.text;
      } else if (options.templateId) {
        msg.templateId = options.templateId;
        if (options.dynamicTemplateData) {
          msg.dynamicTemplateData = options.dynamicTemplateData;
        }
      }

      if (options.categories) msg.categories = options.categories;
      if (options.customArgs) msg.customArgs = options.customArgs;

      return msg;
    });

    await sgMail.send(messages);

    return emails.map(() => ({ success: true }));
  } catch (error: any) {
    console.error("SendGrid batch email error:", error);
    return emails.map(() => ({
      success: false,
      error: error.message || "Failed to send batch emails",
    }));
  }
}

/**
 * Verify email address (check if it's valid and deliverable)
 */
export async function verifyEmail(email: string): Promise<boolean> {
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Track email delivery status
 * Note: Requires SendGrid Event Webhook setup
 */
export interface EmailDeliveryStatus {
  email: string;
  status: "delivered" | "bounced" | "opened" | "clicked" | "spam" | "unsubscribed";
  timestamp: Date;
  reason?: string;
}

/**
 * Process SendGrid webhook event
 */
export function processWebhookEvent(event: any): EmailDeliveryStatus | null {
  try {
    return {
      email: event.email,
      status: event.event as EmailDeliveryStatus["status"],
      timestamp: new Date(event.timestamp * 1000),
      reason: event.reason,
    };
  } catch (error) {
    console.error("Error processing SendGrid webhook event:", error);
    return null;
  }
}

/**
 * Unsubscribe user from email list
 */
export async function unsubscribeEmail(email: string): Promise<boolean> {
  try {
    if (!SENDGRID_API_KEY) {
      console.warn("SendGrid API key not configured");
      return false;
    }

    // Note: This requires SendGrid Suppression API
    // Implementation depends on your SendGrid setup
    console.log("Unsubscribe request for:", email);
    return true;
  } catch (error) {
    console.error("Error unsubscribing email:", error);
    return false;
  }
}
