/**
 * TRA Template Type Definitions
 * Templates provide reusable risk assessment structures for common tasks
 * Based on FIRESTORE_DATA_MODEL.md TRATemplate specification
 */

import { Timestamp } from "firebase/firestore";
import type {
  HazardCategory,
  ControlMeasureType,
  ComplianceFramework,
  EffectScore,
  ExposureScore,
  ProbabilityScore,
} from "./tra";

// ============================================================================
// CORE ENUMS AND TYPES
// ============================================================================

/**
 * Industry categories for template classification
 */
export type IndustryCategory =
  | "construction" // General construction work
  | "electrical" // Electrical installations
  | "plumbing" // Plumbing and sanitation
  | "roofing" // Roofing work
  | "groundwork" // Excavation and foundations
  | "painting" // Painting and decoration
  | "industrial" // Industrial facilities
  | "offshore" // Offshore operations
  | "logistics" // Warehousing and transport
  | "maintenance" // General maintenance
  | "other"; // Other categories

/**
 * Template visibility and sharing options
 */
export type TemplateVisibility =
  | "organization" // Available to organization only
  | "system" // System-provided template
  | "shared"; // Shared across organizations (future)

/**
 * Template status
 */
export type TemplateStatus =
  | "draft" // Being created
  | "published" // Available for use
  | "archived"; // No longer active

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

/**
 * Recommended control measure within template
 */
export interface TemplateControlMeasure {
  type: ControlMeasureType;
  description: string;
  priority: number; // 1-5, lower is higher priority
  isRequired?: boolean; // Must be implemented
  estimatedCost?: string; // e.g., "Low", "Medium", "High"
  implementationTime?: string; // e.g., "Immediate", "< 1 week"
}

/**
 * Hazard definition within template
 */
export interface TemplateHazard {
  id: string; // Unique within template
  description: string;
  category: HazardCategory;

  // Typical risk scores (Kinney & Wiruth)
  typicalEffect: EffectScore;
  typicalExposure: ExposureScore;
  typicalProbability: ProbabilityScore;

  // Recommended controls
  recommendedControls: TemplateControlMeasure[];

  // Additional information
  legislationReference?: string; // e.g., "Arbowet artikel 3"
  vcaReference?: string; // VCA guideline reference
  notes?: string;
}

/**
 * Task step template with pre-configured hazards
 */
export interface TemplateTaskStep {
  stepNumber: number;
  description: string;
  duration?: number; // Estimated minutes
  requiredPersonnel?: number;
  equipment?: string[]; // Required equipment

  // Pre-configured hazards for this step
  hazards: TemplateHazard[];

  // Additional guidance
  safetyInstructions?: string;
  preparationNotes?: string;
}

/**
 * Version information for template
 */
export interface TemplateVersion {
  version: number;
  versionDate: Timestamp | Date;
  versionNotes?: string;
  changedBy: string; // User ID
  changedByName?: string; // Denormalized
}

// ============================================================================
// MAIN TEMPLATE INTERFACE
// ============================================================================

/**
 * TRA Template - Reusable risk assessment structure
 */
export interface TRATemplate {
  // Identity
  id: string;
  name: string;
  description: string;

  // Classification
  industryCategory: IndustryCategory;
  hazardCategories: HazardCategory[]; // Primary hazard types in this template
  tags?: string[]; // Searchable tags

  // Compliance
  complianceFramework: ComplianceFramework;
  vcaCertified: boolean;
  vcaVersion?: string; // e.g., "VCA 2017 v5.1"
  vcaCertificationDate?: Timestamp | Date;
  iso45001Compliant?: boolean;

  // Template Content
  taskStepsTemplate: TemplateTaskStep[];

  // Required Competencies
  requiredCompetencies?: string[]; // Required certifications/training

  // Template Metadata
  version: number;
  versionHistory?: TemplateVersion[];

  // Ownership & Visibility
  visibility: TemplateVisibility;
  isSystemTemplate: boolean; // System vs organization template
  organizationId: string; // Owner organization

  // Status
  status: TemplateStatus;
  publishedAt?: Timestamp | Date;
  archivedAt?: Timestamp | Date;

  // Usage Statistics
  usageCount: number; // Number of TRAs created from this template
  lastUsedAt?: Timestamp | Date;
  averageRating?: number; // User rating (1-5)

  // Metadata
  createdBy: string; // User ID
  createdByName?: string; // Denormalized
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  updatedBy?: string;

  // Language & Localization
  language: "nl" | "en"; // Template language

  // Flags
  isActive?: boolean; // Soft delete flag
  isFeatured?: boolean; // Featured in template gallery
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create Template Request
 */
export interface CreateTemplateRequest {
  name: string;
  description: string;
  industryCategory: IndustryCategory;
  hazardCategories: HazardCategory[];
  complianceFramework: ComplianceFramework;
  taskStepsTemplate: Omit<TemplateTaskStep, "hazards">[] & {
    hazards?: Partial<TemplateHazard>[];
  };
  requiredCompetencies?: string[];
  vcaCertified?: boolean;
  vcaVersion?: string;
  tags?: string[];
  language?: "nl" | "en";
}

/**
 * Update Template Request
 */
export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  industryCategory?: IndustryCategory;
  hazardCategories?: HazardCategory[];
  taskStepsTemplate?: TemplateTaskStep[];
  requiredCompetencies?: string[];
  vcaCertified?: boolean;
  vcaVersion?: string;
  tags?: string[];
  status?: TemplateStatus;
  versionNotes?: string;
}

/**
 * Template List Response (with pagination)
 */
export interface ListTemplatesResponse {
  items: TRATemplate[];
  nextCursor?: string;
  totalCount?: number;
  hasMore: boolean;
}

