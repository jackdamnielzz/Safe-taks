/**
 * CRM Configuration
 * Configure your CRM provider settings here
 */

import { CRMProvider } from "@/lib/types/lead";

export const crmConfig: CRMProvider = {
  name: "mailchimp", // Change to 'convertkit', 'hubspot', 'pipedrive', or 'generic'
  apiKey: process.env.NEXT_PUBLIC_MAILCHIMP_API_KEY || "", // Set your CRM API key
  listId: process.env.NEXT_PUBLIC_MAILCHIMP_LIST_ID || "", // Set your mailing list ID
  apiUrl: process.env.NEXT_PUBLIC_CRM_API_URL || "", // Optional custom API URL

  // Provider-specific configuration
  config: {
    // Mailchimp specific settings
    mailchimp: {
      serverPrefix: process.env.NEXT_PUBLIC_MAILCHIMP_SERVER_PREFIX || "us1", // e.g., 'us1', 'us2', etc.
    },

    // ConvertKit specific settings
    convertkit: {
      formId: process.env.NEXT_PUBLIC_CONVERTKIT_FORM_ID || "default",
    },

    // HubSpot specific settings
    hubspot: {
      portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || "",
    },

    // Pipedrive specific settings
    pipedrive: {
      companyDomain: process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN || "",
    },
  },
};

/**
 * Setup Instructions for CRM Integration:
 *
 * 1. Choose your CRM provider and configure the settings above
 * 2. Set up the corresponding environment variables in .env.local
 * 3. Test the integration using the lead capture form
 *
 * Environment Variables Needed:
 * - NEXT_PUBLIC_MAILCHIMP_API_KEY=your_mailchimp_api_key
 * - NEXT_PUBLIC_MAILCHIMP_LIST_ID=your_list_id
 * - NEXT_PUBLIC_MAILCHIMP_SERVER_PREFIX=us1
 *
 * For ConvertKit:
 * - NEXT_PUBLIC_CONVERTKIT_API_KEY=your_convertkit_api_key
 * - NEXT_PUBLIC_CONVERTKIT_FORM_ID=your_form_id
 *
 * For HubSpot:
 * - NEXT_PUBLIC_HUBSPOT_API_KEY=your_hubspot_api_key
 * - NEXT_PUBLIC_HUBSPOT_PORTAL_ID=your_portal_id
 *
 * For Pipedrive:
 * - NEXT_PUBLIC_PIPEDRIVE_API_KEY=your_pipedrive_api_key
 * - NEXT_PUBLIC_PIPEDRIVE_DOMAIN=your_company_domain
 */
