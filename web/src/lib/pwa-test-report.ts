/**
 * PWA Test Report Generator
 * Creates comprehensive documentation of PWA testing results
 */

import { PWATestSuite } from "./pwa-tests";

export interface PWAReport {
  metadata: {
    projectName: string;
    testDate: string;
    environment: {
      userAgent: string;
      platform: string;
      url: string;
      isHttps: boolean;
      isLocalhost: boolean;
    };
    testerVersion: string;
  };
  summary: PWATestSuite["summary"];
  results: PWATestSuite["tests"];
  recommendations: string[];
  compliance: {
    pwaScore: number;
    iosSafari: boolean;
    androidChrome: boolean;
    offlineCapable: boolean;
    securityCompliant: boolean;
  };
}

export class PWATestReporter {
  private static readonly TESTER_VERSION = "1.0.0";

  /**
   * Generate comprehensive PWA test report
   */
  static generateReport(suite: PWATestSuite): PWAReport {
    const environment = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      url: window.location.href,
      isHttps: window.location.protocol === "https:",
      isLocalhost:
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1",
    };

    const recommendations = this.generateRecommendations(suite);
    const compliance = this.assessCompliance(suite);

    return {
      metadata: {
        projectName: "SafeWork Pro - TRA/LMRA Safety Management",
        testDate: new Date().toISOString(),
        environment,
        testerVersion: this.TESTER_VERSION,
      },
      summary: suite.summary,
      results: suite.tests,
      recommendations,
      compliance,
    };
  }

  /**
   * Generate actionable recommendations based on test results
   */
  private static generateRecommendations(suite: PWATestSuite): string[] {
    const recommendations: string[] = [];

    suite.tests.forEach((test) => {
      switch (test.testName) {
        case "PWA Manifest":
          if (test.status === "FAIL") {
            recommendations.push(
              "Fix missing required manifest fields to ensure PWA functionality",
              "Add all required icon sizes (192x192, 512x512) for cross-platform compatibility"
            );
          } else if (test.status === "WARN") {
            recommendations.push(
              "Add maskable icons for better Android home screen appearance",
              "Include app shortcuts for quick access to key features"
            );
          }
          break;

        case "Service Worker":
          if (test.status === "WARN") {
            recommendations.push(
              "Ensure service worker is registered in production builds",
              "Monitor service worker cache performance and implement cache rotation"
            );
          }
          break;

        case "PWA Installation":
          if (test.status === "WARN") {
            recommendations.push(
              "Ensure HTTPS is enabled in production for installation support",
              "Add installation prompts and user engagement to trigger install banner",
              "Test installation flow on target devices"
            );
          }
          break;

        case "Offline Functionality":
          if (test.status === "WARN") {
            recommendations.push(
              "Implement proper caching strategies for API responses",
              "Add offline indicators and sync status to user interface",
              "Test offline scenarios thoroughly"
            );
          }
          break;

        case "Security Requirements":
          if (test.status === "FAIL") {
            recommendations.push(
              "Enable HTTPS for production deployment",
              "Implement security headers (CSP, HSTS, X-Frame-Options)",
              "Regular security audits and vulnerability assessments"
            );
          }
          break;

        case "Performance Requirements":
          if (test.status === "WARN") {
            recommendations.push(
              "Optimize bundle size and implement code splitting",
              "Add performance budgets and monitoring",
              "Implement lazy loading for non-critical resources"
            );
          }
          break;
      }
    });

    // Overall recommendations
    if (suite.summary.passed < suite.summary.total) {
      recommendations.push(
        "Address all failed tests before production deployment",
        "Regular PWA testing should be part of CI/CD pipeline",
        "Monitor PWA metrics in production (install rate, offline usage)"
      );
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Assess PWA compliance across platforms
   */
  private static assessCompliance(suite: PWATestSuite) {
    const iosSafari = suite.tests.find((t) => t.testName === "iOS Safari PWA")?.status === "PASS";
    const androidChrome =
      suite.tests.find((t) => t.testName === "Android Chrome PWA")?.status === "PASS";
    const offlineCapable =
      suite.tests.find((t) => t.testName === "Offline Functionality")?.status === "PASS";
    const securityCompliant =
      suite.tests.find((t) => t.testName === "Security Requirements")?.status === "PASS";

    const pwaScore = Math.round(
      (suite.tests.filter((t) => t.status === "PASS").length / suite.tests.length) * 100
    );

    return {
      pwaScore,
      iosSafari: iosSafari || false,
      androidChrome: androidChrome || false,
      offlineCapable: offlineCapable || false,
      securityCompliant: securityCompliant || false,
    };
  }

  /**
   * Generate markdown report
   */
  static generateMarkdownReport(report: PWAReport): string {
    let markdown = `# PWA Test Report - ${report.metadata.projectName}\n\n`;
    markdown += `**Test Date:** ${new Date(report.metadata.testDate).toLocaleString()}\n`;
    markdown += `**Tester Version:** ${report.metadata.testerVersion}\n`;
    markdown += `**PWA Score:** ${report.compliance.pwaScore}/100\n\n`;

    // Environment information
    markdown += `## Environment\n`;
    markdown += `- **URL:** ${report.metadata.environment.url}\n`;
    markdown += `- **Platform:** ${report.metadata.environment.platform}\n`;
    markdown += `- **User Agent:** ${report.metadata.environment.userAgent}\n`;
    markdown += `- **HTTPS:** ${report.metadata.environment.isHttps ? "✅" : "❌"}\n`;
    markdown += `- **Localhost:** ${report.metadata.environment.isLocalhost ? "✅" : "❌"}\n\n`;

    // Summary
    markdown += `## Test Summary\n`;
    markdown += `| Status | Count |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| ✅ Passed | ${report.summary.passed} |\n`;
    markdown += `| ❌ Failed | ${report.summary.failed} |\n`;
    markdown += `| ⚠️ Warnings | ${report.summary.warnings} |\n`;
    markdown += `| ⏭️ Skipped | ${report.summary.skipped} |\n`;
    markdown += `| **Total** | **${report.summary.total}** |\n\n`;

    // Compliance status
    markdown += `## Compliance Status\n`;
    markdown += `| Platform | Status | Score |\n`;
    markdown += `|----------|--------|-------|\n`;
    markdown += `| iOS Safari | ${report.compliance.iosSafari ? "✅ Compatible" : "❌ Issues"} | ${report.compliance.iosSafari ? "100" : "0"}/100 |\n`;
    markdown += `| Android Chrome | ${report.compliance.androidChrome ? "✅ Compatible" : "❌ Issues"} | ${report.compliance.androidChrome ? "100" : "0"}/100 |\n`;
    markdown += `| Offline Capable | ${report.compliance.offlineCapable ? "✅ Working" : "❌ Issues"} | ${report.compliance.offlineCapable ? "100" : "0"}/100 |\n`;
    markdown += `| Security | ${report.compliance.securityCompliant ? "✅ Compliant" : "❌ Issues"} | ${report.compliance.securityCompliant ? "100" : "0"}/100 |\n\n`;

    // Detailed results
    markdown += `## Detailed Results\n\n`;
    report.results.forEach((test, index) => {
      const icon = {
        PASS: "✅",
        FAIL: "❌",
        WARN: "⚠️",
        SKIP: "⏭️",
      }[test.status];

      markdown += `### ${index + 1}. ${icon} ${test.testName}\n`;
      markdown += `- **Status:** ${test.status}\n`;
      markdown += `- **Message:** ${test.message}\n`;

      if (test.details) {
        markdown += `- **Details:**\`\`\`json\n${JSON.stringify(test.details, null, 2)}\n\`\`\`\n`;
      }

      markdown += `- **Timestamp:** ${test.timestamp}\n\n`;
    });

    // Recommendations
    if (report.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      report.recommendations.forEach((rec, index) => {
        markdown += `${index + 1}. ${rec}\n`;
      });
      markdown += "\n";
    }

    // Manual testing section
    markdown += `## Manual Testing Requirements\n\n`;
    markdown += `### iOS Safari Testing\n`;
    markdown += `- [ ] Test PWA installation from Safari browser\n`;
    markdown += `- [ ] Verify "Add to Home Screen" functionality\n`;
    markdown += `- [ ] Test app launch from home screen icon\n`;
    markdown += `- [ ] Validate full-screen experience\n`;
    markdown += `- [ ] Test on multiple iOS versions (iOS 15+, iOS 16+, iOS 17+)\n\n`;

    markdown += `### Android Chrome Testing\n`;
    markdown += `- [ ] Test PWA installation from Chrome browser\n`;
    markdown += `- [ ] Verify "Install app" functionality\n`;
    markdown += `- [ ] Test app launch from home screen\n`;
    markdown += `- [ ] Validate splash screen and theming\n`;
    markdown += `- [ ] Test on multiple Android versions (Android 10+, Android 11+, Android 12+)\n\n`;

    markdown += `### Offline Testing\n`;
    markdown += `- [ ] Disable network and test complete offline experience\n`;
    markdown += `- [ ] Verify service worker caching works properly\n`;
    markdown += `- [ ] Test offline data synchronization when network returns\n`;
    markdown += `- [ ] Validate offline error handling and user feedback\n\n`;

    markdown += `### Cross-Platform Testing\n`;
    markdown += `- [ ] Test on multiple Android devices (different screen sizes)\n`;
    markdown += `- [ ] Test on multiple iOS devices (iPhone, iPad)\n`;
    markdown += `- [ ] Validate responsive design across all tested devices\n`;
    markdown += `- [ ] Test touch interactions and gestures\n\n`;

    return markdown;
  }

  /**
   * Export report as JSON
   */
  static exportJsonReport(report: PWAReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate Lighthouse PWA audit checklist
   */
  static generateLighthouseChecklist(report: PWAReport): string {
    const checklist = [
      {
        category: "Manifest",
        items: [
          "Contains name and short_name",
          "Contains start_url",
          "Contains icons (192px and 512px)",
          "Contains theme_color",
          "Contains background_color",
          "Contains display (standalone or fullscreen)",
        ],
      },
      {
        category: "Service Worker",
        items: [
          "Registers a service worker",
          "Service worker controls page",
          "Service worker caches static assets",
          "Service worker handles runtime caching",
        ],
      },
      {
        category: "Installable",
        items: [
          "Web app manifest meets installability requirements",
          "Installs successfully",
          "Meets HTTPS requirements",
          "Contains appropriate icons",
        ],
      },
      {
        category: "Performance",
        items: [
          "Loads within 3 seconds on 3G",
          "First paint within 1.8 seconds",
          "Time to interactive within 3.5 seconds",
          "Bundle size optimized",
        ],
      },
    ];

    let markdown = `# Lighthouse PWA Audit Checklist\n\n`;

    checklist.forEach((category) => {
      markdown += `## ${category.category}\n\n`;
      category.items.forEach((item) => {
        const isCompliant = this.checkLighthouseCompliance(report, category.category, item);
        const icon = isCompliant ? "✅" : "❌";
        markdown += `- ${icon} ${item}\n`;
      });
      markdown += "\n";
    });

    return markdown;
  }

  /**
   * Check compliance with Lighthouse PWA requirements
   */
  private static checkLighthouseCompliance(
    report: PWAReport,
    category: string,
    item: string
  ): boolean {
    switch (category) {
      case "Manifest":
        const manifestTest = report.results.find((t) => t.testName === "PWA Manifest");
        if (item.includes("name") && manifestTest?.status === "PASS") return true;
        if (item.includes("icons") && manifestTest?.status === "PASS") return true;
        if (item.includes("theme_color") && manifestTest?.status === "PASS") return true;
        break;

      case "Service Worker":
        const swTest = report.results.find((t) => t.testName === "Service Worker");
        if (swTest?.status === "PASS") return true;
        break;

      case "Installable":
        if (item.includes("HTTPS") && report.metadata.environment.isHttps) return true;
        if (item.includes("installs successfully") && report.compliance.pwaScore >= 80) return true;
        break;

      case "Performance":
        const perfTest = report.results.find((t) => t.testName === "Performance Requirements");
        if (perfTest?.status === "PASS") return true;
        break;
    }

    return false;
  }
}
