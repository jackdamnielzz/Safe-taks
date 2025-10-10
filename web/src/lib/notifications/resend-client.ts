/**
 * Resend Email Client
 *
 * Handles all email sending operations via Resend API
 * Supports transactional emails with custom domain (@maasiso.nl)
 */

import { Resend } from "resend";

// Initialize Resend with API key
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@maasiso.nl";
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || "SafeWork Pro";

let resend: Resend | null = null;

if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
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
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    content: string | Buffer;
    filename: string;
  }>;
  tags?: Array<{ name: string; value: string }>;
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
    if (!resend || !RESEND_API_KEY) {
      console.warn("Resend API key not configured. Email not sent:", options.subject);
      return {
        success: false,
        error: "Resend API key not configured",
      };
    }

    // Resend requires either html or text
    const emailData: any = {
      from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
    };

    // Add content (html takes priority)
    if (options.html) {
      emailData.html = options.html;
    } else if (options.text) {
      emailData.text = options.text;
    } else {
      return {
        success: false,
        error: "Either html or text content is required",
      };
    }

    // Add optional fields
    if (options.cc) emailData.cc = options.cc;
    if (options.bcc) emailData.bcc = options.bcc;
    if (options.replyTo) emailData.reply_to = options.replyTo;
    if (options.attachments) emailData.attachments = options.attachments;
    if (options.tags) emailData.tags = options.tags;

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error("Resend email error:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error: any) {
    console.error("Resend email error:", error);
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
    if (!resend || !RESEND_API_KEY) {
      console.warn("Resend API key not configured. Batch emails not sent");
      return emails.map(() => ({
        success: false,
        error: "Resend API key not configured",
      }));
    }

    const messages = emails.map((options) => {
      const msg: any = {
        from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
      };

      // Add content (html takes priority)
      if (options.html) {
        msg.html = options.html;
      } else if (options.text) {
        msg.text = options.text;
      }

      if (options.tags) msg.tags = options.tags;

      return msg;
    });

    const { data, error } = await resend.batch.send(messages);

    if (error) {
      console.error("Resend batch email error:", error);
      return emails.map(() => ({
        success: false,
        error: error.message || "Failed to send batch emails",
      }));
    }

    return Array.isArray(data)
      ? data.map((item: any) => ({
          success: true,
          messageId: item.id,
        }))
      : [];
  } catch (error: any) {
    console.error("Resend batch email error:", error);
    return emails.map(() => ({
      success: false,
      error: error.message || "Failed to send batch emails",
    }));
  }
}

/**
 * Verify email address (basic validation)
 */
export async function verifyEmail(email: string): Promise<boolean> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
