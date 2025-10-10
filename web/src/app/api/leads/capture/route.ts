/**
 * Lead Capture API Route
 * Handles lead form submissions and CRM integration
 */

import { NextRequest, NextResponse } from "next/server";
import { Lead, LeadCaptureForm } from "@/lib/types/lead";

// Mock database for development - replace with real database in production
let leads: Lead[] = [];
let nextId = 1;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      company,
      phone,
      jobTitle,
      companySize,
      industry,
      interests,
      gdprConsent,
      marketingConsent,
      source,
      sourceUrl,
      sourceCampaign,
    } = body;

    // Validate required fields
    if (!email || !gdprConsent) {
      return NextResponse.json({ error: "Email and GDPR consent are required" }, { status: 400 });
    }

    // Check for existing lead
    const existingLead = leads.find((lead) => lead.email === email);

    if (existingLead) {
      // Update existing lead
      const updatedLead: Lead = {
        ...existingLead,
        firstName: firstName || existingLead.firstName,
        lastName: lastName || existingLead.lastName,
        company: company || existingLead.company,
        phone: phone || existingLead.phone,
        jobTitle: jobTitle || existingLead.jobTitle,
        companySize: companySize || existingLead.companySize,
        industry: industry || existingLead.industry,
        interests: interests || existingLead.interests,
        marketingConsent,
        updatedAt: new Date(),
        lastActivityAt: new Date(),
      };

      leads = leads.map((lead) => (lead.id === existingLead.id ? updatedLead : lead));

      return NextResponse.json(updatedLead);
    } else {
      // Create new lead
      const newLead: Lead = {
        id: `lead_${nextId++}`,
        email,
        firstName,
        lastName,
        company,
        phone,
        jobTitle,
        companySize,
        industry,
        interests,
        source,
        sourceUrl,
        sourceCampaign,
        status: "new",
        gdprConsent,
        marketingConsent,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
      };

      leads.push(newLead);

      return NextResponse.json(newLead, { status: 201 });
    }
  } catch (error) {
    console.error("Lead capture error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (email) {
      // Get specific lead by email
      const lead = leads.find((l) => l.email === email);
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
      return NextResponse.json(lead);
    } else {
      // Get all leads (admin only - should add authentication)
      return NextResponse.json({ leads });
    }
  } catch (error) {
    console.error("Lead retrieval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
