/**
 * Comprehensive Audit Trail System
 * Immutable audit logs for compliance and security
 */

import { Timestamp } from "firebase/firestore";
import { initializeAdmin } from "../server-helpers";

// ============================================================================
// AUDIT EVENT TYPES
// ============================================================================

export type AuditEventType =
  // TRA Events
  | "tra_created"
  | "tra_updated"
  | "tra_deleted"
  | "tra_submitted"
  | "tra_approved"
  | "tra_rejected"
  | "tra_archived"
  // LMRA Events
  | "lmra_started"
  | "lmra_updated"
  | "lmra_completed"
  | "lmra_stop_work"
  // User Events
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "user_role_changed"
  | "user_login"
  | "user_logout"
  // Organization Events
  | "org_created"
  | "org_updated"
  | "org_member_added"
  | "org_member_removed"
  // Project Events
  | "project_created"
  | "project_updated"
  | "project_deleted"
  | "project_member_added"
  | "project_member_removed"
  // Template Events
  | "template_created"
  | "template_updated"
  | "template_published"
  | "template_archived"
  // Report Events
  | "report_generated"
  | "report_exported"
  // Compliance Events
  | "compliance_check"
  | "vca_validation"
  // Security Events
  | "permission_denied"
  | "suspicious_activity";

export type AuditSeverity = "info" | "warning" | "error" | "critical";

export type AuditCategory =
  | "tra"
  | "lmra"
  | "user"
  | "organization"
  | "project"
  | "template"
  | "report"
  | "compliance"
  | "security";

// ============================================================================
// AUDIT LOG INTERFACE
// ============================================================================

export interface AuditLog {
  id: string;

  // Event Details
  eventType: AuditEventType;
  category: AuditCategory;
  severity: AuditSeverity;

  // Actor (who performed the action)
  actorId: string;
  actorName?: string;
  actorRole?: string;
  actorEmail?: string;

  // Subject (what was affected)
  subjectType: "tra" | "lmra" | "user" | "organization" | "project" | "template" | "report";
  subjectId: string;
  subjectName?: string;

  // Context
  organizationId: string;
  projectId?: string;

  // Changes (for update events)
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  // Additional Data
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;

  // Timestamp (immutable)
  timestamp: Timestamp | Date;

  // Compliance
  complianceRelevant: boolean;
  retentionPeriod?: number; // Days to retain (default: 2555 = 7 years)
}

// ============================================================================
// AUDIT QUERY FILTERS
// ============================================================================

export interface AuditLogFilters {
  eventTypes?: AuditEventType[];
  categories?: AuditCategory[];
  severities?: AuditSeverity[];
  actorId?: string;
  subjectId?: string;
  subjectType?: string;
  organizationId?: string;
  projectId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  complianceRelevant?: boolean;
}

// ============================================================================
// AUDIT TRAIL SERVICE
// ============================================================================

export class AuditTrailService {
  /**
   * Write audit log entry (server-side only)
   */
  static async writeLog(log: Omit<AuditLog, "id" | "timestamp">): Promise<string> {
    const { firestore } = initializeAdmin();

    const auditLog: Omit<AuditLog, "id"> = {
      ...log,
      timestamp: Timestamp.now(),
      complianceRelevant: log.complianceRelevant ?? this.isComplianceRelevant(log.eventType),
      retentionPeriod: log.retentionPeriod ?? 2555, // 7 years default
    };

    const docRef = await firestore
      .collection("organizations")
      .doc(log.organizationId)
      .collection("auditLogs")
      .add(auditLog);

    return docRef.id;
  }

  /**
   * Query audit logs (server-side only)
   */
  static async queryLogs(
    organizationId: string,
    filters: AuditLogFilters,
    limit: number = 100
  ): Promise<AuditLog[]> {
    const { firestore } = initializeAdmin();

    let query = firestore
      .collection("organizations")
      .doc(organizationId)
      .collection("auditLogs")
      .orderBy("timestamp", "desc")
      .limit(limit);

    // Apply filters
    if (filters.eventTypes && filters.eventTypes.length > 0) {
      query = query.where("eventType", "in", filters.eventTypes) as any;
    }

    if (filters.categories && filters.categories.length > 0) {
      query = query.where("category", "in", filters.categories) as any;
    }

    if (filters.actorId) {
      query = query.where("actorId", "==", filters.actorId) as any;
    }

    if (filters.subjectId) {
      query = query.where("subjectId", "==", filters.subjectId) as any;
    }

    if (filters.projectId) {
      query = query.where("projectId", "==", filters.projectId) as any;
    }

    if (filters.complianceRelevant !== undefined) {
      query = query.where("complianceRelevant", "==", filters.complianceRelevant) as any;
    }

    const snapshot = await query.get();

    return snapshot.docs.map(
      (doc: any) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as AuditLog
    );
  }

