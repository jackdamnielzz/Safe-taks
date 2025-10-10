/**
 * Email Templates
 *
 * Pre-defined email templates for various notification types
 * Supports both HTML and plain text versions
 */

import { EmailType } from "./sendgrid-client";

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generate email template based on type and data
 */
export function getEmailTemplate(type: EmailType, data: Record<string, any>): EmailTemplate {
  switch (type) {
    case EmailType.WELCOME:
      return getWelcomeEmail(data);
    case EmailType.INVITATION:
      return getInvitationEmail(data);
    case EmailType.TRA_CREATED:
      return getTraCreatedEmail(data);
    case EmailType.TRA_APPROVED:
      return getTraApprovedEmail(data);
    case EmailType.TRA_REJECTED:
      return getTraRejectedEmail(data);
    case EmailType.LMRA_STOP_WORK:
      return getLmraStopWorkEmail(data);
    case EmailType.LMRA_COMPLETED:
      return getLmraCompletedEmail(data);
    case EmailType.PASSWORD_RESET:
      return getPasswordResetEmail(data);
    case EmailType.SUBSCRIPTION_CREATED:
      return getSubscriptionCreatedEmail(data);
    case EmailType.SUBSCRIPTION_CANCELLED:
      return getSubscriptionCancelledEmail(data);
    case EmailType.PAYMENT_FAILED:
      return getPaymentFailedEmail(data);
    case EmailType.TRIAL_ENDING:
      return getTrialEndingEmail(data);
    case EmailType.USAGE_LIMIT_WARNING:
      return getUsageLimitWarningEmail(data);
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

/**
 * Welcome email for new users
 */
function getWelcomeEmail(data: { userName: string; organizationName: string }): EmailTemplate {
  return {
    subject: "Welkom bij SafeWork Pro",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f97316;">Welkom bij SafeWork Pro!</h1>
        <p>Hallo ${data.userName},</p>
        <p>Welkom bij ${data.organizationName} op SafeWork Pro. We zijn blij dat je er bent!</p>
        <p>Met SafeWork Pro kun je:</p>
        <ul>
          <li>Taak Risico Analyses (TRA's) digitaal beheren</li>
          <li>Last Minute Risk Analyses (LMRA's) uitvoeren in het veld</li>
          <li>Real-time rapportages en analyses bekijken</li>
          <li>Samenwerken met je team</li>
        </ul>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ga naar Dashboard
          </a>
        </p>
        <p>Heb je vragen? Neem gerust contact met ons op.</p>
        <p>Met vriendelijke groet,<br>Het SafeWork Pro Team</p>
      </div>
    `,
    text: `
Welkom bij SafeWork Pro!

Hallo ${data.userName},

Welkom bij ${data.organizationName} op SafeWork Pro. We zijn blij dat je er bent!

Met SafeWork Pro kun je:
- Taak Risico Analyses (TRA's) digitaal beheren
- Last Minute Risk Analyses (LMRA's) uitvoeren in het veld
- Real-time rapportages en analyses bekijken
- Samenwerken met je team

Ga naar je dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Heb je vragen? Neem gerust contact met ons op.

Met vriendelijke groet,
Het SafeWork Pro Team
    `,
  };
}

/**
 * Invitation email for new team members
 */
function getInvitationEmail(data: {
  inviterName: string;
  organizationName: string;
  role: string;
  invitationLink: string;
}): EmailTemplate {
  return {
    subject: `Uitnodiging voor ${data.organizationName} op SafeWork Pro`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f97316;">Je bent uitgenodigd!</h1>
        <p>${data.inviterName} heeft je uitgenodigd om lid te worden van <strong>${data.organizationName}</strong> op SafeWork Pro.</p>
        <p>Je rol: <strong>${data.role}</strong></p>
        <p>
          <a href="${data.invitationLink}" 
             style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accepteer Uitnodiging
          </a>
        </p>
        <p>Deze uitnodiging is 7 dagen geldig.</p>
        <p>Met vriendelijke groet,<br>Het SafeWork Pro Team</p>
      </div>
    `,
    text: `
Je bent uitgenodigd!

${data.inviterName} heeft je uitgenodigd om lid te worden van ${data.organizationName} op SafeWork Pro.

Je rol: ${data.role}

Accepteer de uitnodiging: ${data.invitationLink}

Deze uitnodiging is 7 dagen geldig.

Met vriendelijke groet,
Het SafeWork Pro Team
    `,
  };
}

/**
 * TRA created notification
 */
function getTraCreatedEmail(data: {
  traTitle: string;
  creatorName: string;
  projectName: string;
  traLink: string;
}): EmailTemplate {
  return {
    subject: `Nieuwe TRA: ${data.traTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f97316;">Nieuwe TRA Aangemaakt</h1>
        <p><strong>${data.creatorName}</strong> heeft een nieuwe TRA aangemaakt:</p>
        <p><strong>Titel:</strong> ${data.traTitle}</p>
        <p><strong>Project:</strong> ${data.projectName}</p>
        <p>
          <a href="${data.traLink}" 
             style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Bekijk TRA
          </a>
        </p>
        <p>Met vriendelijke groet,<br>Het SafeWork Pro Team</p>
      </div>
    `,
    text: `
Nieuwe TRA Aangemaakt

${data.creatorName} heeft een nieuwe TRA aangemaakt:

Titel: ${data.traTitle}
Project: ${data.projectName}

Bekijk TRA: ${data.traLink}

Met vriendelijke groet,
Het SafeWork Pro Team
    `,
  };
}

/**
 * TRA approved notification
 */
function getTraApprovedEmail(data: {
  traTitle: string;
  approverName: string;
  traLink: string;
}): EmailTemplate {
  return {
    subject: `TRA Goedgekeurd: ${data.traTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">TRA Goedgekeurd</h1>
        <p><strong>${data.approverName}</strong> heeft je TRA goedgekeurd:</p>
        <p><strong>Titel:</strong> ${data.traTitle}</p>
        <p>
          <a href="${data.traLink}" 
             style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Bekijk TRA
          </a>
        </p>
        <p>Met vriendelijke groet,<br>Het SafeWork Pro Team</p>
      </div>
    `,
    text: `
TRA Goedgekeurd

${data.approverName} heeft je TRA goedgekeurd:

Titel: ${data.traTitle}

Bekijk TRA: ${data.traLink}

Met vriendelijke groet,
Het SafeWork Pro Team
    `,
  };
}

/**
 * TRA rejected notification
 */
function getTraRejectedEmail(data: {
  traTitle: string;
  rejectorName: string;
  reason: string;
  traLink: string;
}): EmailTemplate {
  return {
    subject: `TRA Afgekeurd: ${data.traTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ef4444;">TRA Afgekeurd</h1>
        <p><strong>${data.rejectorName}</strong> heeft je TRA afgekeurd:</p>
        <p><strong>Titel:</strong> ${data.traTitle}</p>
        <p><strong>Reden:</strong> ${data.reason}</p>
        <p>
          <a href="${data.traLink}" 
             style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Bekijk TRA
          </a>
        </p>
        <p>Met vriendelijke groet,<br>Het SafeWork Pro Team</p>
      </div>
    `,
    text: `
TRA Afgekeurd

${data.rejectorName} heeft je TRA afgekeurd:

Titel: ${data.traTitle}
Reden: ${data.reason}

Bekijk TRA: ${data.traLink}

Met vriendelijke groet,
Het SafeWork Pro Team
    `,
  };
}

/**
 * LMRA stop work alert (CRITICAL)
 */
function getLmraStopWorkEmail(data: {
  projectName: string;
  location: string;
  reason: string;
  executorName: string;
  lmraLink: string;
}): EmailTemplate {
  return {
    subject: `🚨 STOP WERK - ${data.projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 3px solid #ef4444;">
        <div style="background-color: #ef4444; color: white; padding: 20px;">
          <h1 style="margin: 0;">🚨 STOP WERK SITUATIE</h1>
        </div>
        <div style="padding: 20px;">
          <p><strong>Er is een stop werk situatie gemeld!</strong></p>
          <p><strong>Project:</strong> ${data.projectName}</p>
          <p><strong>Locatie:</strong> ${data.location}</p>
          <p><strong>Reden:</strong> ${data.reason}</p>
          <p><strong>Gemeld door:</strong> ${data.executorName}</p>
          <p style="background-color: #fee2e2; padding: 15px; border-left: 4px solid #ef4444;">
            <strong>Actie vereist:</strong> Neem onmiddellijk contact op met de locatie en neem passende maatregelen.
          </p>
          <p>
            <a href="${data.lmraLink}" 
               style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Bekijk LMRA Details
            </a>
          </p>
        </div>
      </div>
    `,
    text: `
🚨 STOP WERK SITUATIE

Er is een stop werk situatie gemeld!

Project: ${data.projectName}
Locatie: ${data.location}
Reden: ${data.reason}
Gemeld door: ${data.executorName}

ACTIE VEREIST: Neem onmiddellijk contact op met de locatie en neem passende maatregelen.

Bekijk LMRA Details: ${data.lmraLink}
    `,
  };
}

/**
 * LMRA completed notification
 */
function getLmraCompletedEmail(data: {
  projectName: string;
  executorName: string;
  assessment: string;
  lmraLink: string;
}): EmailTemplate {
  return {
    subject: `LMRA Voltooid - ${data.projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">LMRA Voltooid</h1>
        <p><strong>${data.executorName}</strong> heeft een LMRA voltooid:</p>
        <p><strong>Project:</strong> ${data.projectName}</p>
        <p><strong>Beoordeling:</strong> ${data.assessment}</p>
        <p>
          <a href="${data.lmraLink}" 
             style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Bekijk LMRA
          </a>
        </p>
        <p>Met vriendelijke groet,<br>Het SafeWork Pro Team</p>
      </div>
    `,
    text: `
LMRA Voltooid

${data.executorName} heeft een LMRA voltooid:

Project: ${data.projectName}
Beoordeling: ${data.assessment}

Bekijk LMRA: ${data.lmraLink}

Met vriendelijke groet,
Het SafeWork Pro Team
    `,
  };
}

/**
 * Password reset email
 */
function getPasswordResetEmail(data: { resetLink: string }): EmailTemplate {
  return {
    subject: "Wachtwoord Reset - SafeWork Pro",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f97316;">Wachtwoord Reset</h1>
        <p>Je hebt een wachtwoord reset aangevraagd voor je SafeWork Pro account.</p>
        <p>
          <a href="${data.resetLink}" 
             style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Wachtwoord
          </a>
        </p>
        <p>Deze link is 1 uur geldig.</p>
        <p>Als je geen wachtwoord reset hebt aangevraagd, kun je deze email negeren.</p>
        <p>Met vriendelijke groet,<br>Het SafeWork Pro Team</p>
      </div>
    `,
    text: `
Wachtwoord Reset

Je hebt een wachtwoord reset aangevraagd voor je SafeWork Pro account.

Reset je wachtwoord: ${data.resetLink}

Deze link is 1 uur geldig.

Als je geen wachtwoord reset hebt aangevraagd, kun je deze email negeren.

Met vriendelijke groet,
Het SafeWork Pro Team
    `,
  };
}

/**
 * Subscription created email
 */
function getSubscriptionCreatedEmail(data: {
  planName: string;
  amount: string;
  billingPeriod: string;
}): EmailTemplate {
  return {
    subject: "Abonnement Geactiveerd - SafeWork Pro",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Abonnement Geactiveerd</h1>
        <p>Je abonnement op SafeWork Pro is succesvol geactiveerd!</p>
        <p><strong>Plan:</strong> ${data.planName}</p>
        <p><strong>Bedrag:</strong> €${data.amount} per ${data.billingPeriod}</p>
        <p>Bedankt voor je vertrouwen in SafeWork Pro!</p>
        <p>Met vriendelijke groet,<br>Het SafeWork Pro Team</p>
      </div>
    `,
    text: `
Abonnement Geactiveerd

Je abonnement op SafeWork Pro is succesvol geactiveerd!

Plan: ${data.planName}
Bedrag: €${data.amount} per ${data.billingPeriod}

Bedankt voor je vertrouwen in SafeWork Pro!

Met vriendelijke groet,
Het SafeWork Pro Team
    `,
  };
}

/**
 * Subscription cancelled email
 */
function getSubscriptionCancelledEmail(data: { endDate: string }): EmailTemplate {
  return {
    subject: "Abonnement Opgezegd - SafeWork Pro",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f97316;">Abonnement Opgezegd</h1>
        <p>Je abonnement op SafeWork Pro is opgezegd.</p>
        <p>Je kunt SafeWork Pro blijven gebruiken tot <strong>${data.endDate}</strong>.</p>
        <p>We hopen je in de toekomst weer te zien!</p>
        <p>Met vriendelijke groet,<br>Het SafeWork Pro Team</p>
      </div>
    `,
    text: `
Abonnement Opgezegd

Je abonnement op SafeWork Pro is opgezegd.

Je kunt SafeWork Pro blijven gebruiken tot ${data.endDate}.

We hopen je in de toekomst weer te zien!

Met vriendelijke groet,
Het SafeWork Pro Team
    `,
  };
}

/**
 * Payment failed email
 */
function getPaymentFailedEmail(data: { amount: string; retryDate: string }): EmailTemplate {
  return {
    subject: "Betaling Mislukt - SafeWork Pro",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ef4444;">Betaling Mislukt</h1>
        <p>We konden je laatste betaling niet verwerken.</p>
        <p><strong>Bedrag:</strong> €${data.amount}</p>
        <p>We proberen het opnieuw op <strong>${data.retryDate}</strong>.</p>
        <p>Controleer je betaalmethode om onderbrekingen te voorkomen.</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" 
             style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Betaalmethode Bijwerken
          </a>
        </p>
        <p>Met vriendelijke groet,<br>Het SafeWork Pro Team</p>
      </div>
    `,
    text: `
Betaling Mislukt

We konden je laatste betaling niet verwerken.

Bedrag: €${data.amount}

We proberen het opnieuw op ${data.retryDate}.

Controleer je betaalmethode om onderbrekingen te voorkomen.

Betaalmethode bijwerken: ${process.env.NEXT_PUBLIC_APP_URL}/billing

Met vriendelijke groet,
Het SafeWork Pro Team
    `,
  };
}

/**
 * Trial ending email
 */
function getTrialEndingEmail(data: { daysLeft: number }): EmailTemplate {
  return {
    subject: "Je Proefperiode Eindigt Binnenkort - SafeWork Pro",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f97316;">Proefperiode Eindigt Binnenkort</h1>
        <p>Je proefperiode van SafeWork Pro eindigt over <strong>${data.daysLeft} dagen</strong>.</p>
        <p>Upgrade naar een betaald abonnement om te blijven genieten van alle functies.</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" 
             style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Upgrade Nu
          </a>
        </p>
        <p>Met vriendelijke groet,<br>Het SafeWork Pro Team</p>
      </div>
    `,
    text: `
Proefperiode Eindigt Binnenkort

Je proefperiode van SafeWork Pro eindigt over ${data.daysLeft} dagen.

Upgrade naar een betaald abonnement om te blijven genieten van alle functies.

Upgrade nu: ${process.env.NEXT_PUBLIC_APP_URL}/billing

Met vriendelijke groet,
Het SafeWork Pro Team
    `,
  };
}

/**
 * Usage limit warning email
 */
function getUsageLimitWarningEmail(data: {
  limitType: string;
  currentUsage: number;
  limit: number;
  percentage: number;
}): EmailTemplate {
  return {
    subject: "Gebruikslimiet Bijna Bereikt - SafeWork Pro",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">Gebruikslimiet Bijna Bereikt</h1>
        <p>Je hebt <strong>${data.percentage}%</strong> van je ${data.limitType} limiet bereikt.</p>
        <p><strong>Huidig gebruik:</strong> ${data.currentUsage} van ${data.limit}</p>
        <p>Overweeg een upgrade naar een hoger plan om meer capaciteit te krijgen.</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" 
             style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Bekijk Upgrade Opties
          </a>
        </p>
        <p>Met vriendelijke groet,<br>Het SafeWork Pro Team</p>
      </div>
    `,
    text: `
Gebruikslimiet Bijna Bereikt

Je hebt ${data.percentage}% van je ${data.limitType} limiet bereikt.

Huidig gebruik: ${data.currentUsage} van ${data.limit}

Overweeg een upgrade naar een hoger plan om meer capaciteit te krijgen.

Bekijk upgrade opties: ${process.env.NEXT_PUBLIC_APP_URL}/billing

Met vriendelijke groet,
Het SafeWork Pro Team
    `,
  };
}
