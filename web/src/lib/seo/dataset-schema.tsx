"use client";

import React from "react";
import { DatasetSchema, SchemaComponent, useSchema } from "./schema-components";

/**
 * Dataset Schema Implementation for Hazard Identification Database
 *
 * This component implements Dataset schema markup optimized for:
 * - Dutch hazard identification database
 * - VCA-compliant hazard classifications
 * - Industry-specific hazard categories
 * - Safety hazard knowledge base
 */

interface DatasetSchemaProviderProps {
  name: string;
  description: string;
  creator: {
    name: string;
  };
  distribution: {
    encodingFormat: string;
    contentUrl: string;
  };
  temporalCoverage?: string;
  spatialCoverage?: {
    name: string;
  };
  keywords: string[];
  contentTypeDutch: string;
  dutchLanguageOptimization?: string[];
  children?: React.ReactNode;
}

export const DatasetSchemaProvider: React.FC<DatasetSchemaProviderProps> = ({
  name,
  description,
  creator,
  distribution,
  temporalCoverage,
  spatialCoverage,
  keywords,
  contentTypeDutch,
  dutchLanguageOptimization = [],
  children,
}) => {
  const { generateDatasetSchema } = useSchema();

  const datasetSchema: DatasetSchema = generateDatasetSchema({
    name,
    description,
    creator: {
      "@type": "Organization",
      name: creator.name,
    },
    distribution: {
      "@type": "DataDownload",
      ...distribution,
    },
    temporalCoverage,
    spatialCoverage: spatialCoverage
      ? {
          "@type": "Place",
          name: spatialCoverage.name,
        }
      : undefined,
    keywords,
    contentTypeDutch,
    dutchLanguageOptimization,
  });

  return <SchemaComponent schema={datasetSchema}>{children}</SchemaComponent>;
};

/**
 * Specialized schema provider for hazard identification datasets
 */
interface HazardDatasetSchemaProviderProps
  extends Omit<DatasetSchemaProviderProps, "contentTypeDutch"> {
  hazardCategory?: string;
  industry?: string;
  riskLevel?: "Low" | "Medium" | "High" | "Critical";
}

export const HazardDatasetSchemaProvider: React.FC<HazardDatasetSchemaProviderProps> = ({
  hazardCategory = "General Hazards",
  industry = "Construction",
  riskLevel = "Medium",
  dutchLanguageOptimization = [],
  ...props
}) => {
  return (
    <DatasetSchemaProvider
      {...props}
      contentTypeDutch={`Gevarenherkenning Dataset - ${hazardCategory}`}
      dutchLanguageOptimization={[
        "gevarenherkenning",
        "risicoanalyse",
        "veiligheidsrisico",
        "gevaarlijk werk",
        "veiligheidsmaatregelen",
        industry.toLowerCase(),
        ...dutchLanguageOptimization,
      ]}
      keywords={[
        "hazard identification",
        "safety hazards",
        "risk assessment",
        "veiligheidsrisico",
        hazardCategory.toLowerCase(),
        industry.toLowerCase(),
        ...(props.keywords || []),
      ]}
    />
  );
};

/**
 * Specialized schema provider for VCA hazard datasets
 */
interface VCADatasetSchemaProviderProps
  extends Omit<DatasetSchemaProviderProps, "contentTypeDutch"> {
  vcaVersion?: string;
  complianceLevel?: string;
}

export const VCADatasetSchemaProvider: React.FC<VCADatasetSchemaProviderProps> = ({
  vcaVersion = "VCA 2017 v5.1",
  complianceLevel = "Full Compliance",
  dutchLanguageOptimization = [],
  ...props
}) => {
  return (
    <DatasetSchemaProvider
      {...props}
      contentTypeDutch={`VCA Gevaren Dataset - ${vcaVersion}`}
      dutchLanguageOptimization={[
        "VCA gevaren",
        "VCA certificering",
        "veiligheidsnormen",
        "veiligheidsbeleid",
        "veiligheidsinspectie",
        "veiligheidsvoorschriften",
        ...dutchLanguageOptimization,
      ]}
      keywords={[
        "VCA hazards",
        "VCA compliance",
        "veiligheidsrisico",
        "veiligheidsnormen",
        "veiligheidsbeleid",
        ...(props.keywords || []),
      ]}
    />
  );
};

