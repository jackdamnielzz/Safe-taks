"use client";

import React from "react";
import { ProductSchema, SchemaComponent, useSchema } from "./schema-components";

/**
 * Product Schema Implementation for TRA/LMRA Templates
 *
 * This component implements Product schema markup optimized for:
 * - Dutch safety management templates
 * - VCA-compliant TRA templates
 * - LMRA execution templates
 * - Safety procedure templates
 */

interface ProductSchemaProviderProps {
  name: string;
  description: string;
  category: string;
  offers: {
    price: string;
    priceCurrency: string;
    availability: string;
    url?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  contentTypeDutch: string;
  dutchLanguageOptimization?: string[];
  children?: React.ReactNode;
}

export const ProductSchemaProvider: React.FC<ProductSchemaProviderProps> = ({
  name,
  description,
  category,
  offers,
  aggregateRating,
  contentTypeDutch,
  dutchLanguageOptimization = [],
  children,
}) => {
  const { generateProductSchema } = useSchema();

  const productSchema: ProductSchema = generateProductSchema({
    name,
    description,
    category,
    offers: {
      "@type": "Offer",
      ...offers,
    },
    aggregateRating: aggregateRating
      ? {
          "@type": "AggregateRating",
          ...aggregateRating,
        }
      : undefined,
    contentTypeDutch,
    dutchLanguageOptimization,
  });

  return <SchemaComponent schema={productSchema}>{children}</SchemaComponent>;
};

/**
 * Specialized schema provider for TRA templates
 */
interface TRATemplateSchemaProviderProps
  extends Omit<ProductSchemaProviderProps, "category" | "contentTypeDutch"> {
  templateType?: string;
  industry?: string;
  vcaVersion?: string;
}

export const TRATemplateSchemaProvider: React.FC<TRATemplateSchemaProviderProps> = ({
  templateType = "General TRA",
  industry = "Construction",
  vcaVersion = "VCA 2017 v5.1",
  dutchLanguageOptimization = [],
  ...props
}) => {
  return (
    <ProductSchemaProvider
      {...props}
      category={`TRA Template - ${industry} Industry`}
      contentTypeDutch={`TRA Sjabloon - ${industry} Sector`}
      dutchLanguageOptimization={[
        "TRA sjabloon",
        "veiligheidsdocument",
        "risicoanalyse",
        "veilig werken",
        "veiligheidsprocedure",
        industry.toLowerCase(),
        ...dutchLanguageOptimization,
      ]}
    />
  );
};

/**
 * Specialized schema provider for LMRA templates
 */
interface LMRATemplateSchemaProviderProps
  extends Omit<ProductSchemaProviderProps, "category" | "contentTypeDutch"> {
  lmraType?: string;
  executionContext?: string;
}

export const LMRATemplateSchemaProvider: React.FC<LMRATemplateSchemaProviderProps> = ({
  lmraType = "General LMRA",
  executionContext = "Field Operations",
  dutchLanguageOptimization = [],
  ...props
}) => {
  return (
    <ProductSchemaProvider
      {...props}
      category={`LMRA Template - ${lmraType}`}
      contentTypeDutch={`LMRA Sjabloon - ${lmraType}`}
      dutchLanguageOptimization={[
        "LMRA sjabloon",
        "Laatste Minuut Risico Analyse",
        "veiligheidsinspectie",
        "werkplekcontrole",
        "veiligheidsprocedure",
        ...dutchLanguageOptimization,
      ]}
    />
  );
};

/**
 * Specialized schema provider for safety procedure templates
 */
interface SafetyProcedureSchemaProviderProps
  extends Omit<ProductSchemaProviderProps, "category" | "contentTypeDutch"> {
  procedureCategory?: string;
  riskLevel?: "Low" | "Medium" | "High" | "Critical";
}

export const SafetyProcedureSchemaProvider: React.FC<SafetyProcedureSchemaProviderProps> = ({
  procedureCategory = "General Safety",
  riskLevel = "Medium",
  dutchLanguageOptimization = [],
  ...props
}) => {
  return (
    <ProductSchemaProvider
      {...props}
      category={`Safety Procedure Template - ${procedureCategory}`}
      contentTypeDutch={`Veiligheidsprocedure Sjabloon - ${procedureCategory}`}
      dutchLanguageOptimization={[
        "veiligheidsprocedure",
        "veiligheidsrichtlijnen",
        "veiligheidsmaatregelen",
        "veilig werken",
        "veiligheidsdocumentatie",
        ...dutchLanguageOptimization,
      ]}
    />
  );
};

/**
 * Specialized schema provider for hazard identification templates
 */
interface HazardTemplateSchemaProviderProps
  extends Omit<ProductSchemaProviderProps, "category" | "contentTypeDutch"> {
  hazardType?: string;
  industry?: string;
}

export const HazardTemplateSchemaProvider: React.FC<HazardTemplateSchemaProviderProps> = ({
  hazardType = "General Hazards",
  industry = "Construction",
  dutchLanguageOptimization = [],
  ...props
}) => {
  return (
    <ProductSchemaProvider
      {...props}
      category={`Hazard Identification Template - ${hazardType}`}
      contentTypeDutch={`Gevarenherkenning Sjabloon - ${hazardType}`}
      dutchLanguageOptimization={[
        "gevarenherkenning",
        "risicoanalyse",
        "veiligheidsrisico",
        "gevaarlijk werk",
        "veiligheidsmaatregelen",
        industry.toLowerCase(),
        ...dutchLanguageOptimization,
      ]}
    />
  );
};

/**
 * Specialized schema provider for VCA compliance templates
 */
interface VCATemplateSchemaProviderProps
  extends Omit<ProductSchemaProviderProps, "category" | "contentTypeDutch"> {
  vcaVersion?: string;
  complianceLevel?: string;
}

export const VCATemplateSchemaProvider: React.FC<VCATemplateSchemaProviderProps> = ({
  vcaVersion = "VCA 2017 v5.1",
  complianceLevel = "Full Compliance",
  dutchLanguageOptimization = [],
  ...props
}) => {
  return (
    <ProductSchemaProvider
      {...props}
      category={`VCA Compliance Template - ${vcaVersion}`}
      contentTypeDutch={`VCA Compliance Sjabloon - ${vcaVersion}`}
      dutchLanguageOptimization={[
        "VCA sjabloon",
        "VCA certificering",
        "veiligheidsnormen",
        "veiligheidsbeleid",
        "veiligheidsinspectie",
        "veiligheidsvoorschriften",
        ...dutchLanguageOptimization,
      ]}
    />
  );
};

/**
 * Predefined template products for common use cases
 */
export const TEMPLATE_PRODUCTS = {
  bouwTra: {
    name: "Bouw TRA Sjabloon - Complete Set",
    description:
      "Professionele TRA sjablonen voor de bouwsector, inclusief hoogwerk, graafwerkzaamheden, elektrawerkzaamheden en algemene bouwactiviteiten. VCA 2017 v5.1 compliant.",
    category: "TRA Template - Construction Industry",
    offers: {
      price: "99",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      ratingValue: 4.9,
      reviewCount: 47,
    },
  },
  elektraLmra: {
    name: "Elektra LMRA Sjabloon Set",
    description:
      "Gespecialiseerde LMRA sjablonen voor elektrawerkzaamheden, inclusief spanningsloos werken, hoogspanning, laagspanning en algemene elektraveiligheid procedures.",
    category: "LMRA Template - Electrical Work",
    offers: {
      price: "79",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      ratingValue: 4.8,
      reviewCount: 34,
    },
  },
  chemieVca: {
    name: "Chemie VCA Compliance Pakket",
    description:
      "Complete set VCA sjablonen voor de chemische industrie, inclusief gevaarlijke stoffen, procesveiligheid, opslag en transportveiligheid procedures.",
    category: "VCA Compliance Template - Chemical Industry",
    offers: {
      price: "149",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      ratingValue: 4.9,
      reviewCount: 28,
    },
  },
};

/**
 * Utility function to generate product schema for dynamic content
 * Note: This is a pure function that doesn't use React hooks
 */
export const createProductSchema = (
  data: Omit<ProductSchema, "@context" | "@type">
): ProductSchema => {
  // This is a pure function that doesn't use React hooks
  // The hook-based generation should be done in React components
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    ...data,
  } as ProductSchema;
};