/**
 * Template Summary for lists/galleries
 */
export interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  industryCategory: IndustryCategory;
  hazardCategories: HazardCategory[];
  vcaCertified: boolean;
  usageCount: number;
  taskStepCount: number;
  hazardCount: number;
  averageRating?: number;
  isSystemTemplate: boolean;
  createdByName?: string;
  lastUsedAt?: Timestamp | Date;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Template Filter options for queries
 */
export interface TemplateFilters {
  industryCategory?: IndustryCategory | IndustryCategory[];
  hazardCategory?: HazardCategory | HazardCategory[];
  vcaCertified?: boolean;
  complianceFramework?: ComplianceFramework;
  status?: TemplateStatus;
  visibility?: TemplateVisibility;
  searchQuery?: string;
  tags?: string[];
  language?: "nl" | "en";
}

/**
 * Template Statistics
 */
export interface TemplateStatistics {
  totalTemplates: number;
  byIndustry: Record<IndustryCategory, number>;
  byStatus: Record<TemplateStatus, number>;
  vcaCertifiedCount: number;
  systemTemplateCount: number;
  organizationTemplateCount: number;
  mostUsedTemplates: TemplateSummary[];
  recentlyCreated: TemplateSummary[];
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if template can be edited
 */
export function canEditTemplate(template: TRATemplate, userRole: string): boolean {
  // System templates cannot be edited
  if (template.isSystemTemplate) {
    return false;
  }

  // Only admins and safety managers can edit
  return userRole === "admin" || userRole === "safety_manager";
}

/**
 * Check if template can be deleted
 */
export function canDeleteTemplate(template: TRATemplate, userRole: string): boolean {
  // System templates cannot be deleted
  if (template.isSystemTemplate) {
    return false;
  }

  // Cannot delete if in use
  if (template.usageCount > 0) {
    return false;
  }

  // Only admins can delete
  return userRole === "admin";
}

/**
 * Check if template is ready for publication
 */
export function canPublishTemplate(template: TRATemplate): boolean {
  return (
    template.status === "draft" &&
    template.taskStepsTemplate.length > 0 &&
    template.taskStepsTemplate.every((step) => step.hazards.length > 0) &&
    template.name.length >= 5 &&
    template.description.length >= 10
  );
}

/**
 * Count total hazards in template
 */
export function getTemplateHazardCount(template: TRATemplate): number {
  return template.taskStepsTemplate.reduce((count, step) => count + step.hazards.length, 0);
}

/**
 * Get hazards grouped by category
 */
export function groupTemplateHazardsByCategory(
  template: TRATemplate
): Record<HazardCategory, number> {
  const grouped: Record<HazardCategory, number> = {
    electrical: 0,
    mechanical: 0,
    chemical: 0,
    biological: 0,
    physical: 0,
    ergonomic: 0,
    psychosocial: 0,
    fire_explosion: 0,
    environmental: 0,
    other: 0,
  };

  for (const step of template.taskStepsTemplate) {
    for (const hazard of step.hazards) {
      grouped[hazard.category]++;
    }
  }

  return grouped;
}

/**
 * Get industry category display name (Dutch)
 */
export function getIndustryCategoryName(category: IndustryCategory): string {
  const names: Record<IndustryCategory, string> = {
    construction: "Bouw & Constructie",
    electrical: "Elektrotechniek",
    plumbing: "Loodgieterswerk",
    roofing: "Dakwerkzaamheden",
    groundwork: "Grondwerk & Funderingen",
    painting: "Schilderwerk",
    industrial: "Industrieel",
    offshore: "Offshore",
    logistics: "Logistiek",
    maintenance: "Onderhoud",
    other: "Overig",
  };
  return names[category];
}

/**
 * Generate template from TRA (create template from existing TRA)
 */
export function createTemplateFromTRA(
  tra: any, // TRA type
  templateName: string,
  templateDescription: string
): CreateTemplateRequest {
  return {
    name: templateName,
    description: templateDescription,
    industryCategory: "construction", // Default, should be selected by user
    hazardCategories: [], // Extract from TRA hazards
    complianceFramework: tra.complianceFramework || "vca",
    taskStepsTemplate: tra.taskSteps.map((step: any) => ({
      stepNumber: step.stepNumber,
      description: step.description,
      duration: step.duration,
      requiredPersonnel: step.requiredPersonnel,
      equipment: step.equipment,
      hazards: step.hazards.map((hazard: any) => ({
        id: hazard.id,
        description: hazard.description,
        category: hazard.category,
        typicalEffect: hazard.effectScore,
        typicalExposure: hazard.exposureScore,
        typicalProbability: hazard.probabilityScore,
        recommendedControls: hazard.controlMeasures.map((control: any) => ({
          type: control.type,
          description: control.description,
          priority: 3, // Default medium priority
        })),
      })),
    })),
    requiredCompetencies: tra.requiredCompetencies,
  };
}

/**
 * Clone template for customization
 */
export function cloneTemplate(
  template: TRATemplate,
  newName: string,
  organizationId: string,
  userId: string
): Partial<TRATemplate> {
  return {
    name: newName,
    description: `Gebaseerd op: ${template.name}`,
    industryCategory: template.industryCategory,
    hazardCategories: [...template.hazardCategories],
    complianceFramework: template.complianceFramework,
    taskStepsTemplate: JSON.parse(JSON.stringify(template.taskStepsTemplate)),
    requiredCompetencies: template.requiredCompetencies ? [...template.requiredCompetencies] : [],
    vcaCertified: false, // Cloned templates need re-certification
    visibility: "organization",
    isSystemTemplate: false,
    organizationId,
    status: "draft",
    version: 1,
    usageCount: 0,
    createdBy: userId,
    language: template.language,
  };
}