/**
 * Specialized schema provider for industry-specific hazard datasets
 */
interface IndustryHazardDatasetSchemaProviderProps
  extends Omit<DatasetSchemaProviderProps, "contentTypeDutch"> {
  industry: string;
  hazardTypes?: string[];
}

export const IndustryHazardDatasetSchemaProvider: React.FC<
  IndustryHazardDatasetSchemaProviderProps
> = ({
  industry,
  hazardTypes = ["Physical", "Chemical", "Biological", "Ergonomic", "Psychosocial"],
  dutchLanguageOptimization = [],
  ...props
}) => {
  return (
    <DatasetSchemaProvider
      {...props}
      contentTypeDutch={`${industry} Gevaren Database`}
      dutchLanguageOptimization={[
        "gevarenherkenning",
        "risicoanalyse",
        "veiligheidsrisico",
        "gevaarlijk werk",
        industry.toLowerCase(),
        ...hazardTypes.map((type) => type.toLowerCase()),
        ...dutchLanguageOptimization,
      ]}
      keywords={[
        "hazard identification",
        "safety hazards",
        industry.toLowerCase(),
        ...hazardTypes.map((type) => type.toLowerCase()),
        ...(props.keywords || []),
      ]}
    />
  );
};

/**
 * Specialized schema provider for control measures datasets
 */
interface ControlMeasuresDatasetSchemaProviderProps
  extends Omit<DatasetSchemaProviderProps, "contentTypeDutch"> {
  controlCategory?: string;
  effectivenessLevel?: string;
}

export const ControlMeasuresDatasetSchemaProvider: React.FC<
  ControlMeasuresDatasetSchemaProviderProps
> = ({
  controlCategory = "General Controls",
  effectivenessLevel = "High",
  dutchLanguageOptimization = [],
  ...props
}) => {
  return (
    <DatasetSchemaProvider
      {...props}
      contentTypeDutch={`Veiligheidsmaatregelen Dataset - ${controlCategory}`}
      dutchLanguageOptimization={[
        "veiligheidsmaatregelen",
        "beschermingsmiddelen",
        "veiligheidscontroles",
        "veiligheidsprocedures",
        "veiligheidsrichtlijnen",
        ...dutchLanguageOptimization,
      ]}
      keywords={[
        "control measures",
        "safety controls",
        "veiligheidsmaatregelen",
        "beschermingsmiddelen",
        ...(props.keywords || []),
      ]}
    />
  );
};

/**
 * Predefined hazard datasets for common use cases
 */
export const HAZARD_DATASETS = {
  bouwGevaren: {
    name: "Bouwsector Gevaren Database",
    description:
      "Uitgebreide database met gevarenidentificatie voor de Nederlandse bouwsector, inclusief hoogwerk, graafwerkzaamheden, elektrawerkzaamheden en algemene bouwrisico's.",
    creator: {
      name: "SafeWork Pro",
    },
    distribution: {
      encodingFormat: "application/json",
      contentUrl: "/api/hazards/construction",
    },
    temporalCoverage: "2024-01-01/2025-12-31",
    spatialCoverage: {
      name: "Netherlands",
    },
    keywords: [
      "bouwgevaren",
      "bouwveiligheid",
      "hoogwerk",
      "graafwerkzaamheden",
      "elektrawerkzaamheden",
      "bouwrisico",
    ],
  },
  elektraRisico: {
    name: "Elektrische Veiligheid Dataset",
    description:
      "Database met elektrische veiligheidsrisico's, inclusief spanningsloos werken, hoogspanning procedures, laagspanning veiligheid en algemene elektraveiligheid.",
    creator: {
      name: "SafeWork Pro",
    },
    distribution: {
      encodingFormat: "application/json",
      contentUrl: "/api/hazards/electrical",
    },
    temporalCoverage: "2024-01-01/2025-12-31",
    spatialCoverage: {
      name: "Netherlands",
    },
    keywords: [
      "elektrische veiligheid",
      "spanningsloos werken",
      "hoogspanning",
      "laagspanning",
      "elektrarisico",
    ],
  },
  chemieGevaren: {
    name: "Chemische Stoffen Database",
    description:
      "Database met gevaarlijke stoffen, chemische risico's, opslagveiligheid en transportveiligheid voor de Nederlandse chemische industrie.",
    creator: {
      name: "SafeWork Pro",
    },
    distribution: {
      encodingFormat: "application/json",
      contentUrl: "/api/hazards/chemical",
    },
    temporalCoverage: "2024-01-01/2025-12-31",
    spatialCoverage: {
      name: "Netherlands",
    },
    keywords: [
      "chemische stoffen",
      "gevaarlijke stoffen",
      "opslagveiligheid",
      "transportveiligheid",
      "chemische risico",
    ],
  },
};