/**
 * Hook for template product management
 */
export const useProductSchema = () => {
  const getTRATemplateData = (industry: string): Omit<ProductSchema, "@context" | "@type"> => ({
    name: `${industry} TRA Sjabloon Set`,
    description: `Professionele TRA sjablonen voor de ${industry.toLowerCase()} sector. VCA 2017 v5.1 compliant met branche-specifieke risicoanalyses.`,
    category: `TRA Template - ${industry} Industry`,
    offers: {
      price: "99",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      ratingValue: 4.8,
      reviewCount: 40,
    },
    contentTypeDutch: `TRA Sjabloon - ${industry} Sector`,
    dutchLanguageOptimization: [
      "TRA sjabloon",
      "veiligheidsdocument",
      "risicoanalyse",
      "veilig werken",
      industry.toLowerCase(),
    ],
  });

  const getLMRATemplateData = (context: string): Omit<ProductSchema, "@context" | "@type"> => ({
    name: `LMRA ${context} Sjabloon Set`,
    description: `LMRA sjablonen voor ${context.toLowerCase()} werkzaamheden. Laatste Minuut Risico Analyse templates voor verschillende werkomgevingen.`,
    category: `LMRA Template - ${context}`,
    offers: {
      price: "79",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      ratingValue: 4.7,
      reviewCount: 35,
    },
    contentTypeDutch: `LMRA Sjabloon - ${context}`,
    dutchLanguageOptimization: [
      "LMRA sjabloon",
      "Laatste Minuut Risico Analyse",
      "veiligheidsinspectie",
      "werkplekcontrole",
    ],
  });

  return {
    getTRATemplateData,
    getLMRATemplateData,
    predefinedProducts: TEMPLATE_PRODUCTS,
  };
};

export default ProductSchemaProvider;
