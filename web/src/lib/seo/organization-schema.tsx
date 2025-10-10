"use client";

import React from "react";
import {
  OrganizationSchema,
  LocalBusinessSchema,
  SchemaComponent,
  useSchema,
} from "./schema-components";

/**
 * Organization Schema Implementation for Company Information
 *
 * This component implements Organization and LocalBusiness schema markup optimized for:
 * - Dutch safety management company
 * - VCA certified business
 * - Professional services organization
 * - Local business presence in Netherlands
 */

interface OrganizationSchemaProviderProps {
  name?: string;
  alternateName?: string;
  description?: string;
  url?: string;
  logo?: string;
  foundingDate?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
  };
  contactPoint?: {
    telephone: string;
    email?: string;
    contactType?: string;
  };
  sameAs?: string[];
  knowsAbout?: string[];
  areaServed?: string[];
  dutchLanguageOptimization?: string[];
  children?: React.ReactNode;
}

export const OrganizationSchemaProvider: React.FC<OrganizationSchemaProviderProps> = ({
  name = "SafeWork Pro",
  alternateName = "SWP",
  description = "Professional safety management platform for Dutch construction and industrial companies. VCA certified safety solutions with TRA and LMRA management.",
  url = process.env.NEXT_PUBLIC_APP_URL || "https://app.safeworkpro.nl",
  logo = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.safeworkpro.nl"}/logo.png`,
  foundingDate = "2024",
  address = {
    streetAddress: "Keizersgracht 126",
    addressLocality: "Amsterdam",
    postalCode: "1015 CW",
    addressCountry: "NL",
  },
  contactPoint = {
    telephone: "+31 20 123 4567",
    email: "info@safeworkpro.nl",
    contactType: "customer service",
  },
  sameAs = ["https://linkedin.com/company/safework-pro", "https://twitter.com/safeworkpro"],
  knowsAbout = [
    "Safety Management",
    "VCA Certification",
    "Risk Assessment",
    "TRA (Taak Risico Analyse)",
    "LMRA (Laatste Minuut Risico Analyse)",
    "Construction Safety",
    "Industrial Safety",
    "ISO 45001",
    "Arbeidsomstandighedenwet",
  ],
  areaServed = ["Netherlands", "Belgium", "Germany"],
  dutchLanguageOptimization = [
    "veiligheidsmanagement",
    "VCA certificering",
    "risicoanalyse",
    "veilig werken",
    "bouwveiligheid",
    "industriele veiligheid",
    "veiligheidsplatform",
  ],
  children,
}) => {
  const { generateOrganizationSchema } = useSchema();

  const organizationSchema: OrganizationSchema = generateOrganizationSchema({
    name,
    alternateName,
    url,
    logo,
    description,
    foundingDate,
    address,
    contactPoint,
    sameAs,
    knowsAbout,
    areaServed,
    dutchLanguageOptimization,
  });

  return <SchemaComponent schema={organizationSchema}>{children}</SchemaComponent>;
};

/**
 * LocalBusiness Schema Provider for Dutch market presence
 */
interface LocalBusinessSchemaProviderProps {
  name?: string;
  description?: string;
  url?: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  priceRange?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  dutchLanguageOptimization?: string[];
  children?: React.ReactNode;
}

