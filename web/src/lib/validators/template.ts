/**
 * Template Validation Schemas
 * Zod schemas for validating template-related requests and data
 */

import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const IndustryCategorySchema = z.enum([
  "construction",
  "electrical",
  "plumbing",
  "roofing",
  "groundwork",
  "painting",
  "industrial",
  "offshore",
  "logistics",
  "maintenance",
  "other",
]);

export const HazardCategorySchema = z.enum([
  "electrical",
  "mechanical",
  "chemical",
  "biological",
  "physical",
  "ergonomic",
  "psychosocial",
  "fire_explosion",
  "environmental",
  "other",
]);

export const ControlMeasureTypeSchema = z.enum([
  "elimination",
  "substitution",
  "engineering",
  "administrative",
  "ppe",
]);

export const ComplianceFrameworkSchema = z.enum(["vca", "iso45001", "both"]);

export const TemplateStatusSchema = z.enum(["draft", "published", "archived"]);

export const TemplateVisibilitySchema = z.enum(["organization", "system", "shared"]);

// ============================================================================
// KINNEY & WIRUTH SCORE SCHEMAS
// ============================================================================

export const EffectScoreSchema = z.union([
  z.literal(1),
  z.literal(3),
  z.literal(7),
  z.literal(15),
  z.literal(40),
  z.literal(100),
]);

export const ExposureScoreSchema = z.union([
  z.literal(0.5),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(6),
  z.literal(10),
]);

export const ProbabilityScoreSchema = z.union([
  z.literal(0.1),
  z.literal(0.2),
  z.literal(0.5),
  z.literal(1),
  z.literal(3),
  z.literal(6),
  z.literal(10),
]);

// ============================================================================
// COMPONENT SCHEMAS
// ============================================================================

/**
 * Template Control Measure Schema
 */
export const TemplateControlMeasureSchema = z.object({
  type: ControlMeasureTypeSchema,
  description: z.string().min(10, "Beschrijving moet minimaal 10 karakters bevatten").max(500),
  priority: z.number().int().min(1).max(5),
  isRequired: z.boolean().optional(),
  estimatedCost: z.string().optional(),
  implementationTime: z.string().optional(),
});

/**
 * Template Hazard Schema
 */
export const TemplateHazardSchema = z.object({
  id: z.string().min(1),
  description: z
    .string()
    .min(10, "Gevaarbeschrijving moet minimaal 10 karakters bevatten")
    .max(500),
  category: HazardCategorySchema,

  // Kinney & Wiruth scores
  typicalEffect: EffectScoreSchema,
  typicalExposure: ExposureScoreSchema,
  typicalProbability: ProbabilityScoreSchema,

  // Recommended controls (at least 1 required)
  recommendedControls: z
    .array(TemplateControlMeasureSchema)
    .min(1, "Minimaal één beheersmaatregel is vereist"),

  // Optional fields
  legislationReference: z.string().optional(),
  vcaReference: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Template Task Step Schema
 */
export const TemplateTaskStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  description: z.string().min(10, "Stapbeschrijving moet minimaal 10 karakters bevatten").max(500),
  duration: z.number().int().min(1).optional(),
  requiredPersonnel: z.number().int().min(1).optional(),
  equipment: z.array(z.string()).optional(),

  // Hazards (at least 1 required per step)
  hazards: z.array(TemplateHazardSchema).min(1, "Elke stap moet minimaal één gevaar bevatten"),

  // Optional guidance
  safetyInstructions: z.string().max(1000).optional(),
  preparationNotes: z.string().max(1000).optional(),
});

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

/**
 * Create Template Request Schema
 */
export const CreateTemplateRequestSchema = z
  .object({
    name: z
      .string()
      .min(5, "Template naam moet minimaal 5 karakters bevatten")
      .max(100, "Template naam mag maximaal 100 karakters bevatten"),
    description: z
      .string()
      .min(10, "Beschrijving moet minimaal 10 karakters bevatten")
      .max(1000, "Beschrijving mag maximaal 1000 karakters bevatten"),
    industryCategory: IndustryCategorySchema,
    hazardCategories: z
      .array(HazardCategorySchema)
      .min(1, "Selecteer minimaal één gevaarcategorie"),
    complianceFramework: ComplianceFrameworkSchema,

    // Task steps (at least 1 required)
    taskStepsTemplate: z
      .array(TemplateTaskStepSchema)
      .min(1, "Template moet minimaal één taakstap bevatten"),

    // Optional fields
    requiredCompetencies: z.array(z.string()).optional(),
    vcaCertified: z.boolean().optional(),
    vcaVersion: z.string().optional(),
    tags: z.array(z.string()).optional(),
    language: z.enum(["nl", "en"]).optional(),
  })
  .refine(
    (data) => {
      // If vcaCertified is true, vcaVersion must be provided
      if (data.vcaCertified && !data.vcaVersion) {
        return false;
      }
      return true;
    },
    {
      message: "VCA versie is verplicht als template VCA-gecertificeerd is",
      path: ["vcaVersion"],
    }
  );

