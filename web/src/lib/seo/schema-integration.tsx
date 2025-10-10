"use client";

import React, { createContext, useContext, ReactNode } from "react";
import Head from "next/head";
import { SchemaComponent } from "./schema-components";

// Schema Integration Context for global schema management
interface SchemaContextType {
  schemas: any[];
  addSchema: (schema: any) => void;
  removeSchema: (schemaType: string) => void;
  clearSchemas: () => void;
}

const SchemaContext = createContext<SchemaContextType | undefined>(undefined);

// Schema Provider Component for global schema management
interface SchemaProviderProps {
  children: ReactNode;
}

export const SchemaProvider: React.FC<SchemaProviderProps> = ({ children }) => {
  const [schemas, setSchemas] = React.useState<any[]>([]);

  const addSchema = React.useCallback((schema: any) => {
    setSchemas((prev) => {
      // Remove existing schema of same type to avoid duplicates
      const filtered = prev.filter((s) => s["@type"] !== schema["@type"]);
      return [...filtered, schema];
    });
  }, []);

  const removeSchema = React.useCallback((schemaType: string) => {
    setSchemas((prev) => prev.filter((schema) => schema["@type"] !== schemaType));
  }, []);

  const clearSchemas = React.useCallback(() => {
    setSchemas([]);
  }, []);

  return (
    <SchemaContext.Provider value={{ schemas, addSchema, removeSchema, clearSchemas }}>
      {children}
    </SchemaContext.Provider>
  );
};

// Hook for using schema context
export const useSchemaContext = () => {
  const context = useContext(SchemaContext);
  if (context === undefined) {
    throw new Error("useSchemaContext must be used within a SchemaProvider");
  }
  return context;
};

// Global Schema Manager Component
interface GlobalSchemaManagerProps {
  children?: ReactNode;
}

export const GlobalSchemaManager: React.FC<GlobalSchemaManagerProps> = ({ children }) => {
  const { schemas } = useSchemaContext();

  return (
    <>
      {schemas.map((schema, index) => (
        <SchemaComponent key={`global-schema-${schema["@type"]}-${index}`} schema={schema} />
      ))}
      {children}
    </>
  );
};

// Unified Schema Integration Component
interface SchemaIntegratorProps {
  schemas: any[];
  children?: ReactNode;
}

export const SchemaIntegrator: React.FC<SchemaIntegratorProps> = ({ schemas, children }) => {
  return (
    <>
      {schemas.map((schema, index) => (
        <SchemaComponent key={`schema-${schema["@type"]}-${index}`} schema={schema} />
      ))}
      {children}
    </>
  );
};

// Schema Integration Hook for pages
export const useSchemaIntegration = () => {
  const { addSchema, removeSchema, clearSchemas } = useSchemaContext();

  const integrateSchemas = React.useCallback(
    (schemas: any[]) => {
      schemas.forEach((schema) => addSchema(schema));
    },
    [addSchema]
  );

  const integrateSingleSchema = React.useCallback(
    (schema: any) => {
      addSchema(schema);
    },
    [addSchema]
  );

  return {
    integrateSchemas,
    integrateSingleSchema,
    removeSchema,
    clearSchemas,
  };
};

// Schema Validation Utilities
export const validateSchema = (schema: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required fields
  if (!schema["@context"]) {
    errors.push("Missing @context");
  }

  if (!schema["@type"]) {
    errors.push("Missing @type");
  }

  // Type-specific validation
  switch (schema["@type"]) {
    case "Article":
      if (!schema.headline) errors.push("Article missing headline");
      if (!schema.description) errors.push("Article missing description");
      if (!schema.datePublished) errors.push("Article missing datePublished");
      break;

    case "Event":
      if (!schema.name) errors.push("Event missing name");
      if (!schema.startDate) errors.push("Event missing startDate");
      if (!schema.description) errors.push("Event missing description");
      if (!schema.location) errors.push("Event missing location");
      break;

    case "Organization":
      if (!schema.name) errors.push("Organization missing name");
      if (!schema.description) errors.push("Organization missing description");
      break;

    case "FAQPage":
      if (!schema.mainEntity || !Array.isArray(schema.mainEntity)) {
        errors.push("FAQPage missing or invalid mainEntity array");
      }
      break;

    case "Product":
      if (!schema.name) errors.push("Product missing name");
      if (!schema.description) errors.push("Product missing description");
      if (!schema.offers) errors.push("Product missing offers");
      break;

    case "Dataset":
      if (!schema.name) errors.push("Dataset missing name");
      if (!schema.description) errors.push("Dataset missing description");
      if (!schema.creator) errors.push("Dataset missing creator");
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Schema Testing Utilities
export const generateSchemaTestReport = (
  schemas: any[]
): {
  totalSchemas: number;
  validSchemas: number;
  errors: Array<{ type: string; errors: string[] }>;
} => {
  const errors: Array<{ type: string; errors: string[] }> = [];
  let validSchemas = 0;

  schemas.forEach((schema) => {
    const validation = validateSchema(schema);
    if (validation.isValid) {
      validSchemas++;
    } else {
      errors.push({
        type: schema["@type"],
        errors: validation.errors,
      });
    }
  });

  return {
    totalSchemas: schemas.length,
    validSchemas,
    errors,
  };
};

// Schema Performance Monitoring
export const monitorSchemaPerformance = (schemas: any[]) => {
  const startTime = performance.now();

  // Simulate schema processing
  schemas.forEach((schema) => {
    JSON.stringify(schema);
  });

  const endTime = performance.now();
  const processingTime = endTime - startTime;

  return {
    schemaCount: schemas.length,
    processingTimeMs: processingTime,
    averageTimePerSchema: processingTime / schemas.length,
  };
};

// Schema SEO Utilities
export const generateStructuredDataForPage = (pageData: {
  type: "article" | "event" | "product" | "organization" | "faq" | "dataset";
  data: any;
  locale?: string;
}): any | null => {
  try {
    switch (pageData.type) {
      case "article":
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          ...pageData.data,
        };

      case "event":
        return {
          "@context": "https://schema.org",
          "@type": "Event",
          ...pageData.data,
        };

      case "product":
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          ...pageData.data,
        };

      case "organization":
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          ...pageData.data,
        };

      case "faq":
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          ...pageData.data,
        };

      case "dataset":
        return {
          "@context": "https://schema.org",
          "@type": "Dataset",
          ...pageData.data,
        };

      default:
        return null;
    }
  } catch (error) {
    console.error("Error generating structured data:", error);
    return null;
  }
};

// Higher-Order Component for Schema Integration
interface WithSchemaProps {
  schemas: any[];
  children: ReactNode;
}

export const WithSchema: React.FC<WithSchemaProps> = ({ schemas, children }) => {
  return <SchemaIntegrator schemas={schemas}>{children}</SchemaIntegrator>;
};

// Schema Error Boundary
interface SchemaErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const SchemaErrorBoundary: React.FC<SchemaErrorBoundaryProps> = ({
  children,
  fallback = null,
}) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error("Schema rendering error:", error);
    return <>{fallback}</>;
  }
};

export default SchemaProvider;