export const LocalBusinessSchemaProvider: React.FC<LocalBusinessSchemaProviderProps> = ({
  name = "SafeWork Pro B.V.",
  description = "VCA-gecertificeerd veiligheidsmanagementplatform voor de Nederlandse bouw- en industriesector. Gespecialiseerd in TRA en LMRA oplossingen.",
  url = process.env.NEXT_PUBLIC_APP_URL || "https://app.safeworkpro.nl",
  telephone = "+31 20 123 4567",
  email = "info@safeworkpro.nl",
  address = {
    streetAddress: "Keizersgracht 126",
    addressLocality: "Amsterdam",
    postalCode: "1015 CW",
    addressCountry: "NL",
  },
  geo = {
    latitude: 52.3745403,
    longitude: 4.8979755,
  },
  openingHours = ["Mo-Fr 09:00-17:00", "Sa-Su Closed"],
  priceRange = "€€€",
  aggregateRating = {
    ratingValue: 4.8,
    reviewCount: 127,
  },
  dutchLanguageOptimization = [
    "veiligheidsmanagement",
    "VCA gecertificeerd",
    "bouwveiligheid",
    "industriele veiligheid",
    "veiligheidssoftware",
    "veiligheidsplatform",
    "veilig werken",
  ],
  children,
}) => {
  const { generateLocalBusinessSchema } = useSchema();

  const localBusinessSchema: LocalBusinessSchema = generateLocalBusinessSchema({
    name,
    description,
    url,
    telephone,
    email,
    address,
    geo,
    openingHours,
    priceRange,
    aggregateRating,
    dutchLanguageOptimization,
  });

  return <SchemaComponent schema={localBusinessSchema}>{children}</SchemaComponent>;
};

/**
 * Combined Organization + LocalBusiness Schema Provider
 */
interface CompanySchemaProviderProps {
  organization?: Partial<OrganizationSchemaProviderProps>;
  localBusiness?: Partial<LocalBusinessSchemaProviderProps>;
  children?: React.ReactNode;
}

export const CompanySchemaProvider: React.FC<CompanySchemaProviderProps> = ({
  organization = {},
  localBusiness = {},
  children,
}) => {
  const schemas = [];

  // Add organization schema if organization props provided
  if (Object.keys(organization).length > 0) {
    schemas.push(<OrganizationSchemaProvider key="organization" {...organization} />);
  }

  // Add local business schema if localBusiness props provided
  if (Object.keys(localBusiness).length > 0) {
    schemas.push(<LocalBusinessSchemaProvider key="localBusiness" {...localBusiness} />);
  }

  return (
    <>
      {schemas}
      {children}
    </>
  );
};

/**
 * VCA Certified Organization Schema Provider
 */
interface VCAOrganizationSchemaProviderProps extends OrganizationSchemaProviderProps {
  vcaVersion?: string;
  certificationNumber?: string;
  validUntil?: string;
}

export const VCAOrganizationSchemaProvider: React.FC<VCAOrganizationSchemaProviderProps> = ({
  vcaVersion = "VCA 2017 v5.1",
  certificationNumber = "VC-2024-001",
  validUntil = "2034-12-31",
  ...props
}) => {
  return (
    <OrganizationSchemaProvider
      {...props}
      knowsAbout={[
        "VCA Certification",
        `${vcaVersion} Certified`,
        "Safety Management Systems",
        "Risk Assessment",
        "TRA (Taak Risico Analyse)",
        "LMRA (Laatste Minuut Risico Analyse)",
        "Construction Safety",
        "Industrial Safety",
        "ISO 45001",
        "Arbeidsomstandighedenwet",
        ...(props.knowsAbout || []),
      ]}
      dutchLanguageOptimization={[
        "VCA certificering",
        "veiligheidsmanagement",
        "veilig werken",
        "bouwveiligheid",
        "industriele veiligheid",
        "veiligheidsplatform",
        "veiligheidssoftware",
        ...(props.dutchLanguageOptimization || []),
      ]}
    />
  );
};

/**
 * Professional Services Organization Schema Provider
 */
interface ProfessionalServicesSchemaProviderProps extends OrganizationSchemaProviderProps {
  serviceType?: string;
  serviceArea?: string[];
  certifications?: string[];
}

export const ProfessionalServicesSchemaProvider: React.FC<
  ProfessionalServicesSchemaProviderProps
