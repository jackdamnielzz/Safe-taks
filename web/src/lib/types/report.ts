/**
 * Report Builder Type Definitions
 * Custom report builder with drag-and-drop interface
 */

import { Timestamp } from "firebase/firestore";
import type { TRAStatus, RiskLevel } from "./tra";
import type { LMRAAssessment } from "./lmra";

// ============================================================================
// REPORT SECTION TYPES
// ============================================================================

/**
 * Report section types
 */
export type ReportSectionType =
  | "executive_summary"
  | "kpi_widget"
  | "chart"
  | "data_table"
  | "tra_list"
  | "lmra_list"
  | "photo_gallery"
  | "text_block"
  | "risk_matrix"
  | "compliance_summary"
  | "page_break";

/**
 * Chart types for visualization
 */
export type ChartType = "line" | "bar" | "pie" | "donut" | "area" | "scatter" | "radar";

/**
 * Data source configuration
 */
export interface DataSourceConfig {
  type: "tras" | "lmras" | "users" | "projects" | "hazards";
  dateRange?: {
    from: Date;
    to: Date;
  };
  filters?: {
    projectIds?: string[];
    status?: TRAStatus[];
    riskLevels?: RiskLevel[];
    assessments?: LMRAAssessment[];
    userIds?: string[];
    tags?: string[];
  };
  sorting?: {
    field: string;
    direction: "asc" | "desc";
  };
  limit?: number;
}

/**
 * Chart configuration
 */
export interface ChartConfig {
  type: ChartType;
  dataSource: DataSourceConfig;
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  aggregation?: "count" | "sum" | "average" | "min" | "max";
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
}

/**
 * Table configuration
 */
export interface TableConfig {
  dataSource: DataSourceConfig;
  columns: {
    field: string;
    label: string;
    width?: string;
    format?: "text" | "date" | "number" | "currency" | "percentage";
  }[];
  showHeader?: boolean;
  striped?: boolean;
  bordered?: boolean;
}

/**
 * Report section base
 */
export interface ReportSectionBase {
  id: string;
  type: ReportSectionType;
  title?: string;
  order: number;
  width?: "full" | "half" | "third" | "two-thirds";
}

/**
 * Executive summary section
 */
export interface ExecutiveSummarySection extends ReportSectionBase {
  type: "executive_summary";
  content: string;
  highlights?: string[];
}

/**
 * KPI widget section
 */
export interface KPIWidgetSection extends ReportSectionBase {
  type: "kpi_widget";
  metric:
    | "tras_created"
    | "lmras_executed"
    | "avg_risk_score"
    | "compliance_rate"
    | "time_to_approval";
  period: "day" | "week" | "month" | "quarter" | "year";
  showTrend?: boolean;
  showComparison?: boolean;
}

/**
 * Chart section
 */
export interface ChartSection extends ReportSectionBase {
  type: "chart";
  config: ChartConfig;
}

/**
 * Data table section
 */
export interface DataTableSection extends ReportSectionBase {
  type: "data_table";
  config: TableConfig;
}

/**
 * TRA list section
 */
export interface TRAListSection extends ReportSectionBase {
  type: "tra_list";
  dataSource: DataSourceConfig;
  showDetails?: boolean;
  groupBy?: "project" | "status" | "risk_level";
}

/**
 * LMRA list section
 */
export interface LMRAListSection extends ReportSectionBase {
  type: "lmra_list";
  dataSource: DataSourceConfig;
  showDetails?: boolean;
  groupBy?: "project" | "assessment" | "date";
}

/**
 * Photo gallery section
 */
export interface PhotoGallerySection extends ReportSectionBase {
  type: "photo_gallery";
  photoIds: string[];
  columns?: 2 | 3 | 4;
  showCaptions?: boolean;
}

/**
 * Text block section
 */
export interface TextBlockSection extends ReportSectionBase {
  type: "text_block";
  content: string;
  format?: "plain" | "markdown" | "html";
}

/**
 * Risk matrix section
 */
export interface RiskMatrixSection extends ReportSectionBase {
  type: "risk_matrix";
  dataSource: DataSourceConfig;
  showLegend?: boolean;
}

/**
 * Compliance summary section
 */
export interface ComplianceSummarySection extends ReportSectionBase {
  type: "compliance_summary";
  framework: "vca" | "iso45001" | "both";
  dataSource: DataSourceConfig;
  showDetails?: boolean;
}

/**
 * Page break section
 */
export interface PageBreakSection extends ReportSectionBase {
  type: "page_break";
}

/**
 * Union type for all section types
 */
export type ReportSection =
  | ExecutiveSummarySection
  | KPIWidgetSection
  | ChartSection
  | DataTableSection
  | TRAListSection
  | LMRAListSection
  | PhotoGallerySection
  | TextBlockSection
  | RiskMatrixSection
  | ComplianceSummarySection
  | PageBreakSection;

// ============================================================================
// REPORT TEMPLATE
// ============================================================================

/**
 * Report template status
 */
export type ReportTemplateStatus = "draft" | "published" | "archived";

/**
 * Report template visibility
 */
