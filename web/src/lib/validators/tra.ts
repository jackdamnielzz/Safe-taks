/**
 * TRA (Task Risk Analysis) Validation Schemas
 * Using Zod for runtime validation of TRA data
 */

import { z } from "zod";

// ============================================================================
// BASE VALIDATORS
// ============================================================================

/**
 * Kinney & Wiruth Effect Score validator
 */
export const EffectScoreSchema = z.union([
  z.literal(1),
  z.literal(3),
  z.literal(7),
  z.literal(15),
  z.literal(40),
  z.literal(100),
]);

/**
 * Kinney & Wiruth Exposure Score validator
 */
export const ExposureScoreSchema = z.union([
  z.literal(0.5),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(6),
  z.literal(10),
]);

/**
 * Kinney & Wiruth Probability Score validator
 */
export const ProbabilityScoreSchema = z.union([
  z.literal(0.1),
  z.literal(0.2),
  z.literal(0.5),
  z.literal(1),
  z.literal(3),
  z.literal(6),
  z.literal(10),
]);

/**
 * Risk Level validator
 */
export const RiskLevelSchema = z.enum([
  "trivial",
  "acceptable",
  "possible",
  "substantial",
  "high",
  "very_high",
]);

/**
 * Hazard Category validator
 */
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

/**
 * Control Measure Type validator
 */
export const ControlMeasureTypeSchema = z.enum([
  "elimination",
  "substitution",
  "engineering",
  "administrative",
  "ppe",
]);

/**
 * Implementation Status validator
 */
export const ImplementationStatusSchema = z.enum([
  "planned",
  "in_progress",
  "completed",
  "verified",
]);

/**
 * TRA Status validator
 */
export const TRAStatusSchema = z.enum([
  "draft",
  "submitted",
  "in_review",
  "approved",
  "rejected",
  "active",
  "expired",
  "archived",
]);

/**
 * Compliance Framework validator
 */
export const ComplianceFrameworkSchema = z.enum(["vca", "iso45001", "both"]);

/**
 * Hazard Source validator
 */
export const HazardSourceSchema = z.enum(["template", "library", "custom"]);

/**
 * Approval Step Status validator
 */
export const ApprovalStepStatusSchema = z.enum(["pending", "approved", "rejected", "skipped"]);

// ============================================================================
// COMPONENT VALIDATORS
// ============================================================================

/**
 * User Reference validator
 */
export const UserRefSchema = z.object({
  uid: z.string().min(1, "User ID is required"),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
});

/**
 * Control Measure validator
 */
