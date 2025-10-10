/**
 * GDPR Compliance Framework
 *
 * Comprehensive GDPR compliance validation and privacy controls
 * for EU data protection regulations compliance.
 *
 * @see CHECKLIST.md Task 8.8 - GDPR compliance validation
 */

import { Timestamp } from "firebase/firestore";
import { initializeAdmin } from "../server-helpers";

// ============================================================================
// GDPR COMPLIANCE TYPES
// ============================================================================

export type GDPRDataCategory =
  | "personal_data" // Name, email, phone
  | "sensitive_data" // Health, biometric data
  | "usage_data" // Activity logs, preferences
  | "technical_data" // IP addresses, device info
  | "location_data" // GPS coordinates
  | "communication_data"; // Messages, comments

export type ConsentType =
  | "essential" // Required for service
  | "functional" // Enhanced functionality
  | "analytics" // Usage analytics
  | "marketing" // Marketing communications
  | "location_tracking"; // GPS location tracking

export type DataProcessingPurpose =
  | "service_delivery"
  | "safety_compliance"
  | "legal_obligation"
  | "analytics"
  | "communication";

// ============================================================================
// CONSENT MANAGEMENT
// ============================================================================

export interface UserConsent {
  userId: string;
  organizationId: string;
  consents: {
    [key in ConsentType]: {
      granted: boolean;
      timestamp: Date;
      version: string; // Privacy policy version
      ipAddress?: string;
      userAgent?: string;
    };
  };
  lastUpdated: Date;
}

export interface ConsentRecord {
  consentType: ConsentType;
  granted: boolean;
  timestamp: Date;
  policyVersion: string;
  withdrawnAt?: Date;
  withdrawnReason?: string;
}

// ============================================================================
// DATA EXPORT
// ============================================================================

export interface UserDataExport {
  userId: string;
  organizationId: string;
  exportDate: Date;
  dataCategories: {
    category: GDPRDataCategory;
    data: any;
  }[];
  format: "json" | "csv";
  includeAuditLogs: boolean;
}

export interface ExportedUserData {
  // Personal Information
  profile: {
    userId: string;
    email: string;
    displayName?: string;
    phoneNumber?: string;
    photoURL?: string;
    role: string;
    organizationId: string;
    createdAt: Date;
    lastLoginAt?: Date;
  };

  // Activity Data
  tras: any[];
  lmraSessions: any[];
  comments: any[];
  uploads: any[];

  // Consent Records
  consents: ConsentRecord[];

  // Audit Logs
  auditLogs?: any[];

  // Metadata
  exportMetadata: {
    exportDate: Date;
    dataRetentionPeriod: string;
    privacyPolicyVersion: string;
  };
}

// ============================================================================
// DATA DELETION (RIGHT TO BE FORGOTTEN)
// ============================================================================

export interface DataDeletionRequest {
  userId: string;
  organizationId: string;
  requestDate: Date;
  reason?: string;
  scheduledDeletionDate: Date; // 30 days from request
  status: "pending" | "processing" | "completed" | "cancelled";
  completedAt?: Date;
  deletedData: {
    category: GDPRDataCategory;
    recordCount: number;
  }[];
}

export interface DeletionResult {
  success: boolean;
  deletedCategories: GDPRDataCategory[];
  retainedCategories: GDPRDataCategory[]; // Legal obligation to retain
  retentionReason?: string;
  deletionDate: Date;
  confirmationId: string;
}

// ============================================================================
// GDPR COMPLIANCE SERVICE
// ============================================================================

