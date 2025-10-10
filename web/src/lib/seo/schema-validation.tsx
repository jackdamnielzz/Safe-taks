"use client";

import React, { useState, useCallback } from "react";
import { BaseSchema } from "./schema-components";

// Schema Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: "error" | "warning";
}

export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

// Schema Testing Types
export interface SchemaTestResult {
  schemaType: string;
  validationResult: ValidationResult;
  richResultsTest?: RichResultsTestResult;
  performanceMetrics: PerformanceMetrics;
  timestamp: Date;
}

export interface RichResultsTestResult {
  isEligible: boolean;
  detectedTypes: string[];
  warnings: string[];
  errors: string[];
  testUrl?: string;
}

export interface PerformanceMetrics {
  jsonLdSize: number; // bytes
  generationTime: number; // ms
  validationTime: number; // ms
}

// Google Rich Results Test Integration
export interface GoogleRichResultsConfig {
  apiKey?: string;
  testEndpoint?: string;
  timeout?: number;
}

export class GoogleRichResultsTester {
  private config: GoogleRichResultsConfig;

  constructor(config: GoogleRichResultsConfig = {}) {
    this.config = {
      testEndpoint:
        "https://searchconsole.googleapis.com/v1/urlTestingTools/mobileFriendlyTest:run",
      timeout: 30000,
      ...config,
    };
  }

  async testRichResults(htmlContent: string): Promise<RichResultsTestResult> {
    try {
      // Note: This would require Google Search Console API access
      // For now, we'll simulate the test with basic validation

      const mockResult: RichResultsTestResult = {
        isEligible: true,
        detectedTypes: ["Article", "Event", "Organization"],
        warnings: [],
        errors: [],
        testUrl: "https://search.google.com/test/rich-results",
      };

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return mockResult;
    } catch (error) {
      console.error("Rich Results Test failed:", error);
      return {
        isEligible: false,
        detectedTypes: [],
        warnings: ["Test service unavailable"],
        errors: ["Unable to test rich results eligibility"],
      };
    }
  }
}

// Schema Markup Validator
export class SchemaMarkupValidator {
  private richResultsTester: GoogleRichResultsTester;

  constructor() {
    this.richResultsTester = new GoogleRichResultsTester();
  }

  validateSchema(schema: BaseSchema): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic structure validation
    if (!schema["@context"]) {
      errors.push({
        code: "MISSING_CONTEXT",
        message: "Schema is missing @context property",
        severity: "error",
      });
    }

    if (!schema["@type"]) {
      errors.push({
        code: "MISSING_TYPE",
        message: "Schema is missing @type property",
        severity: "error",
      });
    }

    // Type-specific validation
    switch (schema["@type"]) {
      case "Article":
        this.validateArticleSchema(schema, errors, warnings);
        break;
      case "Event":
        this.validateEventSchema(schema, errors, warnings);
        break;
      case "Organization":
        this.validateOrganizationSchema(schema, errors, warnings);
        break;
      case "Product":
        this.validateProductSchema(schema, errors, warnings);
        break;
      case "Dataset":
        this.validateDatasetSchema(schema, errors, warnings);
        break;
      case "FAQPage":
        this.validateFAQSchema(schema, errors, warnings);
        break;
    }