/**
 * Utility function to generate dataset schema for dynamic content
 * Note: This is a pure function that doesn't use React hooks
 */
export const createDatasetSchema = (
  data: Omit<DatasetSchema, "@context" | "@type">
): DatasetSchema => {
  // This is a pure function that doesn't use React hooks
  // The hook-based generation should be done in React components
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    ...data,
  } as DatasetSchema;
};

/**
 * Hook for hazard dataset management
 */
export const useDatasetSchema = () => {
  const getConstructionHazardData = (): Omit<DatasetSchema, "@context" | "@type"> => ({
    name: "Bouwsector Gevaren Database",
    description:
      "Uitgebreide database met gevarenidentificatie voor de Nederlandse bouwsector, inclusief hoogwerk, graafwerkzaamheden, elektrawerkzaamheden en algemene bouwrisico's.",
    creator: {
      name: "SafeWork Pro",
    },
    distribution: {
      encodingFormat: "application/json",
      contentUrl: "/api/hazards/construction",
    },
    temporalCoverage: "2024-01-01/2025-12-31",
    spatialCoverage: {
      name: "Netherlands",
    },
    keywords: [
      "bouwgevaren",
      "bouwveiligheid",
      "hoogwerk",
      "graafwerkzaamheden",
      "elektrawerkzaamheden",
      "bouwrisico",
    ],
    contentTypeDutch: "Bouwsector Gevaren Database",
    dutchLanguageOptimization: [
      "bouwgevaren",
      "bouwveiligheid",
      "gevarenherkenning",
      "veiligheidsrisico",
      "bouwrisico",
    ],
  });

  const getElectricalHazardData = (): Omit<DatasetSchema, "@context" | "@type"> => ({
    name: "Elektrische Veiligheid Dataset",
    description:
      "Database met elektrische veiligheidsrisico's, inclusief spanningsloos werken, hoogspanning procedures, laagspanning veiligheid en algemene elektraveiligheid.",
    creator: {
      name: "SafeWork Pro",
    },
    distribution: {
      encodingFormat: "application/json",
      contentUrl: "/api/hazards/electrical",
    },
    temporalCoverage: "2024-01-01/2025-12-31",
    spatialCoverage: {
      name: "Netherlands",
    },
    keywords: [
      "elektrische veiligheid",
      "spanningsloos werken",
      "hoogspanning",
      "laagspanning",
      "elektrarisico",
    ],
    contentTypeDutch: "Elektrische Veiligheid Dataset",
    dutchLanguageOptimization: [
      "elektrische veiligheid",
      "spanningsloos werken",
      "hoogspanning",
      "laagspanning",
      "elektrarisico",
    ],
  });

  return {
    getConstructionHazardData,
    getElectricalHazardData,
    predefinedDatasets: HAZARD_DATASETS,
  };
};

export default DatasetSchemaProvider;
