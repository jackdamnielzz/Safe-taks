"use client";

/**
 * PWA Test Runner Component
 * Provides a UI for running comprehensive PWA tests across different platforms
 */

import React, { useState, useCallback } from "react";
import { pwaTester, PWATestSuite, PWATestResult } from "@/lib/pwa-tests";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";

interface PWATestRunnerProps {
  onTestComplete?: (results: PWATestSuite) => void;
  className?: string;
}

export function PWATestRunner({ onTestComplete, className }: PWATestRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<PWATestSuite | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setError(null);

    try {
      const results = await pwaTester.runAllTests();
      setTestResults(results);
      onTestComplete?.(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test execution failed");
    } finally {
      setIsRunning(false);
    }
  }, [onTestComplete]);

  const runSpecificTest = useCallback(
    async (testName: string) => {
      setIsRunning(true);
      setError(null);

      try {
        let result: PWATestResult;

        switch (testName) {
          case "manifest":
            result = await pwaTester.testManifest();
            break;
          case "service-worker":
            result = await pwaTester.testServiceWorker();
            break;
          case "installability":
            result = await pwaTester.testInstallability();
            break;
          case "offline":
            result = await pwaTester.testOfflineFunctionality();
            break;
          case "security":
            result = await pwaTester.testSecurityRequirements();
            break;
          case "performance":
            result = await pwaTester.testPerformanceRequirements();
            break;
          case "ios-safari":
            result = await pwaTester.testIOSSafari();
            break;
          case "android-chrome":
            result = await pwaTester.testAndroidChrome();
            break;
          default:
            throw new Error(`Unknown test: ${testName}`);
        }

        // Update results with single test
        const newResults: PWATestSuite = {
          name: "SafeWork Pro PWA Test Suite",
          tests: [result],
          summary: {
            total: 1,
            passed: result.status === "PASS" ? 1 : 0,
            failed: result.status === "FAIL" ? 1 : 0,
            warnings: result.status === "WARN" ? 1 : 0,
            skipped: result.status === "SKIP" ? 1 : 0,
          },
        };

        setTestResults(newResults);
        onTestComplete?.(newResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Test execution failed");
      } finally {
        setIsRunning(false);
      }
    },
    [onTestComplete]
  );

  const getStatusIcon = (status: PWATestResult["status"]) => {
    switch (status) {
      case "PASS":
        return "✅";
      case "FAIL":
        return "❌";
      case "WARN":
        return "⚠️";
      case "SKIP":
        return "⏭️";
      default:
        return "❓";
    }
  };

  const getStatusColor = (status: PWATestResult["status"]) => {
    switch (status) {
      case "PASS":
        return "bg-green-100 text-green-800 border-green-200";
      case "FAIL":
        return "bg-red-100 text-red-800 border-red-200";
      case "WARN":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "SKIP":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className={`pwa-test-runner ${className}`}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">PWA Test Suite</h2>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive Progressive Web App testing across platforms
            </p>
          </div>
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isRunning ? "Running Tests..." : "Run All Tests"}
          </Button>
        </div>

        {error && (
          <Alert className="mb-6" variant="error">
            {error}
          </Alert>
        )}

        {testResults && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900">{testResults.summary.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.summary.passed}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{testResults.summary.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {testResults.summary.warnings}
                </div>
                <div className="text-sm text-gray-600">Warnings</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {testResults.summary.skipped}
                </div>
                <div className="text-sm text-gray-600">Skipped</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Test Results</h3>
              {testResults.tests.map((test, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getStatusIcon(test.status)}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{test.testName}</h4>
                          <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{test.message}</p>
                        {test.details && (
                          <details className="text-sm">
                            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                              View Details
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                              {JSON.stringify(test.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        runSpecificTest(test.testName.toLowerCase().replace(/ /g, "-"))
                      }
                      disabled={isRunning}
                    >
                      Re-run
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!testResults && !isRunning && (
          <div className="text-center py-8 text-gray-500">
            <p>Click "Run All Tests" to start PWA validation</p>
          </div>
        )}

        {isRunning && (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
              <span>Running PWA tests...</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