/**
 * Update Template Request Schema
 */
export const UpdateTemplateRequestSchema = z
  .object({
    name: z
      .string()
      .min(5, "Template naam moet minimaal 5 karakters bevatten")
      .max(100, "Template naam mag maximaal 100 karakters bevatten")
      .optional(),
    description: z
      .string()
      .min(10, "Beschrijving moet minimaal 10 karakters bevatten")
      .max(1000, "Beschrijving mag maximaal 1000 karakters bevatten")
      .optional(),
    industryCategory: IndustryCategorySchema.optional(),
    hazardCategories: z.array(HazardCategorySchema).min(1).optional(),
    taskStepsTemplate: z.array(TemplateTaskStepSchema).min(1).optional(),
    requiredCompetencies: z.array(z.string()).optional(),
    vcaCertified: z.boolean().optional(),
    vcaVersion: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: TemplateStatusSchema.optional(),
    versionNotes: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // If vcaCertified is explicitly set to true, vcaVersion must be provided
      if (data.vcaCertified === true && !data.vcaVersion) {
        return false;
      }
      return true;
    },
    {
      message: "VCA versie is verplicht als template VCA-gecertificeerd is",
      path: ["vcaVersion"],
    }
  );

/**
 * Template Filter Schema (for query parameters)
 */
