"use client";

import React, { JSX } from "react";
import Head from "next/head";

// Base schema types
export interface BaseSchema {
  "@context": string;
  "@type": string;
}

// Article Schema for safety guides and documentation
export interface ArticleSchema extends BaseSchema {
  "@type": "Article";
  headline: string;
  description: string;
  author: {
    "@type": "Organization";
    name: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    logo?: {
      "@type": "ImageObject";
      url: string;
    };
  };
  datePublished: string;
  dateModified?: string;
  mainEntityOfPage?: {
    "@type": "WebPage";
    "@id": string;
  };
  articleSection?: string;
  keywords?: string[];
  contentTypeDutch?: string;
  descriptionDutch?: string;
  dutchLanguageOptimization?: string[];
}

// FAQ Schema for help system
export interface FAQSchema extends BaseSchema {
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
  contentTypeDutch?: string;
  dutchLanguageOptimization?: string[];
}

// Organization Schema for company information
export interface OrganizationSchema extends BaseSchema {
  "@type": "Organization";
  name: string;
  alternateName?: string;
  url: string;
  logo?: string;
  description: string;
  foundingDate?: string;
  address?: {
    "@type"?: "PostalAddress";
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
  };
  contactPoint?: {
    "@type"?: "ContactPoint";
    telephone: string;
    contactType?: string;
    email?: string;
  };
  sameAs?: string[];
  knowsAbout?: string[];
  areaServed?: string[];
  dutchLanguageOptimization?: string[];
}

// Product Schema for TRA/LMRA templates
export interface ProductSchema extends BaseSchema {
  "@type": "Product";
  name: string;
  description: string;
  category: string;
  offers: {
    "@type"?: "Offer";
    price: string;
    priceCurrency: string;
    availability: string;
    url?: string;
  };
  aggregateRating?: {
    "@type"?: "AggregateRating";
    ratingValue: number;
    reviewCount: number;
  };
  review?: Array<{
    "@type"?: "Review";
    author: {
      "@type"?: "Person";
      name: string;
    };
    reviewRating: {
      "@type"?: "Rating";
      ratingValue: number;
    };
    reviewBody: string;
  }>;
  contentTypeDutch?: string;
  dutchLanguageOptimization?: string[];
}

// Dataset Schema for hazard database
export interface DatasetSchema extends BaseSchema {
  "@type": "Dataset";
  name: string;
  description: string;
  creator: {
    "@type"?: "Organization";
    name: string;
  };
  distribution: {
    "@type"?: "DataDownload";
    encodingFormat: string;
    contentUrl: string;
  };
  temporalCoverage?: string;
  spatialCoverage?: {
    "@type"?: "Place";
    name: string;
  };
  keywords: string[];
  contentTypeDutch?: string;
  dutchLanguageOptimization?: string[];
}

// Event Schema for LMRA sessions and safety training
export interface EventSchema extends BaseSchema {
  "@type": "Event";
  name: string;
  startDate: string;
  endDate?: string;
  description: string;
  location: {
    "@type": "Place";
    name: string;
    address: {
      "@type": "PostalAddress";
      streetAddress: string;
      addressLocality: string;
      addressCountry: string;
    };
  };
  organizer: {
    "@type": "Organization";
    name: string;
  };
  attendee?: {
    "@type": "Organization";
    name: string;
  };
  eventStatus?: string;
  contentTypeDutch?: string;
  dutchLanguageOptimization?: string[];
}

// LocalBusiness Schema for Dutch market
export interface LocalBusinessSchema extends BaseSchema {
  "@type": "LocalBusiness";
  name: string;
  description: string;
  url: string;
  telephone: string;
  email?: string;
  address: {
    "@type"?: "PostalAddress";
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    "@type"?: "GeoCoordinates";
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  priceRange?: string;
  aggregateRating?: {
    "@type"?: "AggregateRating";
    ratingValue: number;
    reviewCount: number;
  };
  dutchLanguageOptimization?: string[];
}

// Utility function to create JSON-LD script
export const createJsonLdScript = (schema: BaseSchema): JSX.Element => {
  const jsonLd = JSON.stringify(schema, null, 0);

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
        key={`schema-${schema["@type"]}`}
      />
    </Head>
  );
};

// React component for schema markup
interface SchemaComponentProps {
  schema: BaseSchema | BaseSchema[];
  children?: React.ReactNode;
}

export const SchemaComponent: React.FC<SchemaComponentProps> = ({ schema, children }) => {
  const schemas = Array.isArray(schema) ? schema : [schema];

  return (
    <>
      {schemas.map((s, index) => (
        <Head key={`schema-${s["@type"]}-${index}`}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(s, null, 0) }}
          />
        </Head>
      ))}
      {children}
    </>
  );
};

// Hook for dynamic schema generation
export const useSchema = () => {
  const generateArticleSchema = (
    data: Omit<ArticleSchema, "@context" | "@type">
  ): ArticleSchema => ({
    "@context": "https://schema.org",
    "@type": "Article",
    ...data,
  });

  const generateFAQSchema = (data: Omit<FAQSchema, "@context" | "@type">): FAQSchema => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...data,
  });

  const generateOrganizationSchema = (
    data: Omit<OrganizationSchema, "@context" | "@type">
  ): OrganizationSchema => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    ...data,
  });

  const generateProductSchema = (
    data: Omit<ProductSchema, "@context" | "@type">
  ): ProductSchema => ({
    "@context": "https://schema.org",
    "@type": "Product",
    ...data,
  });

  const generateDatasetSchema = (
    data: Omit<DatasetSchema, "@context" | "@type">
  ): DatasetSchema => ({
    "@context": "https://schema.org",
    "@type": "Dataset",
    ...data,
  });

  const generateEventSchema = (data: Omit<EventSchema, "@context" | "@type">): EventSchema => ({
    "@context": "https://schema.org",
    "@type": "Event",
    ...data,
  });

  const generateLocalBusinessSchema = (
    data: Omit<LocalBusinessSchema, "@context" | "@type">
  ): LocalBusinessSchema => ({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    ...data,
  });

  return {
    generateArticleSchema,
    generateFAQSchema,
    generateOrganizationSchema,
    generateProductSchema,
    generateDatasetSchema,
    generateEventSchema,
    generateLocalBusinessSchema,
  };
};