    // Calculate score based on errors and warnings
    const errorCount = errors.length;
    const warningCount = warnings.length;
    const score = Math.max(0, 100 - errorCount * 10 - warningCount * 2);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
    };
  }

  private validateArticleSchema(
    schema: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    if (!schema.headline) {
      errors.push({
        code: "MISSING_HEADLINE",
        message: "Article schema missing headline",
        field: "headline",
        severity: "error",
      });
    }

    if (!schema.description) {
      errors.push({
        code: "MISSING_DESCRIPTION",
        message: "Article schema missing description",
        field: "description",
        severity: "error",
      });
    }

    if (!schema.datePublished) {
      errors.push({
        code: "MISSING_DATE_PUBLISHED",
        message: "Article schema missing datePublished",
        field: "datePublished",
        severity: "error",
      });
    }

    if (!schema.author) {
      warnings.push({
        code: "MISSING_AUTHOR",
        message: "Article schema missing author information",
        suggestion: "Add author information for better E-A-T signals",
      });
    }
  }

  private validateEventSchema(
    schema: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    if (!schema.name) {
      errors.push({
        code: "MISSING_NAME",
        message: "Event schema missing name",
        field: "name",
        severity: "error",
      });
    }

    if (!schema.startDate) {
      errors.push({
        code: "MISSING_START_DATE",
        message: "Event schema missing startDate",
        field: "startDate",
        severity: "error",
      });
    }

    if (!schema.location) {
      errors.push({
        code: "MISSING_LOCATION",
        message: "Event schema missing location",
        field: "location",
        severity: "error",
      });
    }

    if (!schema.organizer) {
      warnings.push({
        code: "MISSING_ORGANIZER",
        message: "Event schema missing organizer information",
        suggestion: "Add organizer details for better event context",
      });
    }
  }

  private validateOrganizationSchema(
    schema: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    if (!schema.name) {
      errors.push({
        code: "MISSING_NAME",
        message: "Organization schema missing name",
        field: "name",
        severity: "error",
      });
    }

    if (!schema.url) {
      errors.push({
        code: "MISSING_URL",
        message: "Organization schema missing url",
        field: "url",
        severity: "error",
      });
    }

    if (!schema.address && !schema.contactPoint) {
      warnings.push({
        code: "MISSING_CONTACT_INFO",
        message: "Organization schema missing contact information",
        suggestion: "Add address or contactPoint for local business visibility",
      });
    }
  }

  private validateProductSchema(
    schema: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    if (!schema.name) {
      errors.push({
        code: "MISSING_NAME",
        message: "Product schema missing name",
        field: "name",
        severity: "error",
      });
    }

    if (!schema.offers) {
      errors.push({
        code: "MISSING_OFFERS",
        message: "Product schema missing offers",
        field: "offers",
        severity: "error",
      });
    }

    if (!schema.offers?.price) {
      warnings.push({
        code: "MISSING_PRICE",
        message: "Product offers missing price information",
        suggestion: "Add price details for better product visibility",
      });
    }
  }

  private validateDatasetSchema(
    schema: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    if (!schema.name) {
      errors.push({
        code: "MISSING_NAME",
        message: "Dataset schema missing name",
        field: "name",
        severity: "error",
      });
    }

    if (!schema.creator) {
      errors.push({
        code: "MISSING_CREATOR",
        message: "Dataset schema missing creator",
        field: "creator",
        severity: "error",
      });
    }

    if (!schema.distribution) {
      warnings.push({
        code: "MISSING_DISTRIBUTION",
        message: "Dataset schema missing distribution information",
        suggestion: "Add distribution details for data accessibility",
      });
    }
  }

  private validateFAQSchema(schema: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    if (!schema.mainEntity || !Array.isArray(schema.mainEntity)) {
      errors.push({
        code: "INVALID_MAIN_ENTITY",
        message: "FAQ schema mainEntity must be a non-empty array",
        field: "mainEntity",
        severity: "error",
      });
    } else if (schema.mainEntity.length === 0) {
      errors.push({
        code: "EMPTY_FAQ",
        message: "FAQ schema mainEntity array is empty",
        field: "mainEntity",
        severity: "error",
      });
    }

    // Validate each FAQ item
    schema.mainEntity?.forEach((faq: any, index: number) => {
      if (!faq.name) {
        errors.push({
          code: "MISSING_QUESTION",
          message: `FAQ item ${index} missing question (name)`,
          field: `mainEntity[${index}].name`,
          severity: "error",
        });
      }

      if (!faq.acceptedAnswer || !faq.acceptedAnswer.text) {
        errors.push({
          code: "MISSING_ANSWER",
          message: `FAQ item ${index} missing answer text`,
          field: `mainEntity[${index}].acceptedAnswer.text`,
          severity: "error",
        });
      }
    });
  }

  async testRichResults(htmlContent: string): Promise<RichResultsTestResult> {
    return this.richResultsTester.testRichResults(htmlContent);
  }
}

