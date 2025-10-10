/**
 * Lead capture and CRM integration types
 */

export interface Lead {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  jobTitle?: string;
  companySize?: string;
  industry?: string;
  interests?: string[];
  source?: string;
  sourceUrl?: string;
  sourceCampaign?: string;
  leadScore?: number;
  status: LeadStatus;
  tags?: string[];
  customFields?: Record<string, any>;
  gdprConsent: boolean;
  marketingConsent: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastActivityAt?: Date;
  crmId?: string; // External CRM system ID
  crmSyncedAt?: Date;
}

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost"
  | "unsubscribed";

export interface LeadCaptureForm {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  jobTitle?: string;
  companySize?: string;
  industry?: string;
  interests?: string[];
  gdprConsent: boolean;
  marketingConsent: boolean;
  source?: string;
  sourceUrl?: string;
  sourceCampaign?: string;
}

export interface CRMProvider {
  name: "mailchimp" | "convertkit" | "hubspot" | "pipedrive" | "generic";
  apiKey?: string;
  apiUrl?: string;
  listId?: string;
  config?: Record<string, any>;
}

export interface CRMContact {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  status?: string;
  source?: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type:
    | "email_opened"
    | "email_clicked"
    | "form_submitted"
    | "page_visited"
    | "demo_requested"
    | "pricing_viewed";
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  source?: string;
}

export interface LeadTrackingEvent {
  type: "page_view" | "form_submit" | "cta_click" | "pricing_view" | "demo_request";
  leadId?: string;
  email?: string;
  source: string;
  sourceUrl: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
}
