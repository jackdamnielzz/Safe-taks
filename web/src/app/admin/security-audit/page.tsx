"use client";

/**
 * Security Audit Dashboard
 *
 * Admin interface for running security audits and viewing results.
 * Displays comprehensive security test results with severity indicators.
 */

import { useState } from "react";
import { SecurityTestSuite, SecurityTestResult } from "@/lib/security/security-tests";

export default function SecurityAuditPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SecurityTestSuite | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSecurityAudit = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/security/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contexts: [
            {
              orgId: "test-org-1",
              userId: "test-user-1",
              role: "admin",
            },
            {
              orgId: "test-org-2",
              userId: "test-user-2",
              role: "field_worker",
            },
          ],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.data);
      } else {
        setError(data.error?.message || "Failed to run security audit");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-green-100 text-green-800 border-green-300";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "authentication":
        return "🔐";
      case "authorization":
        return "🛡️";
      case "data-isolation":
        return "🔒";
      case "firebase-rules":
        return "🔥";
      case "input-validation":
        return "✅";
      case "rate-limiting":
        return "⏱️";
      default:
        return "📋";
    }
  };

  const downloadReport = () => {
    if (!results) return;

    const report = generateMarkdownReport(results);
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-audit-${new Date().toISOString()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateMarkdownReport = (suite: SecurityTestSuite): string => {
    let report = `# Security Audit Report\n\n`;
    report += `**Generated**: ${new Date().toISOString()}\n`;
    report += `**Duration**: ${suite.duration}ms\n\n`;

    report += `## Executive Summary\n\n`;
    report += `- **Total Tests**: ${suite.totalTests}\n`;
    report += `- **Passed**: ${suite.passed} (${Math.round((suite.passed / suite.totalTests) * 100)}%)\n`;
    report += `- **Failed**: ${suite.failed}\n`;
    report += `- **Critical Issues**: ${suite.critical}\n`;
    report += `- **High Priority Issues**: ${suite.high}\n`;
    report += `- **Medium Priority Issues**: ${suite.medium}\n`;
    report += `- **Low Priority Issues**: ${suite.low}\n\n`;

    const criticalIssues = suite.results.filter((r) => !r.passed && r.severity === "critical");
    const highIssues = suite.results.filter((r) => !r.passed && r.severity === "high");
    const mediumIssues = suite.results.filter((r) => !r.passed && r.severity === "medium");

    if (criticalIssues.length > 0) {
      report += `## 🚨 Critical Issues\n\n`;
      criticalIssues.forEach((issue) => {
        report += `### ${issue.testName}\n`;
        report += `- **Category**: ${issue.category}\n`;
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
        report += `- **Category**: ${issue.category}\n`;
        report += `- **Message**: ${issue.message}\n`;
        if (issue.recommendation) {
          report += `- **Recommendation**: ${issue.recommendation}\n`;
        }
        report += `\n`;
      });
    }

    if (mediumIssues.length > 0) {
      report += `## ℹ️ Medium Priority Issues\n\n`;
      mediumIssues.forEach((issue) => {
        report += `### ${issue.testName}\n`;
        report += `- **Category**: ${issue.category}\n`;
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

    return report;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔒 Security Audit Dashboard</h1>
          <p className="text-gray-600">
            Comprehensive security testing for Firebase rules, authentication, and data isolation
          </p>
        </div>

        {/* Run Audit Button */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Run Security Audit</h2>
              <p className="text-sm text-gray-600">
                Execute comprehensive security tests across all categories
              </p>
            </div>
            <button
              onClick={runSecurityAudit}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isRunning
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isRunning ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Running Audit...
                </span>
              ) : (
                "Run Security Audit"
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm font-medium text-gray-600 mb-1">Total Tests</div>
                <div className="text-3xl font-bold text-gray-900">{results.totalTests}</div>
              </div>
              <div className="bg-green-50 rounded-lg shadow-sm p-6">
                <div className="text-sm font-medium text-green-600 mb-1">Passed</div>
                <div className="text-3xl font-bold text-green-700">
                  {results.passed}
                  <span className="text-lg ml-2">
                    ({Math.round((results.passed / results.totalTests) * 100)}%)
                  </span>
                </div>
              </div>
              <div className="bg-red-50 rounded-lg shadow-sm p-6">
                <div className="text-sm font-medium text-red-600 mb-1">Failed</div>
                <div className="text-3xl font-bold text-red-700">{results.failed}</div>
              </div>
              <div className="bg-orange-50 rounded-lg shadow-sm p-6">
                <div className="text-sm font-medium text-orange-600 mb-1">Critical/High</div>
                <div className="text-3xl font-bold text-orange-700">
                  {results.critical + results.high}
                </div>
              </div>
            </div>

            {/* Download Report Button */}
            <div className="mb-6">
              <button
                onClick={downloadReport}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                📥 Download Report
              </button>
            </div>

            {/* Test Results */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {results.results.map((result, index) => (
                  <div key={index} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-2">{getCategoryIcon(result.category)}</span>
                          <h3 className="text-base font-medium text-gray-900">{result.testName}</h3>
                          <span
                            className={`ml-3 px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(result.severity)}`}
                          >
                            {result.severity.toUpperCase()}
                          </span>
                          <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            {result.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                        {result.recommendation && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Recommendation:</strong> {result.recommendation}
                            </p>
                          </div>
                        )}
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                              View Details
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      <div className="ml-4">
                        {result.passed ? (
                          <span className="text-green-500 text-2xl">✓</span>
                        ) : (
                          <span className="text-red-500 text-2xl">✗</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Info */}
            <div className="mt-6 bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <strong>Start Time:</strong> {new Date(results.startTime).toLocaleString()}
                </div>
                <div>
                  <strong>End Time:</strong> {new Date(results.endTime).toLocaleString()}
                </div>
                <div>
                  <strong>Duration:</strong> {results.duration}ms
                </div>
              </div>
            </div>
          </>
        )}

        {/* Initial State */}
        {!results && !isRunning && !error && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Audit Results Yet</h3>
            <p className="text-gray-600 mb-6">
              Click "Run Security Audit" to start comprehensive security testing
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🔐</div>
                <div className="text-sm font-medium text-gray-900">Authentication</div>
                <div className="text-xs text-gray-600">Token validation, session security</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🛡️</div>
                <div className="text-sm font-medium text-gray-900">Authorization</div>
                <div className="text-xs text-gray-600">RBAC, permissions</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🔒</div>
                <div className="text-sm font-medium text-gray-900">Data Isolation</div>
                <div className="text-xs text-gray-600">Multi-tenant security</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🔥</div>
                <div className="text-sm font-medium text-gray-900">Firebase Rules</div>
                <div className="text-xs text-gray-600">Firestore security</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">✅</div>
                <div className="text-sm font-medium text-gray-900">Input Validation</div>
                <div className="text-xs text-gray-600">XSS, injection prevention</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">⏱️</div>
                <div className="text-sm font-medium text-gray-900">Rate Limiting</div>
                <div className="text-xs text-gray-600">API protection</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
