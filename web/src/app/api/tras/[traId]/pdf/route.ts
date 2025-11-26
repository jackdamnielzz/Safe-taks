/**
 * TRA PDF Export API Endpoint
 * Generates a comprehensive PDF document for a TRA
 * 
 * GET /api/tras/[traId]/pdf
 * 
 * Features:
 * - Complete TRA document with VCA compliance
 * - Materials and workplace conditions
 * - Team roles and responsibilities
 * - Hazard analysis with control measures
 * - Analytics tracking for exports
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";
import { generateTRAPDF } from "@/lib/reports/tra-pdf-generator";
import type { TRA } from "@/lib/types/tra";
import { trackTRAExported } from "@/lib/analytics/analytics-service";
import { AuditTrailService } from "@/lib/audit/audit-trail";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    traId: string;
  };
}

/**
 * Generate and download TRA PDF
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // 1. Authentication check - reuse org-scoped auth helper
    const auth = await requireOrgAuth(request).catch(() => null);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid or missing token" },
        { status: 401 }
      );
    }

    const { orgId, uid } = auth;
    const traId = params.traId;

    // 2. Fetch TRA document from org-scoped collection
    const { firestore } = initializeAdmin();
    const traDocRef = firestore
      .collection(`organizations/${orgId}/tras`)
      .doc(traId);
    const traDoc = await traDocRef.get();

    if (!traDoc.exists) {
      return NextResponse.json(
        { error: "TRA not found" },
        { status: 404 }
      );
    }

    const tra = {
      id: traDoc.id,
      ...traDoc.data(),
    } as TRA;

    // Optional safety check: ensure TRA belongs to authenticated org
    if (tra.organizationId && tra.organizationId !== orgId) {
      return NextResponse.json(
        { error: "Forbidden - You do not have access to this TRA" },
        { status: 403 }
      );
    }

    // 3. Get user details
    const userDoc = await firestore.collection("users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // 4. Fetch organization details
    const orgDoc = await firestore.collection("organizations").doc(orgId).get();

    const orgName = orgDoc.exists
      ? orgDoc.data()?.name || "Organization"
      : "Organization";

    // 5. Parse query parameters for customization
    const searchParams = request.nextUrl.searchParams;
    const includeVCAReport = searchParams.get("includeVCA") !== "false";
    const includeSignatures = searchParams.get("includeSignatures") === "true";

    // 6. Generate PDF
    const pdfBlob = await generateTRAPDF({
      tra,
      organizationName: orgName,
      includeVCAReport,
      includeSignatures,
      generatedBy: userData?.name || userData?.email || "System",
    });

    // 7. Track analytics
    try {
      trackTRAExported({
        traId: tra.id,
        format: "pdf",
      });
    } catch (analyticsError) {
      console.error("Failed to track PDF export:", analyticsError);
      // Don't fail the request if analytics fails
    }

    // 8. Log audit trail
    try {
      await AuditTrailService.writeLog({
        eventType: "report_exported",
        category: "report",
        severity: "info",
        actorId: uid,
        actorName: userData?.name,
        subjectType: "tra",
        subjectId: tra.id,
        subjectName: tra.title,
        organizationId: orgId,
        metadata: {
          format: "pdf",
          includeVCA: includeVCAReport,
          includeSignatures,
        },
        complianceRelevant: true,
      });
    } catch (auditError) {
      console.error("Failed to log audit trail:", auditError);
      // Don't fail the request if audit logging fails
    }

    // 9. Generate filename
    const filename = `TRA-${tra.title.replace(/[^a-z0-9]/gi, "_")}-${traId.substring(0, 8)}.pdf`;

    // 10. Convert Blob to Buffer for Next.js response
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 11. Return PDF response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Error generating TRA PDF:", error);

    // Return appropriate error response
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Failed to generate PDF",
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get PDF generation options/metadata (optional endpoint for UI)
 */
export async function HEAD(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const auth = await requireOrgAuth(request).catch(() => null);
    if (!auth) {
      return new NextResponse(null, { status: 401 });
    }

    const { orgId } = auth;
    const { firestore } = initializeAdmin();
    const traId = params.traId;
    const traDocRef = firestore
      .collection(`organizations/${orgId}/tras`)
      .doc(traId);
    const traDoc = await traDocRef.get();

    if (!traDoc.exists) {
      return new NextResponse(null, { status: 404 });
    }

    const tra = traDoc.data() as TRA;

    // Return metadata about what can be included in the PDF
    return new NextResponse(null, {
      status: 200,
      headers: {
        "X-PDF-Available": "true",
        "X-VCA-Report-Available": "true",
        "X-Signatures-Available": tra.status === "approved" ? "true" : "false",
        "X-Materials-Available": tra.taskSteps.some((s) => s.materials?.length)
          ? "true"
          : "false",
        "X-Emergency-Procedures-Available": tra.taskSteps.some(
          (s) => s.emergencyProcedure
        )
          ? "true"
          : "false",
      },
    });
  } catch (error) {
    console.error("Error checking PDF availability:", error);
    return new NextResponse(null, { status: 500 });
  }
}