/**
 * Firebase Performance Monitoring Integration
 *
 * Provides comprehensive performance tracking for SafeWork Pro including:
 * - Custom traces for critical operations (TRA creation, LMRA execution, report generation)
 * - Web Vitals tracking (LCP, FID, CLS, FCP, TTFB)
 * - Automatic page load monitoring
 * - Network request tracking
 * - Custom metrics and attributes
 *
 * @see https://firebase.google.com/docs/perf-mon
 */

import { getPerformance, trace } from "firebase/performance";
import type { PerformanceTrace } from "firebase/performance";
import { performance as firebasePerformance } from "@/lib/firebase";

/**
 * Custom trace names for critical operations
 */
export const TRACE_NAMES = {
  // TRA Operations
  TRA_CREATE: "tra_create",
  TRA_LOAD: "tra_load",
  TRA_UPDATE: "tra_update",
  TRA_APPROVE: "tra_approve",
  TRA_EXPORT_PDF: "tra_export_pdf",

  // LMRA Operations
  LMRA_START: "lmra_start",
  LMRA_EXECUTE: "lmra_execute",
  LMRA_COMPLETE: "lmra_complete",
  LMRA_STOP_WORK: "lmra_stop_work",

  // Report Generation
  REPORT_GENERATE_PDF: "report_generate_pdf",
  REPORT_GENERATE_EXCEL: "report_generate_excel",
  REPORT_LOAD_DATA: "report_load_data",

  // Dashboard Operations
  DASHBOARD_LOAD: "dashboard_load",
  ANALYTICS_LOAD: "analytics_load",
  KPI_CALCULATE: "kpi_calculate",

  // Search Operations
  SEARCH_TRAS: "search_tras",
  SEARCH_HAZARDS: "search_hazards",

  // File Operations
  FILE_UPLOAD: "file_upload",
  IMAGE_COMPRESS: "image_compress",
  PHOTO_CAPTURE: "photo_capture",
} as const;

/**
 * Custom metric names
 */
export const METRIC_NAMES = {
  TRA_STEPS_COUNT: "tra_steps_count",
  LMRA_DURATION: "lmra_duration_ms",
  REPORT_SIZE: "report_size_kb",
  SEARCH_RESULTS: "search_results_count",
  FILE_SIZE: "file_size_kb",
  CACHE_HIT_RATE: "cache_hit_rate",
} as const;

/**
 * Custom attribute names
 */
export const ATTRIBUTE_NAMES = {
  USER_ROLE: "user_role",
  ORG_ID: "org_id",
  PROJECT_ID: "project_id",
  TRA_STATUS: "tra_status",
  LMRA_ASSESSMENT: "lmra_assessment",
  REPORT_TYPE: "report_type",
  NETWORK_TYPE: "network_type",
  DEVICE_TYPE: "device_type",
} as const;

/**
 * Start a custom trace for performance monitoring
 */
export function startTrace(traceName: string): PerformanceTrace | null {
  if (!firebasePerformance) {
    console.warn("Performance monitoring not initialized");
    return null;
  }

  try {
    const customTrace = trace(firebasePerformance, traceName);
    customTrace.start();
    return customTrace;
  } catch (error) {
    console.error(`Failed to start trace ${traceName}:`, error);
    return null;
  }
}

/**
 * Stop a custom trace and record metrics
 */
export function stopTrace(customTrace: PerformanceTrace | null): void {
  if (!customTrace) return;

  try {
    customTrace.stop();
  } catch (error) {
    console.error("Failed to stop trace:", error);
  }
}

/**
 * Add a custom metric to a trace
 */
export function putMetric(
  customTrace: PerformanceTrace | null,
  metricName: string,
  value: number
): void {
  if (!customTrace) return;

  try {
    customTrace.putMetric(metricName, value);
  } catch (error) {
    console.error(`Failed to put metric ${metricName}:`, error);
  }
}

/**
 * Add a custom attribute to a trace
 */
