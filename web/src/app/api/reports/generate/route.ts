/**
 * Report Generation API
 * POST /api/reports/generate - Generate PDF or Excel report
 */

import { NextRequest, NextResponse } from "next/server";
import { generatePDFReport } from "@/lib/reports/pdf-generator";
import { generateExcelReport } from "@/lib/reports/excel-generator";
import { Errors } from "@/lib/api/errors";
import type { GenerateReportRequest } from "@/lib/types/report";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: GenerateReportRequest = await request.json();
    const { templateId, format, dataStartDate, dataEndDate, customBranding } = body;

    if (!templateId || !format) {
      return Errors.requiredField("templateId and format");
    }

    if (!["pdf", "excel"].includes(format)) {
      return Errors.invalidFormat("format", "pdf or excel");
    }

    // Mock template for now (will be replaced with actual Firestore query)
    const template: any = {
      id: templateId,
      name: "Maandelijks Veiligheidsrapport",
      description: "Overzicht van veiligheidsprestaties",
      sections: [],
      branding: customBranding || {
        primaryColor: "#f97316",
        secondaryColor: "#fb923c",
      },
    };

    // Mock data (will be replaced with actual Firestore queries)
    const data = {
      tras: [],
      lmras: [],
      startDate: dataStartDate ? new Date(dataStartDate) : new Date(),
      endDate: dataEndDate ? new Date(dataEndDate) : new Date(),
    };

    const organizationName = "Demo Organization";
    const generatedBy = "System User";

    // Generate report
    let blob: Blob;
    if (format === "pdf") {
      blob = await generatePDFReport({
        template,
        data,
        organizationName,
        generatedBy,
      });
    } else {
      blob = generateExcelReport({
        template,
        data,
        organizationName,
        generatedBy,
      });
    }

    // Convert blob to base64 for response
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({
      success: true,
      data: {
        reportId: `report-${Date.now()}`,
        format,
        fileName: `rapport-${new Date().toISOString().split("T")[0]}.${format === "pdf" ? "pdf" : "xlsx"}`,
        content: base64,
        size: blob.size,
      },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return Errors.serverError(error instanceof Error ? error : undefined);
  }
}