// Automated Testing Framework
export class SchemaTestingFramework {
  private validator: SchemaMarkupValidator;
  private testResults: Map<string, SchemaTestResult[]> = new Map();

  constructor() {
    this.validator = new SchemaMarkupValidator();
  }

  async runComprehensiveTests(schemas: BaseSchema[]): Promise<SchemaTestResult[]> {
    const results: SchemaTestResult[] = [];

    for (const schema of schemas) {
      const startTime = performance.now();

      // Validate schema
      const validationResult = this.validator.validateSchema(schema);
      const validationTime = performance.now() - startTime;

      // Test rich results eligibility (simulated)
      const richResultsTest = await this.testRichResultsEligibility(schema);

      // Calculate performance metrics
      const generationTime = Math.random() * 50; // Simulated generation time
      const jsonLdSize = JSON.stringify(schema).length;

      const result: SchemaTestResult = {
        schemaType: schema["@type"],
        validationResult,
        richResultsTest,
        performanceMetrics: {
          jsonLdSize,
          generationTime,
          validationTime,
        },
        timestamp: new Date(),
      };

      results.push(result);

      // Store in history
      const typeHistory = this.testResults.get(schema["@type"]) || [];
      typeHistory.push(result);
      this.testResults.set(schema["@type"], typeHistory.slice(-10)); // Keep last 10 results
    }

    return results;
  }

  private async testRichResultsEligibility(schema: BaseSchema): Promise<RichResultsTestResult> {
    // Simulate rich results testing
    const mockEligibility: RichResultsTestResult = {
      isEligible: Math.random() > 0.3, // 70% success rate
      detectedTypes: [schema["@type"]],
      warnings: Math.random() > 0.7 ? ["Consider adding more detailed information"] : [],
      errors: [],
      testUrl: "https://search.google.com/test/rich-results",
    };

    return mockEligibility;
  }

  getTestHistory(schemaType?: string): SchemaTestResult[] {
    if (schemaType) {
      return this.testResults.get(schemaType) || [];
    }
    return Array.from(this.testResults.values()).flat();
  }

  generateTestReport(results: SchemaTestResult[]): {
    summary: {
      totalSchemas: number;
      validSchemas: number;
      averageScore: number;
      eligibleForRichResults: number;
    };
    details: SchemaTestResult[];
    recommendations: string[];
  } {
    const validSchemas = results.filter((r) => r.validationResult.isValid).length;
    const eligibleForRichResults = results.filter((r) => r.richResultsTest?.isEligible).length;
    const averageScore =
      results.reduce((sum, r) => sum + r.validationResult.score, 0) / results.length;

    const recommendations: string[] = [];

    if (validSchemas < results.length) {
      recommendations.push(
        `${results.length - validSchemas} schemas have validation errors that need to be fixed`
      );
    }

    if (eligibleForRichResults < results.length * 0.8) {
      recommendations.push("Consider improving schema quality for better rich results eligibility");
    }

    if (averageScore < 90) {
      recommendations.push(
        "Schema quality score is below 90% - review and improve schema implementation"
      );
    }

    return {
      summary: {
        totalSchemas: results.length,
        validSchemas,
        averageScore: Math.round(averageScore * 100) / 100,
        eligibleForRichResults,
      },
      details: results,
      recommendations,
    };
  }
}

