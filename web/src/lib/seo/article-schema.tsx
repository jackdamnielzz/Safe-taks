"use client";

import React from "react";
import { ArticleSchema, SchemaComponent, useSchema } from "./schema-components";

/**
 * Article Schema Implementation for Safety Guides and Documentation
 *
 * This component implements Article schema markup optimized for:
 * - Dutch safety management content
 * - VCA compliance documentation
 * - Safety guides and procedures
 * - Technical documentation
 */

interface ArticleSchemaProviderProps {
  headline: string;
  description: string;
  contentTypeDutch: string;
  descriptionDutch?: string;
  dutchLanguageOptimization?: string[];
  author?: string;
  datePublished: string;
  dateModified?: string;
  articleSection?: string;
  keywords?: string[];
  url?: string;
  children?: React.ReactNode;
}

export const ArticleSchemaProvider: React.FC<ArticleSchemaProviderProps> = ({
  headline,
  description,
  contentTypeDutch,
  descriptionDutch,
  dutchLanguageOptimization = [],
  author = "SafeWork Pro",
  datePublished,
  dateModified,
  articleSection = "Safety Management",
  keywords = [],
  url,
  children,
}) => {
  const { generateArticleSchema } = useSchema();

  const articleSchema: ArticleSchema = generateArticleSchema({
    headline,
    description,
    contentTypeDutch,
    descriptionDutch,
    dutchLanguageOptimization,
    author: {
      "@type": "Organization",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "SafeWork Pro",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.safeworkpro.nl"}/logo.png`,
      },
    },
    datePublished,
    dateModified,
    mainEntityOfPage: url
      ? {
          "@type": "WebPage",
          "@id": url,
        }
      : undefined,
    articleSection,
    keywords,
  });

  return <SchemaComponent schema={articleSchema}>{children}</SchemaComponent>;
};

/**
 * Specialized schema provider for VCA compliance guides
 */
interface VCAGuideSchemaProviderProps extends Omit<ArticleSchemaProviderProps, "articleSection"> {
  vcaVersion?: string;
  complianceLevel?: string;
}

export const VCAGuideSchemaProvider: React.FC<VCAGuideSchemaProviderProps> = ({
  vcaVersion = "VCA 2017 v5.1",
  complianceLevel = "Full Compliance",
  ...props
}) => {
  return (
    <ArticleSchemaProvider
      {...props}
      articleSection={`VCA Compliance Guide - ${vcaVersion}`}
      keywords={[
        "VCA",
        "veiligheid",
        "compliance",
        "veilig werken",
        "veiligheidsmanagement",
        ...(props.keywords || []),
      ]}
      dutchLanguageOptimization={[
        "VCA certificering",
        "veiligheidsnormen",
        "veiligheidsbeleid",
        "veiligheidsinspectie",
        "veiligheidsvoorschriften",
        ...(props.dutchLanguageOptimization || []),
      ]}
    />
  );
};

/**
 * Specialized schema provider for safety templates and procedures
 */
interface SafetyTemplateSchemaProviderProps
  extends Omit<ArticleSchemaProviderProps, "articleSection"> {
  templateType?: string;
  industry?: string;
}

export const SafetyTemplateSchemaProvider: React.FC<SafetyTemplateSchemaProviderProps> = ({
  templateType = "Safety Template",
  industry,
  ...props
}) => {
  const section = industry ? `${templateType} - ${industry} Industry` : templateType;

  return (
    <ArticleSchemaProvider
      {...props}
      articleSection={section}
      keywords={[
        "veiligheidssjabloon",
        "veiligheidsprocedure",
        "veiligheidsrichtlijnen",
        "veilig werken",
        ...(industry ? [industry.toLowerCase()] : []),
        ...(props.keywords || []),
      ]}
      dutchLanguageOptimization={[
        "veiligheidssjabloon",
        "veiligheidsprocedure",
        "veiligheidsrichtlijnen",
        "veiligheidsdocumentatie",
        "veiligheidsvoorbereiding",
        ...(props.dutchLanguageOptimization || []),
      ]}
    />
  );
};

/**
 * Specialized schema provider for hazard identification guides
 */
interface HazardGuideSchemaProviderProps
  extends Omit<ArticleSchemaProviderProps, "articleSection"> {
  hazardType?: string;
  riskLevel?: "Low" | "Medium" | "High" | "Critical";
}

export const HazardGuideSchemaProvider: React.FC<HazardGuideSchemaProviderProps> = ({
  hazardType = "General Hazards",
  riskLevel = "Medium",
  ...props
}) => {
  return (
    <ArticleSchemaProvider
      {...props}
      articleSection={`Hazard Identification Guide - ${hazardType}`}
      keywords={[
        "gevarenherkenning",
        "risicoanalyse",
        "veiligheidsrisico",
        "gevaarlijk werk",
        hazardType.toLowerCase(),
        ...(props.keywords || []),
      ]}
      dutchLanguageOptimization={[
        "gevarenherkenning",
        "risicoanalyse",
        "veiligheidsrisico",
        "gevaarlijk werk",
        "veiligheidsmaatregelen",
        ...(props.dutchLanguageOptimization || []),
      ]}
    />
  );
};

/**
 * Specialized schema provider for LMRA guides and procedures
 */
interface LMRAGuideSchemaProviderProps extends Omit<ArticleSchemaProviderProps, "articleSection"> {
  lmraType?: string;
  executionContext?: string;
}

export const LMRAGuideSchemaProvider: React.FC<LMRAGuideSchemaProviderProps> = ({
  lmraType = "General LMRA",
  executionContext = "Field Operations",
  ...props
}) => {
  return (
    <ArticleSchemaProvider
      {...props}
      articleSection={`LMRA Execution Guide - ${lmraType}`}
      keywords={[
        "LMRA",
        "Laatste Minuut Risico Analyse",
        "veiligheidsinspectie",
        "werkplekinspectie",
        "veiligheidscontrole",
        ...(props.keywords || []),
      ]}
      dutchLanguageOptimization={[
        "Laatste Minuut Risico Analyse",
        "veiligheidsinspectie",
        "werkplekinspectie",
        "veiligheidscontrole",
        "veiligheidsmaatregelen",
        ...(props.dutchLanguageOptimization || []),
      ]}
    />
  );
};

/**
 * Utility function to generate article schema for dynamic content
 * Note: This is a pure function that doesn't use React hooks
 */
export const createArticleSchema = (
  data: Omit<ArticleSchema, "@context" | "@type">
): ArticleSchema => {
  // This is a pure function that doesn't use React hooks
  // The hook-based generation should be done in React components
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    ...data,
  } as ArticleSchema;
};

export default ArticleSchemaProvider;
