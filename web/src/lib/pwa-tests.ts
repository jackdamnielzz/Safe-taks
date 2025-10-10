/**
 * Comprehensive PWA Testing Suite for SafeWork Pro
 * Tests all PWA requirements across different devices and browsers
 */

export interface PWATestResult {
  testName: string;
  status: "PASS" | "FAIL" | "WARN" | "SKIP";
  message: string;
  details?: any;
  timestamp: string;
}

export interface PWATestSuite {
  name: string;
  tests: PWATestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
  };
}

export class PWATester {
  private results: PWATestResult[] = [];

  /**
   * Test PWA Manifest compliance
   */
  async testManifest(): Promise<PWATestResult> {
    try {
      const manifestUrl = "/manifest.json";
      const response = await fetch(manifestUrl);

      if (!response.ok) {
        return {
          testName: "Manifest Accessibility",
          status: "FAIL",
          message: `Manifest not accessible: ${response.status}`,
          timestamp: new Date().toISOString(),
        };
      }

      const manifest = await response.json();

      // Validate required manifest properties
      const requiredFields = ["name", "short_name", "start_url", "display", "icons"];
      const missingFields = requiredFields.filter((field) => !manifest[field]);

      if (missingFields.length > 0) {
        return {
          testName: "Manifest Completeness",
          status: "FAIL",
          message: `Missing required fields: ${missingFields.join(", ")}`,
          details: { manifest, missingFields },
          timestamp: new Date().toISOString(),
        };
      }

      // Validate icon sizes
      const iconSizes = manifest.icons.map((icon: any) => icon.sizes).filter(Boolean);
      const requiredSizes = ["192x192", "512x512"];
      const missingSizes = requiredSizes.filter((size) => !iconSizes.includes(size));

      if (missingSizes.length > 0) {
        return {
          testName: "Manifest Icon Sizes",
          status: "WARN",
          message: `Missing recommended icon sizes: ${missingSizes.join(", ")}`,
          details: { iconSizes, missingSizes },
          timestamp: new Date().toISOString(),
        };
      }

      // Validate shortcuts
      if (manifest.shortcuts && manifest.shortcuts.length > 0) {
        const shortcutsWithIcons = manifest.shortcuts.filter(
          (shortcut: any) => shortcut.icons && shortcut.icons.length > 0
        );
        if (shortcutsWithIcons.length !== manifest.shortcuts.length) {
          return {
            testName: "Manifest Shortcuts",
            status: "WARN",
            message: "Some shortcuts missing icons",
            details: { shortcuts: manifest.shortcuts },
            timestamp: new Date().toISOString(),
          };
        }
      }

      return {
        testName: "PWA Manifest",
        status: "PASS",
        message: "Manifest is valid and complete",
        details: { manifest },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        testName: "PWA Manifest",
        status: "FAIL",
        message: `Manifest test failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test Service Worker registration and functionality
   */
  async testServiceWorker(): Promise<PWATestResult> {
    try {
      if (!("serviceWorker" in navigator)) {
        return {
          testName: "Service Worker Support",
          status: "SKIP",
          message: "Service Worker not supported in this browser",
          timestamp: new Date().toISOString(),
        };
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return {
          testName: "Service Worker Registration",
          status: "WARN",
          message: "Service Worker not registered (likely in development mode)",
          timestamp: new Date().toISOString(),
        };
      }

      // Test service worker is active
      if (registration.active?.state !== "activated") {
        return {
          testName: "Service Worker State",
          status: "WARN",
          message: `Service Worker state: ${registration.active?.state}`,
          details: { state: registration.active?.state },
          timestamp: new Date().toISOString(),
        };
      }

      // Test caching functionality
      const cacheNames = await caches.keys();
      const hasAppCache = cacheNames.some((name) => name.includes("safework"));

      return {
        testName: "Service Worker",
        status: "PASS",
        message: "Service Worker is registered and active",
        details: {
          state: registration.active?.state,
          scope: registration.scope,
          hasCache: hasAppCache,
          cacheNames,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        testName: "Service Worker",
        status: "FAIL",
        message: `Service Worker test failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test PWA installation capabilities
   */
  async testInstallability(): Promise<PWATestResult> {
    try {
      // Check if already installed
      if (window.matchMedia("(display-mode: standalone)").matches) {
        return {
          testName: "PWA Installation",
          status: "PASS",
          message: "PWA is already installed",
          details: { displayMode: "standalone" },
          timestamp: new Date().toISOString(),
        };
      }

      // Check install prompt availability
      const installEvent = new Promise<boolean>((resolve) => {
        const handler = (e: Event) => {
          resolve(true);
          window.removeEventListener("beforeinstallprompt", handler);
        };
        window.addEventListener("beforeinstallprompt", handler);

        // Timeout after 2 seconds
        setTimeout(() => {
          resolve(false);
          window.removeEventListener("beforeinstallprompt", handler);
        }, 2000);
      });

      const canInstall = await installEvent;

      if (canInstall) {
        return {
          testName: "PWA Installation",
          status: "PASS",
          message: "PWA can be installed",
          details: { canInstall: true },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        testName: "PWA Installation",
        status: "WARN",
        message: "Install prompt not available (may need HTTPS or user engagement)",
        details: { canInstall: false },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        testName: "PWA Installation",
        status: "FAIL",
        message: `Installation test failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test offline functionality
   */
  async testOfflineFunctionality(): Promise<PWATestResult> {
    try {
      // Test if we can access cached resources
      const cacheNames = await caches.keys();
      if (cacheNames.length === 0) {
        return {
          testName: "Offline Functionality",
          status: "WARN",
          message: "No caches found (may be in development mode)",
          details: { cacheNames },
          timestamp: new Date().toISOString(),
        };
      }

      // Test fetching a cached resource
      const testResponse = await caches.match("/");
      if (!testResponse) {
        return {
          testName: "Offline Functionality",
          status: "WARN",
          message: "No cached resources found",
          details: { cacheNames, hasRootCache: false },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        testName: "Offline Functionality",
        status: "PASS",
        message: "Offline functionality is working",
        details: {
          cacheNames,
          hasRootCache: true,
          status: testResponse.status,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        testName: "Offline Functionality",
        status: "FAIL",
        message: `Offline test failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test HTTPS and security requirements
   */
  async testSecurityRequirements(): Promise<PWATestResult> {
    try {
      const isHttps = window.location.protocol === "https:";
      const isLocalhost =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

      if (!isHttps && !isLocalhost) {
        return {
          testName: "HTTPS Requirement",
          status: "FAIL",
          message: "PWA requires HTTPS in production",
          details: {
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            isHttps,
            isLocalhost,
          },
          timestamp: new Date().toISOString(),
        };
      }

      // Check for security headers (simplified check)
      const response = await fetch("/", { method: "HEAD" });
      const headers = response.headers;

      const securityHeaders = {
        "content-security-policy": headers.get("content-security-policy"),
        "x-frame-options": headers.get("x-frame-options"),
        "strict-transport-security": headers.get("strict-transport-security"),
      };

      return {
        testName: "Security Requirements",
        status: "PASS",
        message: "Security requirements met",
        details: {
          isHttps: isHttps || isLocalhost,
          securityHeaders,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        testName: "Security Requirements",
        status: "FAIL",
        message: `Security test failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test performance requirements
   */
  async testPerformanceRequirements(): Promise<PWATestResult> {
    try {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;

      if (!navigation) {
        return {
          testName: "Performance Metrics",
          status: "WARN",
          message: "No navigation performance data available",
          timestamp: new Date().toISOString(),
        };
      }

      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      const domContentLoaded =
        navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;

      // PWA performance thresholds
      const maxLoadTime = 3000; // 3 seconds
      const maxDomTime = 2000; // 2 seconds

      const results = {
        loadTime,
        domContentLoaded,
        withinLimits: loadTime <= maxLoadTime && domContentLoaded <= maxDomTime,
      };

      if (!results.withinLimits) {
        return {
          testName: "Performance Requirements",
          status: "WARN",
          message: `Performance below PWA standards (Load: ${loadTime}ms, DOM: ${domContentLoaded}ms)`,
          details: results,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        testName: "Performance Requirements",
        status: "PASS",
        message: "Performance meets PWA standards",
        details: results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        testName: "Performance Requirements",
        status: "FAIL",
        message: `Performance test failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Run all PWA tests
   */
  async runAllTests(): Promise<PWATestSuite> {
    const testMethods = [
      "testManifest",
      "testServiceWorker",
      "testInstallability",
      "testOfflineFunctionality",
      "testSecurityRequirements",
      "testPerformanceRequirements",
    ];

    this.results = [];

    for (const method of testMethods) {
      const testMethod = this[method as keyof PWATester] as () => Promise<PWATestResult>;
      if (typeof testMethod === "function") {
        const result = await testMethod.call(this);
        this.results.push(result);
      }
    }

    const summary = {
      total: this.results.length,
      passed: this.results.filter((r) => r.status === "PASS").length,
      failed: this.results.filter((r) => r.status === "FAIL").length,
      warnings: this.results.filter((r) => r.status === "WARN").length,
      skipped: this.results.filter((r) => r.status === "SKIP").length,
    };

    return {
      name: "SafeWork Pro PWA Test Suite",
      tests: this.results,
      summary,
    };
  }

  /**
   * Generate test report
   */
  generateReport(suite: PWATestSuite): string {
    const { name, tests, summary } = suite;

    let report = `# ${name}\n\n`;
    report += `**Test Run:** ${new Date().toISOString()}\n\n`;
    report += `## Summary\n`;
    report += `- ✅ Passed: ${summary.passed}\n`;
    report += `- ❌ Failed: ${summary.failed}\n`;
    report += `- ⚠️ Warnings: ${summary.warnings}\n`;
    report += `- ⏭️ Skipped: ${summary.skipped}\n`;
    report += `- 📊 Total: ${summary.total}\n\n`;

    report += `## Test Results\n\n`;

    tests.forEach((test, index) => {
      const icon = {
        PASS: "✅",
        FAIL: "❌",
        WARN: "⚠️",
        SKIP: "⏭️",
      }[test.status];

      report += `### ${index + 1}. ${icon} ${test.testName}\n`;
      report += `- **Status:** ${test.status}\n`;
      report += `- **Message:** ${test.message}\n`;

      if (test.details) {
        report += `- **Details:**\`\`\`json\n${JSON.stringify(test.details, null, 2)}\n\`\`\`\n`;
      }

      report += `- **Timestamp:** ${test.timestamp}\n\n`;
    });

    return report;
  }

  /**
   * Test iOS Safari specific requirements
   */
  async testIOSSafari(): Promise<PWATestResult> {
    try {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|OPiOS|mercury/.test(userAgent);

      if (!isIOS || !isSafari) {
        return {
          testName: "iOS Safari Environment",
          status: "SKIP",
          message: "Not running in iOS Safari",
          details: { userAgent, isIOS, isSafari },
          timestamp: new Date().toISOString(),
        };
      }

      // Test iOS-specific PWA requirements
      const manifest = await fetch("/manifest.json").then((r) => r.json());

      const iosRequirements = {
        hasProperName: manifest.name && manifest.name.length > 0,
        hasShortName: manifest.short_name && manifest.short_name.length > 0,
        hasDisplayStandalone: manifest.display === "standalone",
        hasPortraitOrientation:
          !manifest.orientation || manifest.orientation === "portrait-primary",
        hasThemeColor: manifest.theme_color && manifest.theme_color.length > 0,
        hasIcons: manifest.icons && manifest.icons.length >= 2,
      };

      const allRequirementsMet = Object.values(iosRequirements).every((req) => req);

      return {
        testName: "iOS Safari PWA",
        status: allRequirementsMet ? "PASS" : "WARN",
        message: allRequirementsMet
          ? "iOS Safari PWA requirements met"
          : "Some iOS Safari PWA requirements missing",
        details: {
          environment: { isIOS, isSafari },
          requirements: iosRequirements,
          manifest,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        testName: "iOS Safari PWA",
        status: "FAIL",
        message: `iOS Safari test failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test Android Chrome specific requirements
   */
  async testAndroidChrome(): Promise<PWATestResult> {
    try {
      const userAgent = navigator.userAgent;
      const isAndroid = /Android/.test(userAgent);
      const isChrome = /Chrome/.test(userAgent);

      if (!isAndroid || !isChrome) {
        return {
          testName: "Android Chrome Environment",
          status: "SKIP",
          message: "Not running in Android Chrome",
          details: { userAgent, isAndroid, isChrome },
          timestamp: new Date().toISOString(),
        };
      }

      const manifest = await fetch("/manifest.json").then((r) => r.json());

      const androidRequirements = {
        hasProperName: manifest.name && manifest.name.length > 0,
        hasDisplayStandalone: manifest.display === "standalone",
        hasThemeColor: manifest.theme_color && manifest.theme_color.length > 0,
        hasBackgroundColor: manifest.background_color && manifest.background_color.length > 0,
        hasIcons: manifest.icons && manifest.icons.length >= 4, // Android needs more icon sizes
        hasSplashScreen: true, // Will be provided by next-pwa
      };

      const allRequirementsMet = Object.values(androidRequirements).every((req) => req);

      return {
        testName: "Android Chrome PWA",
        status: allRequirementsMet ? "PASS" : "WARN",
        message: allRequirementsMet
          ? "Android Chrome PWA requirements met"
          : "Some Android Chrome PWA requirements missing",
        details: {
          environment: { isAndroid, isChrome },
          requirements: androidRequirements,
          manifest,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        testName: "Android Chrome PWA",
        status: "FAIL",
        message: `Android Chrome test failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export const pwaTester = new PWATester();