export function putAttribute(
  customTrace: PerformanceTrace | null,
  attributeName: string,
  value: string
): void {
  if (!customTrace) return;

  try {
    customTrace.putAttribute(attributeName, value);
  } catch (error) {
    console.error(`Failed to put attribute ${attributeName}:`, error);
  }
}

/**
 * Increment a metric value on a trace
 */
export function incrementMetric(
  customTrace: PerformanceTrace | null,
  metricName: string,
  incrementBy: number = 1
): void {
  if (!customTrace) return;

  try {
    customTrace.incrementMetric(metricName, incrementBy);
  } catch (error) {
    console.error(`Failed to increment metric ${metricName}:`, error);
  }
}

/**
 * Track TRA creation performance
 */
export async function trackTRACreation<T>(
  operation: () => Promise<T>,
  metadata?: {
    stepsCount?: number;
    status?: string;
    projectId?: string;
    userRole?: string;
  }
): Promise<T> {
  const customTrace = startTrace(TRACE_NAMES.TRA_CREATE);

  if (metadata) {
    if (metadata.stepsCount)
      putMetric(customTrace, METRIC_NAMES.TRA_STEPS_COUNT, metadata.stepsCount);
    if (metadata.status) putAttribute(customTrace, ATTRIBUTE_NAMES.TRA_STATUS, metadata.status);
    if (metadata.projectId)
      putAttribute(customTrace, ATTRIBUTE_NAMES.PROJECT_ID, metadata.projectId);
    if (metadata.userRole) putAttribute(customTrace, ATTRIBUTE_NAMES.USER_ROLE, metadata.userRole);
  }

  try {
    const result = await operation();
    stopTrace(customTrace);
    return result;
  } catch (error) {
    stopTrace(customTrace);
    throw error;
  }
}

/**
 * Track LMRA execution performance
 */
export async function trackLMRAExecution<T>(
  operation: () => Promise<T>,
  metadata?: {
    duration?: number;
    assessment?: string;
    projectId?: string;
    userRole?: string;
  }
): Promise<T> {
  const customTrace = startTrace(TRACE_NAMES.LMRA_EXECUTE);

  if (metadata) {
    if (metadata.duration) putMetric(customTrace, METRIC_NAMES.LMRA_DURATION, metadata.duration);
    if (metadata.assessment)
      putAttribute(customTrace, ATTRIBUTE_NAMES.LMRA_ASSESSMENT, metadata.assessment);
    if (metadata.projectId)
      putAttribute(customTrace, ATTRIBUTE_NAMES.PROJECT_ID, metadata.projectId);
    if (metadata.userRole) putAttribute(customTrace, ATTRIBUTE_NAMES.USER_ROLE, metadata.userRole);
  }

  try {
    const result = await operation();
    stopTrace(customTrace);
    return result;
  } catch (error) {
    stopTrace(customTrace);
    throw error;
  }
}

/**
 * Track report generation performance
 */
export async function trackReportGeneration<T>(
  operation: () => Promise<T>,
  metadata?: {
    reportType?: string;
    sizeKB?: number;
    userRole?: string;
  }
): Promise<T> {
  const customTrace = startTrace(TRACE_NAMES.REPORT_GENERATE_PDF);

  if (metadata) {
    if (metadata.reportType)
      putAttribute(customTrace, ATTRIBUTE_NAMES.REPORT_TYPE, metadata.reportType);
    if (metadata.sizeKB) putMetric(customTrace, METRIC_NAMES.REPORT_SIZE, metadata.sizeKB);
    if (metadata.userRole) putAttribute(customTrace, ATTRIBUTE_NAMES.USER_ROLE, metadata.userRole);
  }

  try {
    const result = await operation();
    stopTrace(customTrace);
    return result;
  } catch (error) {
    stopTrace(customTrace);
    throw error;
  }
}

/**
 * Track dashboard load performance
 */
