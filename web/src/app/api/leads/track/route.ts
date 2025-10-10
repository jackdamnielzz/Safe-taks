/**
 * Lead Tracking API Route
 * Handles lead activity tracking and analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { LeadTrackingEvent } from "@/lib/types/lead";

// Mock database for development - replace with real database in production
let trackingEvents: LeadTrackingEvent[] = [];
let nextEventId = 1;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, leadId, email, source, sourceUrl, metadata, timestamp, userAgent, ipAddress } =
      body;

    // Create tracking event
    const event: LeadTrackingEvent = {
      type,
      leadId,
      email,
      source,
      sourceUrl,
      metadata,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      userAgent,
      ipAddress,
    };

    // Store event (in production, this would go to a proper analytics database)
    trackingEvents.push({
      ...event,
    });

    // In a real implementation, you might also:
    // 1. Update lead score based on activity
    // 2. Trigger marketing automation workflows
    // 3. Send notifications to sales team
    // 4. Update CRM lead status

    return NextResponse.json({ success: true, eventId: nextEventId++ });
  } catch (error) {
    console.error("Lead tracking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");
    const email = searchParams.get("email");
    const type = searchParams.get("type");

    let events = trackingEvents;

    // Filter by lead ID if provided
    if (leadId) {
      events = events.filter((event) => event.leadId === leadId);
    }

    // Filter by email if provided
    if (email) {
      events = events.filter((event) => event.email === email);
    }

    // Filter by event type if provided
    if (type) {
      events = events.filter((event) => event.type === type);
    }

    // Sort by timestamp (most recent first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Lead tracking retrieval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
