/**
 * GDPR Data Export API
 *
 * Implements GDPR Article 20 - Right to Data Portability
 * Allows users to export all their personal data
 */

import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/server-helpers";
import { GDPRComplianceService } from "@/lib/gdpr/gdpr-compliance";
import { logReportGenerated } from "@/lib/audit/audit-trail";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await requireOrgAuth();
    const { uid: userId, orgId } = auth;
    const body = await request.json();
    const { includeAuditLogs = false, format = "json" } = body;

    // Export user data
    const exportedData = await GDPRComplianceService.exportUserData(
      orgId,
      userId,
      includeAuditLogs
    );

    // Log the export
    await logReportGenerated({
      organizationId: orgId,
      reportId: `export-${Date.now()}`,
      reportName: "GDPR Data Export",
      actorId: userId,
      actorName: exportedData.profile.displayName || exportedData.profile.email,
      format: "pdf",
      templateId: "gdpr-export",
    });

    // Return data based on format
    if (format === "csv") {
      // Convert to CSV format (simplified)
      const csv = convertToCSV(exportedData);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="gdpr-export-${userId}-${Date.now()}.csv"`,
        },
      });
    }

    // Default: JSON format
    return NextResponse.json({
      success: true,
      data: exportedData,
      exportDate: new Date().toISOString(),
      format: "json",
    });
  } catch (error) {
    console.error("GDPR export error:", error);
    return NextResponse.json(
      { error: "Failed to export data", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Convert exported data to CSV format
 */
function convertToCSV(data: any): string {
  const lines: string[] = [];

  // Profile section
  lines.push("PROFILE");
  lines.push("Field,Value");
  lines.push(`User ID,${data.profile.userId}`);
  lines.push(`Email,${data.profile.email}`);
  lines.push(`Display Name,${data.profile.displayName || ""}`);
  lines.push(`Role,${data.profile.role}`);
  lines.push(`Created At,${data.profile.createdAt}`);
  lines.push("");

  // TRAs section
  lines.push("TRAS");
  lines.push(`Total TRAs,${data.tras.length}`);
  lines.push("");

  // LMRA Sessions section
  lines.push("LMRA SESSIONS");
  lines.push(`Total Sessions,${data.lmraSessions.length}`);
  lines.push("");

  // Consents section
  lines.push("CONSENTS");
  lines.push("Type,Granted,Timestamp");
  data.consents.forEach((consent: any) => {
    lines.push(`${consent.consentType},${consent.granted},${consent.timestamp}`);
  });

  return lines.join("\n");
}
