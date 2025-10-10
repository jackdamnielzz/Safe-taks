"use client";

import React from "react";
import { EventSchema, SchemaComponent, useSchema } from "./schema-components";
import { LMRASession } from "../types/lmra";

/**
 * Event Schema Implementation for LMRA Sessions and Safety Training
 *
 * This component implements Event schema markup optimized for:
 * - LMRA execution sessions
 * - Safety training events
 * - Safety meetings and audits
 * - Compliance training sessions
 */

interface EventSchemaProviderProps {
  name: string;
  startDate: string;
  endDate?: string;
  description: string;
  location: {
    name: string;
    streetAddress: string;
    addressLocality: string;
    addressCountry: string;
  };
  organizer: string;
  attendee?: string;
  eventStatus?: "EventScheduled" | "EventPostponed" | "EventCancelled";
  contentTypeDutch?: string;
  dutchLanguageOptimization?: string[];
  children?: React.ReactNode;
}

export const EventSchemaProvider: React.FC<EventSchemaProviderProps> = ({
  name,
  startDate,
  endDate,
  description,
  location,
  organizer,
  attendee,
  eventStatus = "EventScheduled",
  contentTypeDutch = "Safety Event",
  dutchLanguageOptimization = [],
  children,
}) => {
  const { generateEventSchema } = useSchema();

  const eventSchema: EventSchema = generateEventSchema({
    name,
    startDate,
    endDate,
    description,
    location: {
      "@type": "Place",
      name: location.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: location.streetAddress,
        addressLocality: location.addressLocality,
        addressCountry: location.addressCountry,
      },
    },
    organizer: {
      "@type": "Organization",
      name: organizer,
    },
    attendee: attendee
      ? {
          "@type": "Organization",
          name: attendee,
        }
      : undefined,
    eventStatus,
    contentTypeDutch,
    dutchLanguageOptimization,
  });

  return <SchemaComponent schema={eventSchema}>{children}</SchemaComponent>;
};

/**
 * Specialized schema provider for LMRA execution sessions
 */
interface LMRASessionSchemaProviderProps
  extends Omit<EventSchemaProviderProps, "contentTypeDutch" | "dutchLanguageOptimization"> {
  lmraSession: LMRASession;
  projectName?: string;
  traTitle?: string;
}

export const LMRASessionSchemaProvider: React.FC<LMRASessionSchemaProviderProps> = ({
  lmraSession,
  projectName,
  traTitle,
  ...props
}) => {
  // Format dates for schema
  const startDate =
    lmraSession.startedAt instanceof Date
      ? lmraSession.startedAt.toISOString()
      : (lmraSession.startedAt as any).toDate().toISOString();

  const endDate = lmraSession.completedAt
    ? lmraSession.completedAt instanceof Date
      ? lmraSession.completedAt.toISOString()
      : (lmraSession.completedAt as any).toDate().toISOString()
    : undefined;

  // Create location name from coordinates and project
  const locationName = projectName
    ? `Project: ${projectName} - LMRA Location`
    : `LMRA Location (${lmraSession.location.coordinates.latitude}, ${lmraSession.location.coordinates.longitude})`;

  // Create description with LMRA details
  const description = [
    `LMRA (Laatste Minuut Risico Analyse) execution session`,
    traTitle ? `Associated TRA: ${traTitle}` : "",
    `Overall Assessment: ${lmraSession.overallAssessment}`,
    lmraSession.stopWorkTriggeredBy ? `Stop Work Authority exercised` : "",
    `Team members: ${lmraSession.teamMembers.length}`,
    `Photos documented: ${lmraSession.photos.length}`,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <EventSchemaProvider
      {...props}
      name={`LMRA Session - ${lmraSession.id.slice(-8)}`}
      startDate={startDate}
      endDate={endDate}
      description={description}
      location={{
        name: locationName,
        streetAddress: `${lmraSession.location.coordinates.latitude}, ${lmraSession.location.coordinates.longitude}`,
        addressLocality: "Project Site",
        addressCountry: "Netherlands",
      }}
      organizer={lmraSession.performedByName || "Field Worker"}
      attendee={`${lmraSession.teamMembers.length} team members`}
      eventStatus={lmraSession.completedAt ? "EventScheduled" : "EventScheduled"}
      contentTypeDutch="LMRA Uitvoering"
      dutchLanguageOptimization={[
        "Laatste Minuut Risico Analyse",
        "veiligheidsinspectie",
        "werkplekinspectie",
        "veiligheidsbeoordeling",
        "team veiligheid",
        "veiligheidsdocumentatie",
      ]}
    />
  );
};

