/**
 * CRM Service for lead capture and management
 * Supports multiple CRM providers: Mailchimp, ConvertKit, HubSpot, Pipedrive
 */

import {
  Lead,
  LeadCaptureForm,
  CRMProvider,
  CRMContact,
  LeadActivity,
  LeadTrackingEvent,
} from "@/lib/types/lead";
import { crmConfig } from "./crm-config";

export class CRMService {
  private provider: CRMProvider;
  private baseUrl = "/api/leads";

  constructor(provider?: CRMProvider) {
    this.provider = provider || crmConfig;
  }

  /**
   * Capture a new lead from form submission
   */
  async captureLead(formData: LeadCaptureForm, source?: string): Promise<Lead> {
    try {
      // Enrich lead data with source tracking
      const leadData: Partial<Lead> = {
        ...formData,
        source: source || this.getSourceFromUrl(),
        sourceUrl: typeof window !== 'undefined' ? window.location.href : '',
        status: "new",
        createdAt: new Date(),
        leadScore: this.calculateLeadScore(formData),
        tags: this.generateLeadTags(formData),
      };

      // Send to our API
      const response = await fetch(`${this.baseUrl}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        throw new Error(`Failed to capture lead: ${response.statusText}`);
      }

      const lead = await response.json();

      // Sync to external CRM if configured
      if (this.provider.apiKey) {
        await this.syncToCRM(lead);
      }

      return lead;
    } catch (error) {
      console.error("CRM lead capture error:", error);
      throw error;
    }
  }

  /**
   * Track lead activity (page views, clicks, etc.)
   */
  async trackActivity(activity: LeadTrackingEvent): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activity),
      });
    } catch (error) {
      console.error("Lead tracking error:", error);
      // Don't throw - tracking failures shouldn't break user experience
    }
  }

  /**
   * Sync lead to external CRM
   */
  private async syncToCRM(lead: Lead): Promise<void> {
    try {
      const crmContact = this.transformLeadToCRMContact(lead);

      switch (this.provider.name) {
        case "mailchimp":
          await this.syncToMailchimp(crmContact);
          break;
        case "convertkit":
          await this.syncToConvertKit(crmContact);
          break;
        case "hubspot":
          await this.syncToHubSpot(crmContact);
          break;
        case "pipedrive":
          await this.syncToPipedrive(crmContact);
          break;
        default:
          console.log("No CRM provider configured for sync");
      }
    } catch (error) {
      console.error("CRM sync error:", error);
      // Don't throw - CRM sync failures shouldn't break lead capture
    }
  }

  /**
   * Sync to Mailchimp
   */
  private async syncToMailchimp(contact: CRMContact): Promise<void> {
    if (!this.provider.apiKey || !this.provider.listId) return;

    const response = await fetch(
      `https://${this.provider.apiKey.split("-")[1]}.api.mailchimp.com/3.0/lists/${this.provider.listId}/members`,
      {
        method: "POST",
        headers: {
          Authorization: `apikey ${this.provider.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: contact.email,
          status: "pending",
          merge_fields: {
            FNAME: contact.firstName || "",
            LNAME: contact.lastName || "",
            COMPANY: contact.company || "",
            PHONE: contact.phone || "",
          },
          tags: contact.tags || [],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Mailchimp sync failed: ${response.statusText}`);
    }
  }

  /**
   * Sync to ConvertKit
   */
  private async syncToConvertKit(contact: CRMContact): Promise<void> {
    if (!this.provider.apiKey) return;

    const formData = new URLSearchParams();
    formData.append("api_key", this.provider.apiKey);
    formData.append("email", contact.email);
    formData.append("first_name", contact.firstName || "");

    if (contact.tags?.length) {
      formData.append("tags", contact.tags.join(","));
    }

    const response = await fetch(
      `https://api.convertkit.com/v3/forms/${this.provider.config?.formId || "default"}/subscribe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`ConvertKit sync failed: ${response.statusText}`);
    }
  }

  /**
   * Sync to HubSpot
   */
  private async syncToHubSpot(contact: CRMContact): Promise<void> {
    if (!this.provider.apiKey) return;

    const response = await fetch(
      `https://api.hubapi.com/contacts/v1/contact/?hapikey=${this.provider.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: [
            { property: "email", value: contact.email },
            { property: "firstname", value: contact.firstName || "" },
            { property: "lastname", value: contact.lastName || "" },
            { property: "company", value: contact.company || "" },
            { property: "phone", value: contact.phone || "" },
            { property: "lifecyclestage", value: "lead" },
            { property: "hs_lead_status", value: "NEW" },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HubSpot sync failed: ${response.statusText}`);
    }
  }

  /**
   * Sync to Pipedrive
   */
  private async syncToPipedrive(contact: CRMContact): Promise<void> {
    if (!this.provider.apiKey) return;

    const response = await fetch(
      `${this.provider.apiUrl || "https://api.pipedrive.com/v1"}/persons?api_token=${this.provider.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email,
          email: contact.email,
          phone: contact.phone || "",
          org_name: contact.company || "",
          label: contact.status || 1,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Pipedrive sync failed: ${response.statusText}`);
    }
  }

  /**
   * Transform internal lead to CRM contact format
   */
  private transformLeadToCRMContact(lead: Lead): CRMContact {
    return {
      id: lead.crmId,
      email: lead.email,
      firstName: lead.firstName,
      lastName: lead.lastName,
      company: lead.company,
      phone: lead.phone,
      tags: lead.tags,
      customFields: lead.customFields,
      status: lead.status,
      source: lead.source,
    };
  }

  /**
   * Calculate lead score based on form data
   */
  private calculateLeadScore(formData: LeadCaptureForm): number {
    let score = 0;

    // Email is required - base score
    score += 10;

    // Name fields
    if (formData.firstName) score += 5;
    if (formData.lastName) score += 5;

    // Company information
    if (formData.company) score += 15;
    if (formData.jobTitle) score += 10;

    // Phone number
    if (formData.phone) score += 10;

    // Company size indicates buying intent
    if (formData.companySize) score += 5;

    // Industry relevance
    if (formData.industry) score += 5;

    // Multiple interests
    if (formData.interests && formData.interests.length > 1) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Generate relevant tags for the lead
   */
  private generateLeadTags(formData: LeadCaptureForm): string[] {
    const tags: string[] = [];

    if (formData.companySize) {
      if (formData.companySize.includes("1-10")) tags.push("small-business");
      else if (formData.companySize.includes("11-50")) tags.push("medium-business");
      else if (formData.companySize.includes("51-200")) tags.push("growing-business");
      else if (formData.companySize.includes("200+")) tags.push("enterprise");
    }

    if (formData.industry) {
      tags.push(formData.industry.toLowerCase().replace(/\s+/g, "-"));
    }

    if (formData.interests?.includes("pricing")) tags.push("pricing-interested");
    if (formData.interests?.includes("demo")) tags.push("demo-requested");
    if (formData.interests?.includes("enterprise")) tags.push("enterprise-inquiry");

    // Source-based tags
    if (formData.source) {
      tags.push(`source-${formData.source}`);
    }

    return tags;
  }

  /**
   * Get source from current URL
   */
  private getSourceFromUrl(): string {
    if (typeof window === 'undefined') return 'direct';
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("utm_source") || urlParams.get("source") || "direct";
  }

  /**
   * Track page view for lead scoring
   */
  trackPageView(email?: string): void {
    if (typeof window === 'undefined') return;
    this.trackActivity({
      type: "page_view",
      leadId: email,
      source: this.getSourceFromUrl(),
      sourceUrl: window.location.href,
      timestamp: new Date(),
      metadata: {
        page: window.location.pathname,
        referrer: document.referrer,
      },
    });
  }

  /**
   * Track CTA click for lead scoring
   */
  trackCTA(action: string, email?: string): void {
    if (typeof window === 'undefined') return;
    this.trackActivity({
      type: "cta_click",
      leadId: email,
      source: this.getSourceFromUrl(),
      sourceUrl: window.location.href,
      timestamp: new Date(),
      metadata: {
        action,
        page: window.location.pathname,
      },
    });
  }
}

// Export singleton instance
export const crmService = new CRMService();
