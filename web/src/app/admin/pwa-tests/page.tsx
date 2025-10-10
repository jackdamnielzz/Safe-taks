"use client";

/**
 * PWA Testing Dashboard
 * Comprehensive testing interface for PWA functionality
 */

import React, { useState } from "react";
import { PWATestRunner } from "@/components/pwa/PWATestRunner";
import { pwaTester, PWATestSuite } from "@/lib/pwa-tests";
import { PWATestReporter, PWAReport } from "@/lib/pwa-test-report";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";

export default function PWATestsPage() {
  const [report, setReport] = useState<PWAReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<"automated" | "manual" | "report">("automated");

  const handleTestComplete = async (suite: PWATestSuite) => {
    setIsGeneratingReport(true);
    try {
      const testReport = PWATestReporter.generateReport(suite);
      setReport(testReport);
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const exportReport = (format: "markdown" | "json") => {
    if (!report) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "markdown") {
      content = PWATestReporter.generateMarkdownReport(report);
      filename = `pwa-test-report-${new Date().toISOString().split("T")[0]}.md`;
      mimeType = "text/markdown";
    } else {
      content = PWATestReporter.exportJsonReport(report);
      filename = `pwa-test-report-${new Date().toISOString().split("T")[0]}.json`;
      mimeType = "application/json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PWA Testing Dashboard</h1>
        <p className="text-gray-600">
          Comprehensive Progressive Web App testing for SafeWork Pro across all platforms
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("automated")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "automated"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Automated Tests
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "manual"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Manual Testing Guide
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "report"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Test Report
          </button>
        </nav>
      </div>

      {/* Automated Tests Tab */}
      {activeTab === "automated" && (
        <div className="space-y-8">
          <PWATestRunner onTestComplete={handleTestComplete} />

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={async () => {
                  const results = await pwaTester.runAllTests();
                  await handleTestComplete(results);
                }}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Run Full Test Suite
              </Button>
              <Button onClick={() => pwaTester.testManifest()} variant="outline">
                Test Manifest Only
              </Button>
              <Button onClick={() => pwaTester.testServiceWorker()} variant="outline">
                Test Service Worker
              </Button>
              <Button onClick={() => pwaTester.testOfflineFunctionality()} variant="outline">
                Test Offline Mode
              </Button>
            </div>
          </Card>

          {/* Current Status */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">PWA Status Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-900">Manifest</div>
                <div className="text-2xl font-bold text-blue-600">✅</div>
                <div className="text-xs text-blue-700">Complete</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-green-900">Service Worker</div>
                <div className="text-2xl font-bold text-green-600">✅</div>
                <div className="text-xs text-green-700">Ready</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-yellow-900">Installation</div>
                <div className="text-2xl font-bold text-yellow-600">⚠️</div>
                <div className="text-xs text-yellow-700">HTTPS Required</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-purple-900">Offline</div>
                <div className="text-2xl font-bold text-purple-600">✅</div>
                <div className="text-xs text-purple-700">Functional</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Manual Testing Guide Tab */}
      {activeTab === "manual" && (
        <div className="space-y-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Manual Testing Requirements
            </h3>
            <Alert className="mb-6">
              Manual testing requires physical devices and cannot be fully automated. Follow the
              procedures below for comprehensive PWA validation.
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* iOS Testing */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  🍎 iOS Safari Testing
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">1</Badge>
                    <span>Deploy to HTTPS environment</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">2</Badge>
                    <span>Open Safari on iOS device (iPhone/iPad)</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">3</Badge>
                    <span>Navigate to SafeWork Pro URL</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">4</Badge>
                    <span>Tap share button and select "Add to Home Screen"</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">5</Badge>
                    <span>Launch app from home screen icon</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">6</Badge>
                    <span>Verify full-screen experience</span>
                  </div>
                </div>
              </div>

              {/* Android Testing */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  🤖 Android Chrome Testing
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">1</Badge>
                    <span>Deploy to HTTPS environment</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">2</Badge>
                    <span>Open Chrome on Android device</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">3</Badge>
                    <span>Navigate to SafeWork Pro URL</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">4</Badge>
                    <span>Tap menu (⋮) and select "Install app"</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">5</Badge>
                    <span>Verify splash screen and theming</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">6</Badge>
                    <span>Test app launch from home screen</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Offline Testing */}
            <div className="mt-8">
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                📡 Offline Functionality Testing
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">1</Badge>
                    <span>Enable airplane mode on test device</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">2</Badge>
                    <span>Launch SafeWork Pro PWA</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">3</Badge>
                    <span>Verify app loads from cache</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">4</Badge>
                    <span>Test LMRA creation offline</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge className="mt-0.5">5</Badge>
                    <span>Disable airplane mode and verify sync</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Device Matrix */}
            <div className="mt-8">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Test Device Matrix</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">iOS Devices</h5>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>• iPhone SE (375x667)</div>
                    <div>• iPhone 12/13/14 (390x844)</div>
                    <div>• iPhone Pro Max (428x926)</div>
                    <div>• iPad (768x1024)</div>
                    <div>• iPad Pro (1024x1366)</div>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Android Devices</h5>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>• Small phones (360x640)</div>
                    <div>• Standard phones (412x732)</div>
                    <div>• Large phones (428x926)</div>
                    <div>• Tablets (800x1280)</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Test Report Tab */}
      {activeTab === "report" && (
        <div className="space-y-8">
          {report ? (
            <>
              {/* Report Summary */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">PWA Test Report</h3>
                    <p className="text-sm text-gray-600">
                      Generated on {new Date(report.metadata.testDate).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <Button onClick={() => exportReport("markdown")} variant="outline">
                      Export Markdown
                    </Button>
                    <Button onClick={() => exportReport("json")} variant="outline">
                      Export JSON
                    </Button>
                  </div>
                </div>

                {/* Compliance Score */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">PWA Score</span>
                    <span className="text-sm text-gray-500">{report.compliance.pwaScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${report.compliance.pwaScore}%` }}
                    ></div>
                  </div>
                </div>

                {/* Platform Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div
                    className={`p-4 rounded-lg border ${
                      report.compliance.iosSafari
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>🍎</span>
                      <span className="font-medium">iOS Safari</span>
                    </div>
                    <div
                      className={`text-sm mt-1 ${
                        report.compliance.iosSafari ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {report.compliance.iosSafari ? "Compatible" : "Issues Found"}
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg border ${
                      report.compliance.androidChrome
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>🤖</span>
                      <span className="font-medium">Android Chrome</span>
                    </div>
                    <div
                      className={`text-sm mt-1 ${
                        report.compliance.androidChrome ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {report.compliance.androidChrome ? "Compatible" : "Issues Found"}
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg border ${
                      report.compliance.offlineCapable
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>📡</span>
                      <span className="font-medium">Offline</span>
                    </div>
                    <div
                      className={`text-sm mt-1 ${
                        report.compliance.offlineCapable ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {report.compliance.offlineCapable ? "Functional" : "Issues Found"}
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg border ${
                      report.compliance.securityCompliant
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>🔒</span>
                      <span className="font-medium">Security</span>
                    </div>
                    <div
                      className={`text-sm mt-1 ${
                        report.compliance.securityCompliant ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {report.compliance.securityCompliant ? "Compliant" : "Issues Found"}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Recommendations */}
              {report.recommendations.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                  <div className="space-y-2">
                    {report.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2 text-sm">
                        <Badge className="mt-0.5 bg-orange-100 text-orange-800">{index + 1}</Badge>
                        <span className="text-gray-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Full Report */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Test Results</h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                    {PWATestReporter.generateMarkdownReport(report)}
                  </pre>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-6 text-center py-12">
              <div className="text-gray-500">
                <p className="mb-4">No test report available</p>
                <p className="text-sm">
                  Run automated tests first to generate a comprehensive report
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