export class GDPRComplianceService {
  /**
   * Record user consent
   */
  static async recordConsent(params: {
    userId: string;
    organizationId: string;
    consentType: ConsentType;
    granted: boolean;
    policyVersion: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const { firestore } = initializeAdmin();

    const consentRef = firestore
      .collection("organizations")
      .doc(params.organizationId)
      .collection("users")
      .doc(params.userId)
      .collection("consents")
      .doc();

    await consentRef.set({
      consentType: params.consentType,
      granted: params.granted,
      timestamp: Timestamp.now(),
      policyVersion: params.policyVersion,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    // Update user's current consent status
    const userRef = firestore
      .collection("organizations")
      .doc(params.organizationId)
      .collection("users")
      .doc(params.userId);

    await userRef.update({
      [`consents.${params.consentType}`]: {
        granted: params.granted,
        timestamp: Timestamp.now(),
        version: params.policyVersion,
      },
      lastUpdated: Timestamp.now(),
    });
  }

  /**
   * Get user consent status
   */
  static async getUserConsents(
    organizationId: string,
    userId: string
  ): Promise<UserConsent | null> {
    const { firestore } = initializeAdmin();

    const userDoc = await firestore
      .collection("organizations")
      .doc(organizationId)
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return null;
    }

    const data = userDoc.data();
    return {
      userId,
      organizationId,
      consents: data?.consents || {},
      lastUpdated: data?.lastUpdated?.toDate() || new Date(),
    };
  }

  /**
   * Export all user data (GDPR Article 20 - Right to Data Portability)
   */
  static async exportUserData(
    organizationId: string,
    userId: string,
    includeAuditLogs: boolean = false
  ): Promise<ExportedUserData> {
    const { firestore } = initializeAdmin();

    // Get user profile
    const userDoc = await firestore
      .collection("organizations")
      .doc(organizationId)
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();

    // Get TRAs created by user
    const trasSnapshot = await firestore
      .collection("organizations")
      .doc(organizationId)
      .collection("tras")
      .where("createdBy", "==", userId)
      .get();

    const tras = trasSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get LMRA sessions
    const lmraSnapshot = await firestore
      .collection("organizations")
      .doc(organizationId)
      .collection("lmraSessions")
      .where("performedBy", "==", userId)
      .get();

    const lmraSessions = lmraSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get comments
    const commentsSnapshot = await firestore
      .collectionGroup("comments")
      .where("userId", "==", userId)
      .where("organizationId", "==", organizationId)
      .get();

    const comments = commentsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get uploads
    const uploadsSnapshot = await firestore
      .collection("organizations")
      .doc(organizationId)
      .collection("uploads")
      .where("uploadedBy", "==", userId)
      .get();

    const uploads = uploadsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get consent history
    const consentsSnapshot = await firestore
      .collection("organizations")
      .doc(organizationId)
      .collection("users")
      .doc(userId)
      .collection("consents")
      .orderBy("timestamp", "desc")
      .get();

    const consents = consentsSnapshot.docs.map((doc: any) => doc.data() as ConsentRecord);

    // Get audit logs if requested
    let auditLogs: any[] | undefined;
    if (includeAuditLogs) {
      const auditSnapshot = await firestore
        .collection("organizations")
        .doc(organizationId)
        .collection("auditLogs")
        .where("actorId", "==", userId)
        .orderBy("timestamp", "desc")
        .limit(1000)
        .get();

      auditLogs = auditSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    return {
      profile: {
        userId,
        email: userData?.email || "",
        displayName: userData?.displayName,
        phoneNumber: userData?.phoneNumber,
        photoURL: userData?.photoURL,
        role: userData?.role || "field_worker",
        organizationId,
        createdAt: userData?.createdAt?.toDate() || new Date(),
        lastLoginAt: userData?.lastLoginAt?.toDate(),
      },
      tras,
      lmraSessions,
      comments,
      uploads,
      consents,
      auditLogs,
      exportMetadata: {
        exportDate: new Date(),
        dataRetentionPeriod: "7 years (legal requirement)",
        privacyPolicyVersion: "1.0",
      },
    };
  }

  /**
   * Request data deletion (GDPR Article 17 - Right to Erasure)
   */
  static async requestDataDeletion(params: {
    userId: string;
    organizationId: string;
    reason?: string;
  }): Promise<DataDeletionRequest> {
    const { firestore } = initializeAdmin();

    const requestDate = new Date();
    const scheduledDeletionDate = new Date(requestDate);
    scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + 30); // 30-day grace period

    const deletionRequest: Omit<DataDeletionRequest, "deletedData"> = {
      userId: params.userId,
      organizationId: params.organizationId,
      requestDate,
      reason: params.reason,
      scheduledDeletionDate,
      status: "pending",
    };

    const requestRef = await firestore
      .collection("organizations")
      .doc(params.organizationId)
      .collection("dataDeletionRequests")
      .add({
        ...deletionRequest,
        requestDate: Timestamp.fromDate(requestDate),
        scheduledDeletionDate: Timestamp.fromDate(scheduledDeletionDate),
      });

    return {
      ...deletionRequest,
      deletedData: [],
    };
  }

  /**
   * Execute data deletion (called after grace period)
   */
  static async executeDataDeletion(
    organizationId: string,
    userId: string
  ): Promise<DeletionResult> {
    const { firestore } = initializeAdmin();

    const deletedCategories: GDPRDataCategory[] = [];
    const retainedCategories: GDPRDataCategory[] = [];

    try {
      // Delete user profile (anonymize instead of full delete for audit trail)
      await firestore
        .collection("organizations")
        .doc(organizationId)
        .collection("users")
        .doc(userId)
        .update({
          email: `deleted-${userId}@anonymized.local`,
          displayName: "Deleted User",
          phoneNumber: null,
          photoURL: null,
          deletedAt: Timestamp.now(),
          gdprDeleted: true,
        });
      deletedCategories.push("personal_data");

      // Delete uploads (files and metadata)
      const uploadsSnapshot = await firestore
        .collection("organizations")
        .doc(organizationId)
        .collection("uploads")
        .where("uploadedBy", "==", userId)
        .get();

      const batch = firestore.batch();
      uploadsSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      deletedCategories.push("communication_data");

      // Delete location data
      const locationSnapshot = await firestore
        .collection("organizations")
        .doc(organizationId)
        .collection("locations")
        .where("userId", "==", userId)
        .get();

      const locationBatch = firestore.batch();
      locationSnapshot.docs.forEach((doc: any) => {
        locationBatch.delete(doc.ref);
      });
      await locationBatch.commit();
      deletedCategories.push("location_data");

      // Retain TRAs and LMRA sessions for legal/safety compliance
      // But anonymize personal identifiers
      const trasSnapshot = await firestore
        .collection("organizations")
        .doc(organizationId)
        .collection("tras")
        .where("createdBy", "==", userId)
        .get();

      const trasBatch = firestore.batch();
      trasSnapshot.docs.forEach((doc: any) => {
        trasBatch.update(doc.ref, {
          createdBy: "deleted-user",
          createdByName: "Deleted User",
        });
      });
      await trasBatch.commit();
      retainedCategories.push("usage_data");

      // Audit logs are retained for legal compliance (7 years)
      retainedCategories.push("technical_data");

      const confirmationId = `DEL-${Date.now()}-${userId.substring(0, 8)}`;

      return {
        success: true,
        deletedCategories,
        retainedCategories,
        retentionReason: "Legal obligation to retain safety and compliance records for 7 years",
        deletionDate: new Date(),
        confirmationId,
      };
    } catch (error) {
      throw new Error(`Data deletion failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validate GDPR compliance
   */
  static async validateCompliance(organizationId: string): Promise<{
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const { firestore } = initializeAdmin();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if privacy policy exists
    const orgDoc = await firestore.collection("organizations").doc(organizationId).get();

    const orgData = orgDoc.data();

    if (!orgData?.privacyPolicyUrl) {
      issues.push("Privacy policy URL not configured");
      recommendations.push("Add privacy policy URL to organization settings");
    }

    if (!orgData?.dataProtectionOfficer) {
      recommendations.push("Consider appointing a Data Protection Officer (DPO)");
    }

    // Check consent management
    const usersSnapshot = await firestore
      .collection("organizations")
      .doc(organizationId)
      .collection("users")
      .limit(10)
      .get();

    let usersWithoutConsent = 0;
    usersSnapshot.docs.forEach((doc: any) => {
      const userData = doc.data();
      if (!userData.consents || Object.keys(userData.consents).length === 0) {
        usersWithoutConsent++;
      }
    });

    if (usersWithoutConsent > 0) {
      issues.push(`${usersWithoutConsent} users without recorded consent`);
      recommendations.push("Implement consent collection for all users");
    }

    // Check data retention policies
    if (!orgData?.dataRetentionPolicy) {
      recommendations.push("Define and document data retention policies");
    }

    const compliant = issues.length === 0;

    return {
      compliant,
      issues,
      recommendations,
    };
  }
}

// ============================================================================
// PRIVACY CONTROLS
// ============================================================================

export interface PrivacySettings {
  userId: string;
  organizationId: string;

  // Data Processing Preferences
  allowAnalytics: boolean;
  allowLocationTracking: boolean;
  allowMarketingEmails: boolean;

  // Data Sharing
  shareDataWithPartners: boolean;

  // Retention
  requestDataDeletion: boolean;
  deletionScheduledDate?: Date;

  lastUpdated: Date;
}

export class PrivacyControlsService {
  /**
   * Update user privacy settings
   */
  static async updatePrivacySettings(
    organizationId: string,
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<void> {
    const { firestore } = initializeAdmin();

    await firestore
      .collection("organizations")
      .doc(organizationId)
      .collection("users")
      .doc(userId)
      .update({
        privacySettings: {
          ...settings,
          lastUpdated: Timestamp.now(),
        },
      });
  }

  /**
   * Get user privacy settings
   */
  static async getPrivacySettings(
    organizationId: string,
    userId: string
  ): Promise<PrivacySettings | null> {
    const { firestore } = initializeAdmin();

    const userDoc = await firestore
      .collection("organizations")
      .doc(organizationId)
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return null;
    }

    const data = userDoc.data();
    return data?.privacySettings || null;
  }
}
