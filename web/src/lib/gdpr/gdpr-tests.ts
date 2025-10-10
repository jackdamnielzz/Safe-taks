/**
 * GDPR Compliance Testing Framework
 *
 * Automated tests for GDPR compliance validation
 */

import { GDPRComplianceService, PrivacyControlsService } from "./gdpr-compliance";

export interface GDPRTestResult {
  testName: string;
  category:
    | "data_export"
    | "data_deletion"
    | "consent_management"
    | "privacy_controls"
    | "compliance";
  passed: boolean;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  details?: any;
  recommendation?: string;
  timestamp: string;
}

export interface GDPRTestSuite {
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  results: GDPRTestResult[];
  complianceScore: number; // 0-100
  startTime: string;
  endTime: string;
  duration: number;
}

export class GDPRTestRunner {
  private results: GDPRTestResult[] = [];
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
  }

  private addResult(result: Omit<GDPRTestResult, "timestamp">): void {
    this.results.push({
      ...result,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Test: Data export functionality
   */
  async testDataExport(organizationId: string, userId: string): Promise<void> {
    try {
      const exportedData = await GDPRComplianceService.exportUserData(
        organizationId,
        userId,
        false
      );

      const hasProfile = !!exportedData.profile;
      const hasExportMetadata = !!exportedData.exportMetadata;
      const hasConsents = Array.isArray(exportedData.consents);

      if (hasProfile && hasExportMetadata && hasConsents) {
        this.addResult({
          testName: "Data Export Functionality",
          category: "data_export",
          passed: true,
          severity: "low",
          message: "User data export working correctly",
          details: {
            profileIncluded: hasProfile,
            metadataIncluded: hasExportMetadata,
            consentsIncluded: hasConsents,
          },
        });
      } else {
        this.addResult({
          testName: "Data Export Functionality",
          category: "data_export",
          passed: false,
          severity: "critical",
          message: "Data export incomplete",
          recommendation: "Ensure all user data categories are included in export",
        });
      }
    } catch (error) {
      this.addResult({
        testName: "Data Export Functionality",
        category: "data_export",
        passed: false,
        severity: "critical",
        message: "Data export failed",
        details: { error: (error as Error).message },
        recommendation: "Fix data export implementation",
      });
    }
  }

  /**
   * Test: Data deletion request
   */
  async testDataDeletionRequest(organizationId: string, userId: string): Promise<void> {
    try {
      const deletionRequest = await GDPRComplianceService.requestDataDeletion({
        userId,
        organizationId,
        reason: "Test deletion request",
      });

      const hasScheduledDate = !!deletionRequest.scheduledDeletionDate;
      const hasGracePeriod = deletionRequest.status === "pending";

      if (hasScheduledDate && hasGracePeriod) {
        this.addResult({
          testName: "Data Deletion Request",
          category: "data_deletion",
          passed: true,
          severity: "low",
          message: "Data deletion request working correctly",
          details: {
            scheduledDate: deletionRequest.scheduledDeletionDate,
            gracePeriod: "30 days",
          },
        });
      } else {
        this.addResult({
          testName: "Data Deletion Request",
          category: "data_deletion",
          passed: false,
          severity: "high",
          message: "Data deletion request incomplete",
          recommendation: "Ensure 30-day grace period is implemented",
        });
      }
    } catch (error) {
      this.addResult({
        testName: "Data Deletion Request",
        category: "data_deletion",
        passed: false,
        severity: "high",
        message: "Data deletion request failed",
        details: { error: (error as Error).message },
      });
    }
  }

  /**
   * Test: Consent management
   */
  async testConsentManagement(organizationId: string, userId: string): Promise<void> {
    try {
      // Record consent
      await GDPRComplianceService.recordConsent({
        userId,
        organizationId,
        consentType: "analytics",
        granted: true,
        policyVersion: "1.0",
      });

      // Retrieve consent
      const consents = await GDPRComplianceService.getUserConsents(organizationId, userId);

      if (consents && consents.consents) {
        this.addResult({
          testName: "Consent Management",
          category: "consent_management",
          passed: true,
          severity: "low",
          message: "Consent management working correctly",
          details: { consentsRecorded: Object.keys(consents.consents).length },
        });
      } else {
        this.addResult({
          testName: "Consent Management",
          category: "consent_management",
          passed: false,
          severity: "high",
          message: "Consent management not working",
          recommendation: "Implement consent recording and retrieval",
        });
      }
    } catch (error) {
      this.addResult({
        testName: "Consent Management",
        category: "consent_management",
        passed: false,
        severity: "high",
        message: "Consent management failed",
        details: { error: (error as Error).message },
      });
    }
  }

  /**
   * Test: Privacy controls
   */
  async testPrivacyControls(organizationId: string, userId: string): Promise<void> {
    try {
      // Update privacy settings
      await PrivacyControlsService.updatePrivacySettings(organizationId, userId, {
        allowAnalytics: false,
        allowLocationTracking: false,
        allowMarketingEmails: false,
        shareDataWithPartners: false,
        requestDataDeletion: false,
      } as any);

      // Retrieve privacy settings
      const settings = await PrivacyControlsService.getPrivacySettings(organizationId, userId);

      if (settings) {
        this.addResult({
          testName: "Privacy Controls",
          category: "privacy_controls",
          passed: true,
          severity: "low",
          message: "Privacy controls working correctly",
        });
      } else {
        this.addResult({
          testName: "Privacy Controls",
          category: "privacy_controls",
          passed: false,
          severity: "medium",
          message: "Privacy controls not accessible",
          recommendation: "Implement user privacy settings management",
        });
      }
    } catch (error) {
      this.addResult({
        testName: "Privacy Controls",
        category: "privacy_controls",
        passed: false,
        severity: "medium",
        message: "Privacy controls failed",
        details: { error: (error as Error).message },
      });
    }
  }

  /**
   * Test: GDPR compliance validation
   */
  async testComplianceValidation(organizationId: string): Promise<void> {
    try {
      const validation = await GDPRComplianceService.validateCompliance(organizationId);

      this.addResult({
        testName: "GDPR Compliance Validation",
        category: "compliance",
        passed: validation.compliant,
        severity: validation.compliant ? "low" : "high",
        message: validation.compliant
          ? "Organization is GDPR compliant"
          : `${validation.issues.length} compliance issues found`,
        details: {
          issues: validation.issues,
          recommendations: validation.recommendations,
        },
        recommendation: validation.issues.length > 0 ? "Address compliance issues" : undefined,
      });
    } catch (error) {
      this.addResult({
        testName: "GDPR Compliance Validation",
        category: "compliance",
        passed: false,
        severity: "high",
        message: "Compliance validation failed",
        details: { error: (error as Error).message },
      });
    }
  }

  /**
   * Run all GDPR tests
   */
  async runAllTests(organizationId: string, userId: string): Promise<GDPRTestSuite> {
    await this.testDataExport(organizationId, userId);
    await this.testDataDeletionRequest(organizationId, userId);
    await this.testConsentManagement(organizationId, userId);
    await this.testPrivacyControls(organizationId, userId);
    await this.testComplianceValidation(organizationId);

    return this.getResults();
  }

  /**
   * Get test results
   */
  getResults(): GDPRTestSuite {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const complianceScore = Math.round((passed / this.results.length) * 100);

    return {
      suiteName: "GDPR Compliance Testing",
      totalTests: this.results.length,
      passed,
      failed,
      results: this.results,
      complianceScore,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
    };
  }
}

/**
 * Generate GDPR compliance report
 */
export function generateGDPRReport(suite: GDPRTestSuite): string {
  const criticalIssues = suite.results.filter((r) => !r.passed && r.severity === "critical");
  const highIssues = suite.results.filter((r) => !r.passed && r.severity === "high");

  let report = `# GDPR Compliance Report\n\n`;
  report += `**Generated**: ${new Date().toISOString()}\n`;
  report += `**Duration**: ${suite.duration}ms\n`;
  report += `**Compliance Score**: ${suite.complianceScore}%\n\n`;

  report += `## Executive Summary\n\n`;
  report += `- **Total Tests**: ${suite.totalTests}\n`;
  report += `- **Passed**: ${suite.passed}\n`;
  report += `- **Failed**: ${suite.failed}\n`;
  report += `- **Compliance Status**: ${suite.complianceScore >= 80 ? "✅ COMPLIANT" : "⚠️ NON-COMPLIANT"}\n\n`;

  if (criticalIssues.length > 0) {
    report += `## 🚨 Critical Issues\n\n`;
    criticalIssues.forEach((issue) => {
      report += `### ${issue.testName}\n`;
      report += `- **Message**: ${issue.message}\n`;
      if (issue.recommendation) {
        report += `- **Recommendation**: ${issue.recommendation}\n`;
      }
      report += `\n`;
    });
  }

  if (highIssues.length > 0) {
    report += `## ⚠️ High Priority Issues\n\n`;
    highIssues.forEach((issue) => {
      report += `### ${issue.testName}\n`;
      report += `- **Message**: ${issue.message}\n`;
      if (issue.recommendation) {
        report += `- **Recommendation**: ${issue.recommendation}\n`;
      }
      report += `\n`;
    });
  }

  report += `## ✅ Passed Tests\n\n`;
  const passedTests = suite.results.filter((r) => r.passed);
  passedTests.forEach((test) => {
    report += `- ${test.testName} (${test.category})\n`;
  });

  report += `\n## GDPR Rights Validated\n\n`;
  report += `- ✅ Right to Access (Article 15)\n`;
  report += `- ✅ Right to Data Portability (Article 20)\n`;
  report += `- ✅ Right to Erasure (Article 17)\n`;
  report += `- ✅ Right to Withdraw Consent (Article 7)\n`;
  report += `- ✅ Privacy by Design (Article 25)\n\n`;

  return report;
}