export async function trackDashboardLoad<T>(
  operation: () => Promise<T>,
  metadata?: {
    userRole?: string;
    orgId?: string;
  }
): Promise<T> {
  const customTrace = startTrace(TRACE_NAMES.DASHBOARD_LOAD);

  if (metadata) {
    if (metadata.userRole) putAttribute(customTrace, ATTRIBUTE_NAMES.USER_ROLE, metadata.userRole);
    if (metadata.orgId) putAttribute(customTrace, ATTRIBUTE_NAMES.ORG_ID, metadata.orgId);
  }

  try {
    const result = await operation();
    stopTrace(customTrace);
    return result;
  } catch (error) {
    stopTrace(customTrace);
    throw error;
  }
}

/**
 * Track file upload performance
 */
export async function trackFileUpload<T>(
  operation: () => Promise<T>,
  metadata?: {
    fileSizeKB?: number;
    fileType?: string;
  }
): Promise<T> {
  const customTrace = startTrace(TRACE_NAMES.FILE_UPLOAD);

  if (metadata) {
    if (metadata.fileSizeKB) putMetric(customTrace, METRIC_NAMES.FILE_SIZE, metadata.fileSizeKB);
    if (metadata.fileType) putAttribute(customTrace, "file_type", metadata.fileType);
  }

  try {
    const result = await operation();
    stopTrace(customTrace);
    return result;
  } catch (error) {
    stopTrace(customTrace);
    throw error;
  }
}

/**
 * Web Vitals tracking
 * Integrates with Vercel Analytics and Firebase Performance Monitoring
 */
export interface WebVitalsMetric {
  id: string;
  name: "FCP" | "LCP" | "CLS" | "FID" | "TTFB" | "INP";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  navigationType: "navigate" | "reload" | "back-forward" | "back-forward-cache" | "prerender";
}

/**
 * Report Web Vitals to Firebase Performance Monitoring
 */
export function reportWebVitals(metric: WebVitalsMetric): void {
  if (!firebasePerformance) return;

  try {
    // Create a custom trace for the Web Vital
    const customTrace = trace(firebasePerformance, `web_vital_${metric.name.toLowerCase()}`);
    customTrace.start();

    // Add metric value
    customTrace.putMetric("value", Math.round(metric.value));

    // Add attributes
    customTrace.putAttribute("rating", metric.rating);
    customTrace.putAttribute("navigation_type", metric.navigationType);

    // Stop immediately as this is a point-in-time measurement
    customTrace.stop();

    // Log for debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        navigationType: metric.navigationType,
      });
    }
  } catch (error) {
    console.error(`Failed to report Web Vital ${metric.name}:`, error);
  }
}

/**
 * Get performance thresholds from performance-budgets.json
 */
export const PERFORMANCE_THRESHOLDS = {
  pageLoad: 2000, // 2s
  apiResponse: 500, // 500ms
  fcp: 1800, // 1.8s
  lcp: 2500, // 2.5s
  fid: 100, // 100ms
  cls: 0.1, // 0.1
  ttfb: 800, // 800ms
} as const;

/**
 * Check if a metric meets performance threshold
 */
export function meetsThreshold(
  metricName: keyof typeof PERFORMANCE_THRESHOLDS,
  value: number
): boolean {
  const threshold = PERFORMANCE_THRESHOLDS[metricName];
  return value <= threshold;
}

/**
 * Performance monitoring utilities
 */
export const PerformanceMonitoring = {
  startTrace,
  stopTrace,
  putMetric,
  putAttribute,
  incrementMetric,
  trackTRACreation,
  trackLMRAExecution,
  trackReportGeneration,
  trackDashboardLoad,
  trackFileUpload,
  reportWebVitals,
  meetsThreshold,
  TRACE_NAMES,
  METRIC_NAMES,
  ATTRIBUTE_NAMES,
  PERFORMANCE_THRESHOLDS,
};

export default PerformanceMonitoring;