export type ReportTemplateVisibility = "private" | "organization" | "shared";

/**
 * Report template
 */
export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;

  // Sections
  sections: ReportSection[];

  // Branding
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };

  // Metadata
  organizationId: string;
  visibility: ReportTemplateVisibility;
  status: ReportTemplateStatus;

  // Usage
  usageCount: number;
  lastUsedAt?: Timestamp | Date;

  // Audit
  createdBy: string;
  createdByName?: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  updatedBy?: string;

  // Flags
  isActive?: boolean;
  isFeatured?: boolean;
}

// ============================================================================
// GENERATED REPORT
// ============================================================================

/**
 * Report format
 */
export type ReportFormat = "pdf" | "excel" | "html" | "json";

/**
 * Report status
 */
export type ReportStatus = "generating" | "completed" | "failed";

/**
 * Generated report
 */
export interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;

  // Generation details
  format: ReportFormat;
  status: ReportStatus;

  // File details
  fileUrl?: string;
  fileSize?: number;
  fileName?: string;

  // Generation metadata
  generatedAt: Timestamp | Date;
  generatedBy: string;
  generatedByName?: string;

  // Data range
  dataStartDate?: Date;
  dataEndDate?: Date;

  // Organization
  organizationId: string;

  // Error details (if failed)
  error?: string;

  // Expiry (auto-delete after 30 days)
  expiresAt?: Timestamp | Date;
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Create report template request
 */
export interface CreateReportTemplateRequest {
  name: string;
  description?: string;
  sections: ReportSection[];
  branding?: ReportTemplate["branding"];
  visibility?: ReportTemplateVisibility;
}

/**
 * Update report template request
 */
export interface UpdateReportTemplateRequest {
  name?: string;
  description?: string;
  sections?: ReportSection[];
  branding?: ReportTemplate["branding"];
  visibility?: ReportTemplateVisibility;
  status?: ReportTemplateStatus;
}

/**
 * Generate report request
 */
export interface GenerateReportRequest {
  templateId: string;
  format: ReportFormat;
  dataStartDate?: Date;
  dataEndDate?: Date;
  customBranding?: ReportTemplate["branding"];
}

/**
 * Report preview request
 */
export interface ReportPreviewRequest {
  sections: ReportSection[];
  dataStartDate?: Date;
  dataEndDate?: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get section type display name
 */
export function getSectionTypeName(type: ReportSectionType): string {
  const names: Record<ReportSectionType, string> = {
    executive_summary: "Managementsamenvatting",
    kpi_widget: "KPI Widget",
    chart: "Grafiek",
    data_table: "Gegevenstabel",
    tra_list: "TRA Lijst",
    lmra_list: "LMRA Lijst",
    photo_gallery: "Fotogalerij",
    text_block: "Tekstblok",
    risk_matrix: "Risicomatrix",
    compliance_summary: "Compliance Samenvatting",
    page_break: "Pagina-einde",
  };
  return names[type];
}

/**
 * Get chart type display name
 */
export function getChartTypeName(type: ChartType): string {
  const names: Record<ChartType, string> = {
    line: "Lijngrafiek",
    bar: "Staafdiagram",
    pie: "Cirkeldiagram",
    donut: "Donutgrafiek",
    area: "Vlakgrafiek",
    scatter: "Spreidingsdiagram",
    radar: "Radargrafiek",
  };
  return names[type];
}

/**
 * Validate report section
 */
export function validateReportSection(section: ReportSection): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!section.id) errors.push("Section ID is required");
  if (!section.type) errors.push("Section type is required");
  if (section.order < 0) errors.push("Section order must be non-negative");

  // Type-specific validation
  switch (section.type) {
    case "chart":
      if (!section.config) errors.push("Chart configuration is required");
      if (section.config && !section.config.dataSource)
        errors.push("Data source is required for chart");
      break;
    case "data_table":
      if (!section.config) errors.push("Table configuration is required");
      if (section.config && !section.config.columns?.length)
        errors.push("At least one column is required");
      break;
    case "photo_gallery":
      if (!section.photoIds?.length) errors.push("At least one photo is required");
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create default section
 */
export function createDefaultSection(type: ReportSectionType, order: number): ReportSection {
  const baseSection: ReportSectionBase = {
    id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    order,
    width: "full",
  };

  switch (type) {
    case "executive_summary":
      return {
        ...baseSection,
        type: "executive_summary",
        title: "Managementsamenvatting",
        content: "",
        highlights: [],
      };
    case "kpi_widget":
      return {
        ...baseSection,
        type: "kpi_widget",
        title: "KPI Widget",
        metric: "tras_created",
        period: "month",
        showTrend: true,
        showComparison: true,
      };
    case "chart":
      return {
        ...baseSection,
        type: "chart",
        title: "Grafiek",
        config: {
          type: "bar",
          dataSource: {
            type: "tras",
          },
        },
      };
    case "text_block":
      return {
        ...baseSection,
        type: "text_block",
        title: "Tekstblok",
        content: "",
        format: "plain",
      };
    default:
      return baseSection as ReportSection;
  }
}