export const TemplateFilterSchema = z.object({
  industryCategory: z.union([IndustryCategorySchema, z.array(IndustryCategorySchema)]).optional(),
  hazardCategory: z.union([HazardCategorySchema, z.array(HazardCategorySchema)]).optional(),
  vcaCertified: z.boolean().optional(),
  complianceFramework: ComplianceFrameworkSchema.optional(),
  status: TemplateStatusSchema.optional(),
  visibility: TemplateVisibilitySchema.optional(),
  searchQuery: z.string().optional(),
  tags: z.array(z.string()).optional(),
  language: z.enum(["nl", "en"]).optional(),

  // Pagination
  pageSize: z.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate template name uniqueness (must be checked against database)
 */
export function validateTemplateNameUnique(
  name: string,
  existingNames: string[]
): { valid: boolean; error?: string } {
  const normalizedName = name.toLowerCase().trim();
  const exists = existingNames.some((existing) => existing.toLowerCase().trim() === normalizedName);

  if (exists) {
    return {
      valid: false,
      error: "Een template met deze naam bestaat al in uw organisatie",
    };
  }

  return { valid: true };
}

/**
 * Validate risk scores are within Kinney & Wiruth ranges
 */
export function validateRiskScores(
  effect: number,
  exposure: number,
  probability: number
): { valid: boolean; error?: string } {
  const validEffectScores = [1, 3, 7, 15, 40, 100];
  const validExposureScores = [0.5, 1, 2, 3, 6, 10];
  const validProbabilityScores = [0.1, 0.2, 0.5, 1, 3, 6, 10];

  if (!validEffectScores.includes(effect)) {
    return {
      valid: false,
      error: `Ongeldig effect score: ${effect}. Gebruik: ${validEffectScores.join(", ")}`,
    };
  }

  if (!validExposureScores.includes(exposure)) {
    return {
      valid: false,
      error: `Ongeldig blootstelling score: ${exposure}. Gebruik: ${validExposureScores.join(", ")}`,
    };
  }

  if (!validProbabilityScores.includes(probability)) {
    return {
      valid: false,
      error: `Ongeldig waarschijnlijkheid score: ${probability}. Gebruik: ${validProbabilityScores.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Validate step numbers are sequential
 */
export function validateSequentialSteps(steps: { stepNumber: number }[]): {
  valid: boolean;
  error?: string;
} {
  if (steps.length === 0) {
    return {
      valid: false,
      error: "Template moet minimaal één taakstap bevatten",
    };
  }

  // Sort by step number
  const sortedSteps = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);

  // Check if steps start at 1
  if (sortedSteps[0].stepNumber !== 1) {
    return {
      valid: false,
      error: "Taakstappen moeten beginnen bij nummer 1",
    };
  }

  // Check if steps are sequential
  for (let i = 1; i < sortedSteps.length; i++) {
    if (sortedSteps[i].stepNumber !== sortedSteps[i - 1].stepNumber + 1) {
      return {
        valid: false,
        error: `Taakstappen moeten opeenvolgend zijn. Ontbrekend stap nummer: ${sortedSteps[i - 1].stepNumber + 1}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate VCA compliance requirements
 */
export function validateVCACompliance(template: {
  vcaCertified: boolean;
  vcaVersion?: string;
  complianceFramework: string;
}): { valid: boolean; error?: string } {
  if (template.vcaCertified) {
    if (!template.vcaVersion) {
      return {
        valid: false,
        error: "VCA versie is verplicht voor gecertificeerde templates",
      };
    }

    if (template.complianceFramework === "iso45001") {
      return {
        valid: false,
        error: "VCA-gecertificeerde templates moeten VCA of beide compliance frameworks gebruiken",
      };
    }
  }

  return { valid: true };
}

/**
 * Validate control measures follow Hierarchy of Controls
 */
export function validateControlHierarchy(controls: { type: string; priority: number }[]): {
  valid: boolean;
  warnings?: string[];
} {
  const warnings: string[] = [];

  // Check if higher-level controls (elimination, substitution) have higher priority
  const eliminationControls = controls.filter((c) => c.type === "elimination");
  const substitutionControls = controls.filter((c) => c.type === "substitution");
  const ppeControls = controls.filter((c) => c.type === "ppe");

  // Elimination should have priority 1-2
  if (eliminationControls.some((c) => c.priority > 2)) {
    warnings.push("Eliminatie maatregelen zouden de hoogste prioriteit (1-2) moeten hebben");
  }

  // Substitution should have priority 1-3
  if (substitutionControls.some((c) => c.priority > 3)) {
    warnings.push("Substitutie maatregelen zouden hoge prioriteit (1-3) moeten hebben");
  }

  // PPE should have lower priority (3-5)
  if (ppeControls.some((c) => c.priority < 3)) {
    warnings.push(
      "PBM (persoonlijke beschermingsmiddelen) zouden lagere prioriteit (3-5) moeten hebben volgens hiërarchie van beheersmaatregelen"
    );
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate template is ready for publication
 */
export function validateTemplateForPublication(template: {
  name: string;
  description: string;
  taskStepsTemplate: any[];
  status: string;
}): { valid: boolean; error?: string } {
  if (template.status !== "draft") {
    return {
      valid: false,
      error: "Alleen draft templates kunnen worden gepubliceerd",
    };
  }

  if (template.name.length < 5) {
    return {
      valid: false,
      error: "Template naam moet minimaal 5 karakters bevatten",
    };
  }

  if (template.description.length < 10) {
    return {
      valid: false,
      error: "Template beschrijving moet minimaal 10 karakters bevatten",
    };
  }

  if (template.taskStepsTemplate.length === 0) {
    return {
      valid: false,
      error: "Template moet minimaal één taakstap bevatten",
    };
  }

  // Check all steps have at least one hazard
  const stepsWithoutHazards = template.taskStepsTemplate.filter(
    (step) => !step.hazards || step.hazards.length === 0
  );

  if (stepsWithoutHazards.length > 0) {
    return {
      valid: false,
      error: `Alle taakstappen moeten minimaal één gevaar bevatten. Stap ${stepsWithoutHazards[0].stepNumber} heeft geen gevaren.`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize template data before saving
 */
export function sanitizeTemplateData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data } as any;

  // Trim string fields
  if ("name" in sanitized && typeof sanitized.name === "string") {
    sanitized.name = sanitized.name.trim();
  }
  if ("description" in sanitized && typeof sanitized.description === "string") {
    sanitized.description = sanitized.description.trim();
  }

  // Remove empty tags
  if ("tags" in sanitized && Array.isArray(sanitized.tags)) {
    sanitized.tags = sanitized.tags
      .filter((tag: string) => tag && tag.trim())
      .map((tag: string) => tag.trim());
  }

  // Ensure step numbers are sequential
  if ("taskStepsTemplate" in sanitized && Array.isArray(sanitized.taskStepsTemplate)) {
    sanitized.taskStepsTemplate = sanitized.taskStepsTemplate
      .sort((a: any, b: any) => a.stepNumber - b.stepNumber)
      .map((step: any, index: number) => ({
        ...step,
        stepNumber: index + 1, // Re-number sequentially
      }));
  }

  return sanitized as T;
}

/**
 * Type guard to check if value is valid IndustryCategory
 */
export function isValidIndustryCategory(value: string): boolean {
  return IndustryCategorySchema.safeParse(value).success;
}

/**
 * Type guard to check if value is valid HazardCategory
 */
export function isValidHazardCategory(value: string): boolean {
  return HazardCategorySchema.safeParse(value).success;
}

/**
 * Type guard to check if value is valid ControlMeasureType
 */
export function isValidControlMeasureType(value: string): boolean {
  return ControlMeasureTypeSchema.safeParse(value).success;
}
