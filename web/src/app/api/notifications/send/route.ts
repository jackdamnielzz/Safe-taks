/**
 * Send Email Notification API
 *
 * POST /api/notifications/send
 * Sends email notifications using Resend
 */

import { NextRequest, NextResponse } from "next/server";
import { sendEmail, EmailType } from "@/lib/notifications/resend-client";
import { getEmailTemplate } from "@/lib/notifications/email-templates";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, data, userId } = body;

    // Validate required fields
    if (!type || !to) {
      return NextResponse.json({ error: "Missing required fields: type, to" }, { status: 400 });
    }

    // Validate email type
    if (!Object.values(EmailType).includes(type)) {
      return NextResponse.json({ error: `Invalid email type: ${type}` }, { status: 400 });
    }

    // Get email template
    const template = getEmailTemplate(type as EmailType, data || {});

    // Send email
    const result = await sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [
        { name: "app", value: "safework-pro" },
        { name: "type", value: type },
        { name: "userId", value: userId || "system" },
      ],
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error("Send email error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