  /**
   * Get audit trail for specific subject
   */
  static async getSubjectAuditTrail(
    organizationId: string,
    subjectType: string,
    subjectId: string
  ): Promise<AuditLog[]> {
    return this.queryLogs(organizationId, { subjectType, subjectId } as any, 1000);
  }

  /**
   * Export audit logs for compliance
   */
  static async exportComplianceLogs(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<AuditLog[]> {
    const { firestore } = initializeAdmin();

    const snapshot = await firestore
      .collection("organizations")
      .doc(organizationId)
      .collection("auditLogs")
      .where("complianceRelevant", "==", true)
      .where("timestamp", ">=", Timestamp.fromDate(dateFrom))
      .where("timestamp", "<=", Timestamp.fromDate(dateTo))
      .orderBy("timestamp", "desc")
      .get();

    return snapshot.docs.map(
      (doc: any) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as AuditLog
    );
  }

  /**
   * Determine if event type is compliance relevant
   */
  private static isComplianceRelevant(eventType: AuditEventType): boolean {
    const complianceEvents: AuditEventType[] = [
      "tra_created",
      "tra_updated",
      "tra_approved",
      "tra_rejected",
      "tra_archived",
      "lmra_completed",
      "lmra_stop_work",
      "user_role_changed",
      "compliance_check",
      "vca_validation",
      "report_generated",
    ];
    return complianceEvents.includes(eventType);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Log TRA creation
 */
export async function logTRACreated(params: {
  organizationId: string;
  traId: string;
  traTitle: string;
  actorId: string;
  actorName: string;
  projectId?: string;
}): Promise<string> {
  return AuditTrailService.writeLog({
    eventType: "tra_created",
    category: "tra",
    severity: "info",
    actorId: params.actorId,
    actorName: params.actorName,
    subjectType: "tra",
    subjectId: params.traId,
    subjectName: params.traTitle,
    organizationId: params.organizationId,
    projectId: params.projectId,
    complianceRelevant: true,
  });
}

/**
 * Log TRA approval
 */
export async function logTRAApproved(params: {
  organizationId: string;
  traId: string;
  traTitle: string;
  actorId: string;
  actorName: string;
  projectId?: string;
  comments?: string;
}): Promise<string> {
  return AuditTrailService.writeLog({
    eventType: "tra_approved",
    category: "tra",
    severity: "info",
    actorId: params.actorId,
    actorName: params.actorName,
    subjectType: "tra",
    subjectId: params.traId,
    subjectName: params.traTitle,
    organizationId: params.organizationId,
    projectId: params.projectId,
    metadata: { comments: params.comments },
    complianceRelevant: true,
  });
}

/**
 * Log LMRA stop work
 */
export async function logLMRAStopWork(params: {
  organizationId: string;
  lmraId: string;
  traId: string;
  actorId: string;
  actorName: string;
  reason: string;
  projectId?: string;
}): Promise<string> {
  return AuditTrailService.writeLog({
    eventType: "lmra_stop_work",
    category: "lmra",
    severity: "critical",
    actorId: params.actorId,
    actorName: params.actorName,
    subjectType: "lmra",
    subjectId: params.lmraId,
    organizationId: params.organizationId,
    projectId: params.projectId,
    metadata: {
      traId: params.traId,
      reason: params.reason,
    },
    complianceRelevant: true,
  });
}

/**
 * Log user role change
 */
export async function logUserRoleChanged(params: {
  organizationId: string;
  userId: string;
  userName: string;
  actorId: string;
  actorName: string;
  oldRole: string;
  newRole: string;
}): Promise<string> {
  return AuditTrailService.writeLog({
    eventType: "user_role_changed",
    category: "user",
    severity: "warning",
    actorId: params.actorId,
    actorName: params.actorName,
    subjectType: "user",
    subjectId: params.userId,
    subjectName: params.userName,
    organizationId: params.organizationId,
    changes: [
      {
        field: "role",
        oldValue: params.oldRole,
        newValue: params.newRole,
      },
    ],
    complianceRelevant: true,
  });
}

/**
 * Log VCA validation
 */
export async function logVCAValidation(params: {
  organizationId: string;
  traId: string;
  traTitle: string;
  actorId: string;
  actorName: string;
  score: number;
  isCompliant: boolean;
  issueCount: number;
}): Promise<string> {
  return AuditTrailService.writeLog({
    eventType: "vca_validation",
    category: "compliance",
    severity: params.isCompliant ? "info" : "warning",
    actorId: params.actorId,
    actorName: params.actorName,
    subjectType: "tra",
    subjectId: params.traId,
    subjectName: params.traTitle,
    organizationId: params.organizationId,
    metadata: {
      score: params.score,
      isCompliant: params.isCompliant,
      issueCount: params.issueCount,
    },
    complianceRelevant: true,
  });
}

/**
 * Log report generation
 */
export async function logReportGenerated(params: {
  organizationId: string;
  reportId: string;
  reportName: string;
  actorId: string;
  actorName: string;
  format: "pdf" | "excel";
  templateId?: string;
}): Promise<string> {
  return AuditTrailService.writeLog({
    eventType: "report_generated",
    category: "report",
    severity: "info",
    actorId: params.actorId,
    actorName: params.actorName,
    subjectType: "report",
    subjectId: params.reportId,
    subjectName: params.reportName,
    organizationId: params.organizationId,
    metadata: {
      format: params.format,
      templateId: params.templateId,
    },
    complianceRelevant: true,
  });
}

/**
 * Log permission denied
 */
export async function logPermissionDenied(params: {
  organizationId: string;
  actorId: string;
  actorName: string;
  attemptedAction: string;
  resourceType: string;
  resourceId: string;
  reason: string;
}): Promise<string> {
  return AuditTrailService.writeLog({
    eventType: "permission_denied",
    category: "security",
    severity: "warning",
    actorId: params.actorId,
    actorName: params.actorName,
    subjectType: params.resourceType as any,
    subjectId: params.resourceId,
    organizationId: params.organizationId,
    metadata: {
      attemptedAction: params.attemptedAction,
      reason: params.reason,
    },
    complianceRelevant: false,
  });
}

// ============================================================================
// AUDIT REPORT GENERATION
// ============================================================================

export interface AuditReport {
  organizationId: string;
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    totalEvents: number;
    byCategory: Record<AuditCategory, number>;
    bySeverity: Record<AuditSeverity, number>;
    complianceEvents: number;
    securityEvents: number;
  };
  criticalEvents: AuditLog[];
  userActivity: {
    userId: string;
    userName: string;
    eventCount: number;
    lastActivity: Date;
  }[];
  documentChanges: {
    subjectId: string;
    subjectName: string;
    changeCount: number;
    lastChanged: Date;
  }[];
}

/**
 * Generate audit report
 */
export async function generateAuditReport(
  organizationId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<AuditReport> {
  const logs = await AuditTrailService.exportComplianceLogs(organizationId, dateFrom, dateTo);

  // Calculate summary
  const byCategory: Record<AuditCategory, number> = {
    tra: 0,
    lmra: 0,
    user: 0,
    organization: 0,
    project: 0,
    template: 0,
    report: 0,
    compliance: 0,
    security: 0,
  };

  const bySeverity: Record<AuditSeverity, number> = {
    info: 0,
    warning: 0,
    error: 0,
    critical: 0,
  };

  logs.forEach((log) => {
    byCategory[log.category]++;
    bySeverity[log.severity]++;
  });

  // Get critical events
  const criticalEvents = logs.filter(
    (log) => log.severity === "critical" || log.severity === "error"
  );

  // Calculate user activity
  const userActivityMap = new Map<string, { name: string; count: number; lastActivity: Date }>();
  logs.forEach((log) => {
    const existing = userActivityMap.get(log.actorId);
    const timestamp =
      log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate();

    if (!existing || timestamp > existing.lastActivity) {
      userActivityMap.set(log.actorId, {
        name: log.actorName || log.actorId,
        count: (existing?.count || 0) + 1,
        lastActivity: timestamp,
      });
    } else {
      existing.count++;
    }
  });

  const userActivity = Array.from(userActivityMap.entries())
    .map(([userId, data]) => ({
      userId,
      userName: data.name,
      eventCount: data.count,
      lastActivity: data.lastActivity,
    }))
    .sort((a, b) => b.eventCount - a.eventCount);

  // Calculate document changes
  const documentChangesMap = new Map<string, { name: string; count: number; lastChanged: Date }>();
  logs
    .filter((log) => log.changes && log.changes.length > 0)
    .forEach((log) => {
      const existing = documentChangesMap.get(log.subjectId);
      const timestamp =
        log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate();

      if (!existing || timestamp > existing.lastChanged) {
        documentChangesMap.set(log.subjectId, {
          name: log.subjectName || log.subjectId,
          count: (existing?.count || 0) + 1,
          lastChanged: timestamp,
        });
      } else {
        existing.count++;
      }
    });

  const documentChanges = Array.from(documentChangesMap.entries())
    .map(([subjectId, data]) => ({
      subjectId,
      subjectName: data.name,
      changeCount: data.count,
      lastChanged: data.lastChanged,
    }))
    .sort((a, b) => b.changeCount - a.changeCount);

  return {
    organizationId,
    period: { from: dateFrom, to: dateTo },
    summary: {
      totalEvents: logs.length,
      byCategory,
      bySeverity,
      complianceEvents: logs.filter((l) => l.complianceRelevant).length,
      securityEvents: logs.filter((l) => l.category === "security").length,
    },
    criticalEvents,
    userActivity,
    documentChanges,
  };
}
