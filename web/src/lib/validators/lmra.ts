/**
 * LMRA Validation Schemas using Zod
 * Validates LMRA session data for API routes
 */

import { z } from "zod";

// ============================================================================
// COMPONENT SCHEMAS
// ============================================================================

/**
 * Location verification schema
 */
export const LocationVerificationSchema = z.object({
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  accuracy: z.number().min(0).max(1000), // meters
  verificationStatus: z.enum(["verified", "approximate", "manual_override"]),
  manualOverrideReason: z.string().optional(),
});

/**
 * Weather conditions schema
 */
export const WeatherConditionsSchema = z.object({
  temperature: z.number().min(-50).max(60), // Celsius
  humidity: z.number().min(0).max(100),
  windSpeed: z.number().min(0).max(200), // km/h
  visibility: z.number().min(0).max(50), // km
  conditions: z.string().min(1).max(100),
  description: z.string().optional(),
  apiSource: z.string().min(1).max(50),
  iconCode: z.string().optional(),
});

/**
 * Environmental check schema
 */
export const EnvironmentalCheckSchema = z.object({
  checkType: z.string().min(1).max(100),
  required: z.boolean(),
  status: z.enum(["pass", "fail", "caution", "not_applicable"]),
  measurement: z.string().optional(),
  notes: z.string().max(500).optional(),
  photoURL: z.string().url().optional(),
});

/**
 * Competency validation schema
 */
export const CompetencyValidationSchema = z.object({
  competencyName: z.string().min(1).max(200),
  status: z.enum(["valid", "expiring_soon", "expired", "missing"]),
  expiryDate: z.date().optional(),
  certificateNumber: z.string().optional(),
});

/**
 * Personnel check schema
 */
export const PersonnelCheckSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().optional(),
  competenciesVerified: z.boolean(),
  competencyStatus: z.array(CompetencyValidationSchema),
  checkedIn: z.boolean(),
  checkInTime: z.date(),
  digitalSignature: z.string().optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Equipment check schema
 */
export const EquipmentCheckSchema = z.object({
  equipmentName: z.string().min(1).max(200),
  equipmentId: z.string().optional(),
  required: z.boolean(),
  available: z.boolean(),
  condition: z.enum(["good", "acceptable", "damaged", "expired"]),
  inspectionDate: z.date().optional(),
  qrCode: z.string().optional(),
  photoURL: z.string().url().optional(),
  notes: z.string().max(500).optional(),
  checkedBy: z.string().optional(),
});

/**
 * LMRA photo schema
 */
export const LMRAPhotoSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  thumbnailURL: z.string().url().optional(),
  category: z.enum(["work_area", "equipment", "hazard", "team", "environmental", "other"]),
  caption: z.string().max(200).optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  takenAt: z.date(),
  takenBy: z.string().min(1),
  uploadStatus: z.enum(["pending", "uploaded", "failed"]).optional(),
});

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

/**
 * Create LMRA Session Request Schema
 */
export const CreateLMRARequestSchema = z.object({
  traId: z.string().min(1, "TRA ID is required"),
  projectId: z.string().min(1, "Project ID is required"),
  teamMembers: z.array(z.string().min(1)).min(1, "At least one team member is required"),
  location: LocationVerificationSchema,
});

/**
 * Update LMRA Session Request Schema
 */
export const UpdateLMRARequestSchema = z.object({
  weatherConditions: WeatherConditionsSchema.optional(),
  environmentalChecks: z.array(EnvironmentalCheckSchema).optional(),
  personnelChecks: z.array(PersonnelCheckSchema).optional(),
  equipmentChecks: z.array(EquipmentCheckSchema).optional(),
  photos: z.array(LMRAPhotoSchema).optional(),
  overallAssessment: z.enum(["safe_to_proceed", "proceed_with_caution", "stop_work"]).optional(),
  stopWorkReason: z.string().max(1000).optional(),
  additionalHazards: z.string().max(1000).optional(),
  comments: z.string().max(2000).optional(),
});

/**
 * Complete LMRA Session Request Schema
 */
export const CompleteLMRARequestSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  overallAssessment: z.enum(["safe_to_proceed", "proceed_with_caution", "stop_work"]),
  comments: z.string().max(2000).optional(),
  digitalSignature: z.string().optional(),
});

/**
 * Stop Work Request Schema
 */
export const StopWorkRequestSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(1000),
  triggeredBy: z.string().min(1, "Triggered by user ID is required"),
});

/**
 * LMRA Filters Schema
 */