/**
 * Specialized schema provider for safety training events
 */
interface SafetyTrainingSchemaProviderProps
  extends Omit<EventSchemaProviderProps, "contentTypeDutch" | "dutchLanguageOptimization"> {
  trainingType?: string;
  certificationLevel?: string;
  trainer?: string;
  maxAttendees?: number;
}

export const SafetyTrainingSchemaProvider: React.FC<SafetyTrainingSchemaProviderProps> = ({
  trainingType = "General Safety Training",
  certificationLevel = "Basic",
  trainer = "SafeWork Pro Certified Trainer",
  maxAttendees,
  ...props
}) => {
  return (
    <EventSchemaProvider
      {...props}
      contentTypeDutch="Veiligheidstraining"
      dutchLanguageOptimization={[
        "veiligheidstraining",
        "veiligheidsopleiding",
        "certificering",
        "veiligheidscompetentie",
        "veiligheidsbewustzijn",
        "praktijktraining",
      ]}
    />
  );
};

/**
 * Specialized schema provider for safety meetings
 */
interface SafetyMeetingSchemaProviderProps
  extends Omit<EventSchemaProviderProps, "contentTypeDutch" | "dutchLanguageOptimization"> {
  meetingType?: string;
  agenda?: string[];
  requiredAttendees?: string[];
}

export const SafetyMeetingSchemaProvider: React.FC<SafetyMeetingSchemaProviderProps> = ({
  meetingType = "Safety Meeting",
  agenda = [],
  requiredAttendees = [],
  ...props
}) => {
  return (
    <EventSchemaProvider
      {...props}
      contentTypeDutch="Veiligheidsvergadering"
      dutchLanguageOptimization={[
        "veiligheidsvergadering",
        "veiligheidsbespreking",
        "veiligheidsoverleg",
        "veiligheidsbeleid",
        "incident bespreking",
        "veiligheidsmaatregelen",
      ]}
    />
  );
};

/**
 * Specialized schema provider for compliance audits
 */
interface ComplianceAuditSchemaProviderProps
  extends Omit<EventSchemaProviderProps, "contentTypeDutch" | "dutchLanguageOptimization"> {
  auditType?: string;
  auditor?: string;
  complianceFramework?: string;
}

export const ComplianceAuditSchemaProvider: React.FC<ComplianceAuditSchemaProviderProps> = ({
  auditType = "Safety Compliance Audit",
  auditor = "Certified Safety Auditor",
  complianceFramework = "VCA 2017 v5.1",
  ...props
}) => {
  return (
    <EventSchemaProvider
      {...props}
      contentTypeDutch="Compliance Audit"
      dutchLanguageOptimization={[
        "compliance audit",
        "veiligheidsaudit",
        "certificeringsaudit",
        "veiligheidscontrole",
        "regelgeving naleving",
        "veiligheidsnormen",
      ]}
    />
  );
};

/**
 * Utility function to generate event schema for dynamic content
 * Note: This is a pure function that doesn't use React hooks
 */
export const createEventSchema = (data: Omit<EventSchema, "@context" | "@type">): EventSchema => {
  // This is a pure function that doesn't use React hooks
  // The hook-based generation should be done in React components
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    ...data,
  } as EventSchema;
};

export default EventSchemaProvider;
