/**
 * Security Audit API Endpoint
 *
 * Runs comprehensive security tests and returns results.
 * Admin-only endpoint for security auditing.
 */

import { NextRequest, NextResponse } from "next/server";
import { SecurityTestRunner, SecurityTestContext } from "@/lib/security/security-tests";
import { Errors } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  try {
    // TODO: Add proper authentication check
    // For now, this is a placeholder for admin-only access

    const body = await request.json();
    const { contexts } = body as { contexts?: SecurityTestContext[] };

    // Create test runner
    const runner = new SecurityTestRunner();

    // Run all security tests
    const results = await runner.runAllTests(contexts || []);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Security audit error:", error);
    return Errors.serverError(error as Error);
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Security audit endpoint. Use POST to run tests.",
    endpoints: {
      runAudit: "POST /api/security/audit",
    },
  });
}