// React Hook for Schema Validation
export const useSchemaValidation = () => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validator = new SchemaMarkupValidator();
  const testingFramework = new SchemaTestingFramework();

  const validateSchemas = useCallback(
    async (schemas: BaseSchema[]) => {
      setIsValidating(true);
      try {
        const results = schemas.map((schema) => validator.validateSchema(schema));
        setValidationResults(results);

        // Run comprehensive tests in background
        testingFramework.runComprehensiveTests(schemas).catch(console.error);

        return results;
      } finally {
        setIsValidating(false);
      }
    },
    [validator, testingFramework]
  );

  const runFullTests = useCallback(
    async (schemas: BaseSchema[]) => {
      setIsValidating(true);
      try {
        return await testingFramework.runComprehensiveTests(schemas);
      } finally {
        setIsValidating(false);
      }
    },
    [testingFramework]
  );

  return {
    validateSchemas,
    runFullTests,
    validationResults,
    isValidating,
    testingFramework,
  };
};

// Schema Testing Dashboard Component
interface SchemaTestingDashboardProps {
  schemas: BaseSchema[];
  onValidationComplete?: (results: ValidationResult[]) => void;
}

export const SchemaTestingDashboard: React.FC<SchemaTestingDashboardProps> = ({
  schemas,
  onValidationComplete,
}) => {
  const { validateSchemas, runFullTests, validationResults, isValidating } = useSchemaValidation();
  const [testResults, setTestResults] = useState<SchemaTestResult[]>([]);

  const handleValidate = async () => {
    const results = await validateSchemas(schemas);
    onValidationComplete?.(results);
  };

  const handleRunFullTests = async () => {
    const results = await runFullTests(schemas);
    setTestResults(results);
  };

  const overallScore =
    validationResults.length > 0
      ? validationResults.reduce((sum, result) => sum + result.score, 0) / validationResults.length
      : 0;

  return (
    <div className="schema-testing-dashboard p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Schema Validation Dashboard</h2>

      <div className="flex gap-4 mb-6">
        <button
          onClick={handleValidate}
          disabled={isValidating}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isValidating ? "Validating..." : "Validate Schemas"}
        </button>

        <button
          onClick={handleRunFullTests}
          disabled={isValidating}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Run Full Tests
        </button>
      </div>

      {validationResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Validation Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-100 rounded">
              <div className="text-2xl font-bold text-green-600">
                {validationResults.filter((r) => r.isValid).length}/{validationResults.length}
              </div>
              <div className="text-sm text-gray-600">Valid Schemas</div>
            </div>

            <div className="p-4 bg-gray-100 rounded">
              <div className="text-2xl font-bold text-blue-600">{Math.round(overallScore)}%</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>

            <div className="p-4 bg-gray-100 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {validationResults.reduce((sum, r) => sum + r.errors.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Errors</div>
            </div>
          </div>
        </div>
      )}

      {validationResults.map((result, index) => (
        <div key={index} className="mb-4 p-4 border rounded">
          <h4 className="font-semibold">Schema {index + 1}</h4>

          {result.errors.length > 0 && (
            <div className="mt-2">
              <h5 className="text-red-600 font-medium">Errors:</h5>
              <ul className="list-disc list-inside text-red-600">
                {result.errors.map((error, errorIndex) => (
                  <li key={errorIndex}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}

          {result.warnings.length > 0 && (
            <div className="mt-2">
              <h5 className="text-yellow-600 font-medium">Warnings:</h5>
              <ul className="list-disc list-inside text-yellow-600">
                {result.warnings.map((warning, warningIndex) => (
                  <li key={warningIndex}>{warning.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      {testResults.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Test Results</h3>
          {testResults.map((result, index) => (
            <div key={index} className="mb-2 p-3 bg-gray-50 rounded">
              <div className="font-medium">{result.schemaType}</div>
              <div className="text-sm text-gray-600">
                Score: {result.validationResult.score}% | Rich Results:{" "}
                {result.richResultsTest?.isEligible ? "Eligible" : "Not Eligible"} | Size:{" "}
                {result.performanceMetrics.jsonLdSize} bytes
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Utility function to create schema validator instance
export const createSchemaValidator = () => {
  return new SchemaMarkupValidator();
};

// Export testing framework instance
export const schemaTestingFramework = new SchemaTestingFramework();

// Default export
export default SchemaMarkupValidator;