export const ControlMeasureSchema = z.object({
  id: z.string().min(1),
  type: ControlMeasureTypeSchema,
  description: z
    .string()
    .min(10, "Control measure description must be at least 10 characters")
    .max(1000),
  responsiblePerson: z.string().optional(),
  responsiblePersonName: z.string().optional(),
  deadline: z.date().optional(),
  implementationStatus: ImplementationStatusSchema.optional(),
  verificationMethod: z.string().max(500).optional(),
  verifiedAt: z.date().optional(),
  verifiedBy: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Hazard validator
 */
export const HazardSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(10, "Hazard description must be at least 10 characters").max(1000),
  category: HazardCategorySchema,
  source: HazardSourceSchema,

  // Initial Risk Assessment
  effectScore: EffectScoreSchema,
  exposureScore: ExposureScoreSchema,
  probabilityScore: ProbabilityScoreSchema,
  riskScore: z.number().min(0),
  riskLevel: RiskLevelSchema,

  // Control Measures
  controlMeasures: z.array(ControlMeasureSchema).min(1, "At least one control measure is required"),

  // Residual Risk (optional)
  residualEffectScore: EffectScoreSchema.optional(),
  residualExposureScore: ExposureScoreSchema.optional(),
  residualProbabilityScore: ProbabilityScoreSchema.optional(),
  residualRiskScore: z.number().min(0).optional(),
  residualRiskLevel: RiskLevelSchema.optional(),

  // Metadata
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Task Step validator
 */
export const TaskStepSchema = z.object({
  stepNumber: z.number().int().positive("Step number must be positive"),
  description: z.string().min(10, "Task step description must be at least 10 characters").max(2000),
  duration: z.number().int().positive("Duration must be positive minutes").optional(),
  requiredPersonnel: z.number().int().positive("Required personnel must be positive").optional(),
  location: z.string().max(500).optional(),
  equipment: z.array(z.string()).optional(),

  // Hazards
  hazards: z.array(HazardSchema).min(1, "At least one hazard must be identified per task step"),

  // Notes
  notes: z.string().max(2000).optional(),
});

/**
 * Approval Step validator
 */
export const ApprovalStepSchema = z.object({
  stepNumber: z.number().int().nonnegative(),
  name: z.string().min(3).max(200),
  requiredRole: z.enum(["safety_manager", "supervisor", "admin"]),
  approvers: z.array(z.string()).min(1, "At least one approver is required"),
  status: ApprovalStepStatusSchema,

  // Approval details
  approvedBy: z.string().optional(),
  approvedByName: z.string().optional(),
  approvedAt: z.date().optional(),
  rejectedBy: z.string().optional(),
  rejectedByName: z.string().optional(),
  rejectedAt: z.date().optional(),
  comments: z.string().max(2000).optional(),
  digitalSignature: z.string().optional(),
});

/**
 * Approval Workflow validator
 */
export const ApprovalWorkflowSchema = z.object({
  steps: z.array(ApprovalStepSchema).min(1, "At least one approval step is required"),
  currentStep: z.number().int().nonnegative(),
  completedAt: z.date().optional(),
});

/**
 * Project Reference validator
 */
export const ProjectRefSchema = z.object({
  projectId: z.string().min(1),
  projectName: z.string().min(1),
  projectLocation: z.string().optional(),
});

// ============================================================================
// TRA VALIDATORS
// ============================================================================

/**
 * Create TRA Request validator
 */
export const CreateTRASchema = z
  .object({
    title: z.string().min(5, "Title must be at least 5 characters").max(200),
    description: z.string().max(5000).optional(),
    projectId: z.string().min(1, "Project ID is required"),
    templateId: z.string().optional(),
    taskSteps: z
      .array(
        z.object({
          stepNumber: z.number().int().positive(),
          description: z.string().min(10).max(2000),
          duration: z.number().int().positive().optional(),
          requiredPersonnel: z.number().int().positive().optional(),
          location: z.string().max(500).optional(),
          equipment: z.array(z.string()).optional(),
          notes: z.string().max(2000).optional(),
          hazards: z
            .array(
              z.object({
                description: z.string().min(10).max(1000),
                category: HazardCategorySchema,
                source: HazardSourceSchema.optional(),
                effectScore: EffectScoreSchema,
                exposureScore: ExposureScoreSchema,
                probabilityScore: ProbabilityScoreSchema,
                controlMeasures: z
                  .array(
                    z.object({
                      type: ControlMeasureTypeSchema,
                      description: z.string().min(10).max(1000),
                      responsiblePerson: z.string().optional(),
                      deadline: z.date().optional(),
                      implementationStatus: ImplementationStatusSchema.optional(),
                      verificationMethod: z.string().max(500).optional(),
                      notes: z.string().max(1000).optional(),
                    })
                  )
                  .min(1)
                  .optional(),
              })
            )
            .optional(),
        })
      )
      .min(1, "At least one task step is required"),
    teamMembers: z.array(z.string()).optional(),
    requiredCompetencies: z.array(z.string()).optional(),
    complianceFramework: ComplianceFrameworkSchema.optional(),
  })
  .refine(
    (data) => {
      // Validate that step numbers are sequential
      const stepNumbers = data.taskSteps.map((step) => step.stepNumber).sort((a, b) => a - b);
      for (let i = 0; i < stepNumbers.length; i++) {
        if (stepNumbers[i] !== i + 1) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Task step numbers must be sequential starting from 1",
      path: ["taskSteps"],
    }
  );

/**
 * Update TRA Request validator
 */
export const UpdateTRASchema = z
  .object({
    title: z.string().min(5).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    taskSteps: z.array(TaskStepSchema).optional(),
    teamMembers: z.array(z.string()).optional(),
    requiredCompetencies: z.array(z.string()).optional(),
    status: TRAStatusSchema.optional(),
    validFrom: z.date().nullable().optional(),
    validUntil: z.date().nullable().optional(),
  })
  .refine(
    (data) => {
      // Validate validity period (max 12 months for VCA compliance)
      if (data.validFrom && data.validUntil) {
        const validFrom =
          data.validFrom instanceof Date ? data.validFrom : new Date(data.validFrom);
        const validUntil =
          data.validUntil instanceof Date ? data.validUntil : new Date(data.validUntil);
        const monthsDiff =
          (validUntil.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsDiff <= 12;
      }
      return true;
    },
    {
      message: "TRA validity period cannot exceed 12 months (VCA compliance)",
      path: ["validUntil"],
    }
  );

/**
 * Submit TRA for Approval validator
 */
export const SubmitTRASchema = z.object({
  traId: z.string().min(1, "TRA ID is required"),
  comments: z.string().max(2000).optional(),
});

/**
 * Approval Decision validator
 */
export const ApprovalDecisionSchema = z.object({
  traId: z.string().min(1, "TRA ID is required"),
  stepNumber: z.number().int().nonnegative("Step number must be non-negative"),
  decision: z.enum(["approve", "reject"]),
  comments: z.string().max(2000).optional(),
  digitalSignature: z.string().optional(),
});

/**
 * TRA Filters validator (for list queries)
 */
export const TRAFiltersSchema = z.object({
  projectId: z.string().optional(),
  status: z.union([TRAStatusSchema, z.array(TRAStatusSchema)]).optional(),
  riskLevel: z.union([RiskLevelSchema, z.array(RiskLevelSchema)]).optional(),
  createdBy: z.string().optional(),
  validityStatus: z.enum(["valid", "expired", "expiring_soon", "all"]).optional(),
  templateId: z.string().optional(),
  searchQuery: z.string().max(200).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

/**
 * Add Hazard to Task Step validator
 */
export const AddHazardSchema = z.object({
  traId: z.string().min(1),
  stepNumber: z.number().int().positive(),
  hazard: z.object({
    description: z.string().min(10).max(1000),
    category: HazardCategorySchema,
    source: HazardSourceSchema,
    effectScore: EffectScoreSchema,
    exposureScore: ExposureScoreSchema,
    probabilityScore: ProbabilityScoreSchema,
    controlMeasures: z
      .array(
        z.object({
          type: ControlMeasureTypeSchema,
          description: z.string().min(10).max(1000),
          responsiblePerson: z.string().optional(),
          deadline: z.date().optional(),
          implementationStatus: ImplementationStatusSchema.optional(),
        })
      )
      .min(1, "At least one control measure is required"),
  }),
});

/**
 * Update Hazard validator
 */
export const UpdateHazardSchema = z.object({
  traId: z.string().min(1),
  stepNumber: z.number().int().positive(),
  hazardId: z.string().min(1),
  updates: z.object({
    description: z.string().min(10).max(1000).optional(),
    category: HazardCategorySchema.optional(),
    effectScore: EffectScoreSchema.optional(),
    exposureScore: ExposureScoreSchema.optional(),
    probabilityScore: ProbabilityScoreSchema.optional(),
    controlMeasures: z.array(ControlMeasureSchema).optional(),
    residualEffectScore: EffectScoreSchema.optional(),
    residualExposureScore: ExposureScoreSchema.optional(),
    residualProbabilityScore: ProbabilityScoreSchema.optional(),
  }),
});

/**
 * Add Control Measure validator
 */
export const AddControlMeasureSchema = z.object({
  traId: z.string().min(1),
  stepNumber: z.number().int().positive(),
  hazardId: z.string().min(1),
  controlMeasure: z.object({
    type: ControlMeasureTypeSchema,
    description: z.string().min(10).max(1000),
    responsiblePerson: z.string().optional(),
    deadline: z.date().optional(),
    implementationStatus: ImplementationStatusSchema.optional(),
    verificationMethod: z.string().max(500).optional(),
    notes: z.string().max(1000).optional(),
  }),
});

/**
 * Update Control Measure validator
 */
export const UpdateControlMeasureSchema = z.object({
  traId: z.string().min(1),
  stepNumber: z.number().int().positive(),
  hazardId: z.string().min(1),
  controlMeasureId: z.string().min(1),
  updates: z.object({
    description: z.string().min(10).max(1000).optional(),
    responsiblePerson: z.string().optional(),
    deadline: z.date().nullable().optional(),
    implementationStatus: ImplementationStatusSchema.optional(),
    verificationMethod: z.string().max(500).nullable().optional(),
    verifiedAt: z.date().nullable().optional(),
    verifiedBy: z.string().nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
  }),
});

// ============================================================================
// HELPER VALIDATORS
// ============================================================================

/**
 * Validate risk score calculation
 */
export function validateRiskScore(
  effect: number,
  exposure: number,
  probability: number,
  expectedScore: number
): boolean {
  const calculated = effect * exposure * probability;
  // Allow small floating point differences
  return Math.abs(calculated - expectedScore) < 0.01;
}

/**
 * Validate risk level matches score
 */
export function validateRiskLevel(score: number, level: string): boolean {
  if (score <= 20) return level === "trivial";
  if (score <= 70) return level === "acceptable";
  if (score <= 200) return level === "possible";
  if (score <= 400) return level === "substantial";
  if (score <= 1000) return level === "high";
  return level === "very_high";
}

/**
 * Validate VCA compliance - validity period max 12 months
 */
export function validateVCAValidityPeriod(validFrom: Date, validUntil: Date): boolean {
  const monthsDiff = (validUntil.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24 * 30);
  return monthsDiff <= 12;
}

/**
 * Validate sequential step numbers
 */
export function validateSequentialSteps(taskSteps: { stepNumber: number }[]): boolean {
  const stepNumbers = taskSteps.map((step) => step.stepNumber).sort((a, b) => a - b);
  for (let i = 0; i < stepNumbers.length; i++) {
    if (stepNumbers[i] !== i + 1) {
      return false;
    }
  }
  return true;
}