> = ({
  serviceType = "Safety Management Platform",
  serviceArea = ["Construction", "Industrial", "Manufacturing"],
  certifications = ["VCA 2017 v5.1", "ISO 45001"],
  ...props
}) => {
  return (
    <OrganizationSchemaProvider
      {...props}
      description={`${props.description || ""} Professional ${serviceType} serving ${serviceArea.join(", ")} sectors. Certified: ${certifications.join(", ")}.`.trim()}
      knowsAbout={[
        serviceType,
        ...serviceArea,
        ...certifications,
        "Professional Services",
        "Safety Consulting",
        "Risk Management",
        ...(props.knowsAbout || []),
      ]}
    />
  );
};

/**
 * Utility function to generate organization schema for dynamic content
 * Note: This is a pure function that doesn't use React hooks
 */
export const createOrganizationSchema = (
  data: Omit<OrganizationSchema, "@context" | "@type">
): OrganizationSchema => {
  // This is a pure function that doesn't use React hooks
  // The hook-based generation should be done in React components
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    ...data,
  } as OrganizationSchema;
};

/**
 * Hook for company information management
 */
export const useCompanySchema = () => {
  const getDefaultOrganizationData = (): Omit<OrganizationSchema, "@context" | "@type"> => ({
    name: "SafeWork Pro",
    alternateName: "SWP",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://app.safeworkpro.nl",
    logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.safeworkpro.nl"}/logo.png`,
    description:
      "Professional safety management platform for Dutch construction and industrial companies. VCA certified safety solutions with TRA and LMRA management.",
    foundingDate: "2024",
    address: {
      streetAddress: "Keizersgracht 126",
      addressLocality: "Amsterdam",
      postalCode: "1015 CW",
      addressCountry: "NL",
    },
    contactPoint: {
      telephone: "+31 20 123 4567",
      email: "info@safeworkpro.nl",
      contactType: "customer service",
    },
    sameAs: ["https://linkedin.com/company/safework-pro", "https://twitter.com/safeworkpro"],
    knowsAbout: [
      "Safety Management",
      "VCA Certification",
      "Risk Assessment",
      "TRA (Taak Risico Analyse)",
      "LMRA (Laatste Minuut Risico Analyse)",
      "Construction Safety",
      "Industrial Safety",
      "ISO 45001",
      "Arbeidsomstandighedenwet",
    ],
    areaServed: ["Netherlands", "Belgium", "Germany"],
    dutchLanguageOptimization: [
      "veiligheidsmanagement",
      "VCA certificering",
      "risicoanalyse",
      "veilig werken",
      "bouwveiligheid",
      "industriele veiligheid",
      "veiligheidsplatform",
    ],
  });

  const getDefaultLocalBusinessData = (): Omit<LocalBusinessSchema, "@context" | "@type"> => ({
    name: "SafeWork Pro B.V.",
    description:
      "VCA-gecertificeerd veiligheidsmanagementplatform voor de Nederlandse bouw- en industriesector. Gespecialiseerd in TRA en LMRA oplossingen.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://app.safeworkpro.nl",
    telephone: "+31 20 123 4567",
    email: "info@safeworkpro.nl",
    address: {
      streetAddress: "Keizersgracht 126",
      addressLocality: "Amsterdam",
      postalCode: "1015 CW",
      addressCountry: "NL",
    },
    geo: {
      latitude: 52.3745403,
      longitude: 4.8979755,
    },
    openingHours: ["Mo-Fr 09:00-17:00", "Sa-Su Closed"],
    priceRange: "€€€",
    aggregateRating: {
      ratingValue: 4.8,
      reviewCount: 127,
    },
    dutchLanguageOptimization: [
      "veiligheidsmanagement",
      "VCA gecertificeerd",
      "bouwveiligheid",
      "industriele veiligheid",
      "veiligheidssoftware",
      "veiligheidsplatform",
      "veilig werken",
    ],
  });

  return {
    getDefaultOrganizationData,
    getDefaultLocalBusinessData,
  };
};

export default OrganizationSchemaProvider;