export const LMRAFiltersSchema = z.object({
  traId: z.string().optional(),
  projectId: z.string().optional(),
  performedBy: z.string().optional(),
  overallAssessment: z
    .union([
      z.enum(["safe_to_proceed", "proceed_with_caution", "stop_work"]),
      z.array(z.enum(["safe_to_proceed", "proceed_with_caution", "stop_work"])),
    ])
    .optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  syncStatus: z.enum(["synced", "pending_sync", "sync_failed"]).optional(),
  hasStopWork: z.boolean().optional(),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate location accuracy is acceptable
 */
export function validateLocationAccuracy(accuracy: number, requiredAccuracy: number = 20): boolean {
  return accuracy <= requiredAccuracy;
}

/**
 * Validate all required environmental checks are completed
 */
export function validateEnvironmentalChecks(checks: z.infer<typeof EnvironmentalCheckSchema>[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const requiredChecks = checks.filter((c) => c.required);

  if (requiredChecks.length === 0) {
    errors.push("At least one environmental check must be marked as required");
  }

  const failedChecks = requiredChecks.filter((c) => c.status === "fail");
  if (failedChecks.length > 0) {
    errors.push(`${failedChecks.length} required environmental check(s) failed`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate personnel competencies
 */
export function validatePersonnelCompetencies(checks: z.infer<typeof PersonnelCheckSchema>[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (checks.length === 0) {
    errors.push("At least one personnel check is required");
  }

  const notCheckedIn = checks.filter((c) => !c.checkedIn);
  if (notCheckedIn.length > 0) {
    errors.push(`${notCheckedIn.length} team member(s) not checked in`);
  }

  const unverifiedCompetencies = checks.filter((c) => !c.competenciesVerified);
  if (unverifiedCompetencies.length > 0) {
    errors.push(`${unverifiedCompetencies.length} team member(s) have unverified competencies`);
  }

  // Check for expired competencies
  const expiredCompetencies = checks.flatMap((check) =>
    check.competencyStatus.filter((comp) => comp.status === "expired")
  );
  if (expiredCompetencies.length > 0) {
    errors.push(`${expiredCompetencies.length} expired competenc(y/ies) detected`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate equipment availability and condition
 */
export function validateEquipmentChecks(checks: z.infer<typeof EquipmentCheckSchema>[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const requiredEquipment = checks.filter((c) => c.required);

  if (requiredEquipment.length === 0) {
    errors.push("At least one equipment check must be marked as required");
  }

  const unavailableEquipment = requiredEquipment.filter((c) => !c.available);
  if (unavailableEquipment.length > 0) {
    errors.push(`${unavailableEquipment.length} required equipment item(s) not available`);
  }

  const damagedEquipment = requiredEquipment.filter(
    (c) => c.available && (c.condition === "damaged" || c.condition === "expired")
  );
  if (damagedEquipment.length > 0) {
    errors.push(`${damagedEquipment.length} equipment item(s) in damaged or expired condition`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate LMRA session can be completed
 */
export function validateLMRACompletion(session: {
  location?: any;
  weatherConditions?: any;
  environmentalChecks?: any[];
  personnelChecks?: any[];
  equipmentChecks?: any[];
  overallAssessment?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!session.location) {
    errors.push("Location verification is required");
  }

  if (!session.environmentalChecks || session.environmentalChecks.length === 0) {
    errors.push("Environmental checks are required");
  } else {
    const envValidation = validateEnvironmentalChecks(session.environmentalChecks);
    errors.push(...envValidation.errors);
  }

  if (!session.personnelChecks || session.personnelChecks.length === 0) {
    errors.push("Personnel checks are required");
  } else {
    const personnelValidation = validatePersonnelCompetencies(session.personnelChecks);
    errors.push(...personnelValidation.errors);
  }

  if (!session.equipmentChecks || session.equipmentChecks.length === 0) {
    errors.push("Equipment checks are required");
  } else {
    const equipmentValidation = validateEquipmentChecks(session.equipmentChecks);
    errors.push(...equipmentValidation.errors);
  }

  if (!session.overallAssessment) {
    errors.push("Overall assessment is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate weather conditions are within safe working limits
 */
export function validateWeatherConditions(
  weather: z.infer<typeof WeatherConditionsSchema>,
  limits?: {
    maxWindSpeed?: number;
    minVisibility?: number;
    maxTemperature?: number;
    minTemperature?: number;
  }
): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const defaultLimits = {
    maxWindSpeed: 40, // km/h
    minVisibility: 1, // km
    maxTemperature: 40, // °C
    minTemperature: -10, // °C
    ...limits,
  };

  if (weather.windSpeed > defaultLimits.maxWindSpeed) {
    warnings.push(
      `High wind speed: ${weather.windSpeed} km/h (limit: ${defaultLimits.maxWindSpeed} km/h)`
    );
  }

  if (weather.visibility < defaultLimits.minVisibility) {
    warnings.push(
      `Low visibility: ${weather.visibility} km (minimum: ${defaultLimits.minVisibility} km)`
    );
  }

  if (weather.temperature > defaultLimits.maxTemperature) {
    warnings.push(
      `High temperature: ${weather.temperature}°C (limit: ${defaultLimits.maxTemperature}°C)`
    );
  }

  if (weather.temperature < defaultLimits.minTemperature) {
    warnings.push(
      `Low temperature: ${weather.temperature}°C (minimum: ${defaultLimits.minTemperature}°C)`
    );
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}
