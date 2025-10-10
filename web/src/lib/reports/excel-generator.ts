/**
 * Excel Report Generator
 * Generates Excel reports with multiple sheets for compliance reporting
 */

import * as XLSX from "xlsx";
import type { ReportTemplate } from "../types/report";
import type { TRA } from "../types/tra";
import type { LMRASession } from "../types/lmra";

interface ExcelGeneratorOptions {
  template: ReportTemplate;
  data: {
    tras?: TRA[];
    lmras?: LMRASession[];
    startDate?: Date;
    endDate?: Date;
  };
  organizationName: string;
  generatedBy: string;
}

export class ExcelReportGenerator {
  constructor(private options: ExcelGeneratorOptions) {}

  /**
   * Generate complete Excel report
   */
  generate(): Blob {
    const workbook = XLSX.utils.book_new();

    // Add summary sheet
    this.addSummarySheet(workbook);

    // Add TRA sheet if data available
    if (this.options.data.tras && this.options.data.tras.length > 0) {
      this.addTRASheet(workbook);
    }

    // Add LMRA sheet if data available
    if (this.options.data.lmras && this.options.data.lmras.length > 0) {
      this.addLMRASheet(workbook);
    }

    // Add compliance sheet
    this.addComplianceSheet(workbook);

    // Convert to blob
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  /**
   * Add summary sheet
   */
  private addSummarySheet(workbook: XLSX.WorkBook): void {
    const data = [
      ["Rapport Samenvatting"],
      [],
      ["Organisatie", this.options.organizationName],
      ["Rapport", this.options.template.name],
      ["Beschrijving", this.options.template.description || ""],
      ["Gegenereerd door", this.options.generatedBy],
      ["Datum", new Date().toLocaleDateString("nl-NL")],
      [],
      ["Periode"],
      ["Van", this.options.data.startDate?.toLocaleDateString("nl-NL") || "-"],
      ["Tot", this.options.data.endDate?.toLocaleDateString("nl-NL") || "-"],
      [],
      ["Statistieken"],
      ["Totaal TRA's", this.options.data.tras?.length || 0],
      ["Totaal LMRA's", this.options.data.lmras?.length || 0],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    worksheet["!cols"] = [{ wch: 20 }, { wch: 40 }];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Samenvatting");
  }

  /**
   * Add TRA sheet
   */
  private addTRASheet(workbook: XLSX.WorkBook): void {
    const tras = this.options.data.tras || [];

    const headers = [
      "ID",
      "Titel",
      "Project",
      "Status",
      "Risico Niveau",
      "Risico Score",
      "Aangemaakt Door",
      "Aanmaak Datum",
      "Goedgekeurd Datum",
      "Geldig Van",
      "Geldig Tot",
      "Team Leden",
      "Aantal Stappen",
      "Aantal Gevaren",
    ];

    const data = tras.map((tra) => [
      tra.id,
      tra.title,
      tra.projectRef?.projectName || "-",
      tra.status,
      tra.overallRiskLevel,
      tra.overallRiskScore,
      tra.createdByName || tra.createdBy,
      this.formatDate(tra.createdAt),
      tra.approvedAt ? this.formatDate(tra.approvedAt) : "-",
      tra.validFrom ? this.formatDate(tra.validFrom) : "-",
      tra.validUntil ? this.formatDate(tra.validUntil) : "-",
      tra.teamMembers.length,
      tra.taskSteps.length,
      tra.taskSteps.reduce((sum, step) => sum + step.hazards.length, 0),
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Set column widths
    worksheet["!cols"] = headers.map(() => ({ wch: 15 }));

    // Add autofilter
    worksheet["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: data.length, c: headers.length - 1 },
      }),
    };

    XLSX.utils.book_append_sheet(workbook, worksheet, "TRA Overzicht");
  }

  /**
   * Add LMRA sheet
   */
  private addLMRASheet(workbook: XLSX.WorkBook): void {
    const lmras = this.options.data.lmras || [];

    const headers = [
      "ID",
      "TRA ID",
      "Project ID",
      "Uitgevoerd Door",
      "Beoordeling",
      "Start Tijd",
      "Eind Tijd",
      "Duur (min)",
      "Locatie Nauwkeurigheid (m)",
      "Team Grootte",
      "Aantal Foto's",
      "Stop Werk",
      "Opmerkingen",
    ];

    const data = lmras.map((lmra) => [
      lmra.id,
      lmra.traId,
      lmra.projectId,
      lmra.performedByName || lmra.performedBy,
      lmra.overallAssessment,
      this.formatDateTime(lmra.startedAt),
      lmra.completedAt ? this.formatDateTime(lmra.completedAt) : "-",
      lmra.duration ? Math.round(lmra.duration / 60) : "-",
      lmra.location?.accuracy || "-",
      lmra.teamMembers.length,
      lmra.photos.length,
      lmra.overallAssessment === "stop_work" ? "Ja" : "Nee",
      lmra.comments || "-",
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Set column widths
    worksheet["!cols"] = headers.map(() => ({ wch: 15 }));

    // Add autofilter
    worksheet["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: data.length, c: headers.length - 1 },
      }),
    };

    XLSX.utils.book_append_sheet(workbook, worksheet, "LMRA Overzicht");
  }

  /**
   * Add compliance sheet
   */
  private addComplianceSheet(workbook: XLSX.WorkBook): void {
    const tras = this.options.data.tras || [];

    // Calculate compliance metrics
    const totalTRAs = tras.length;
    const approvedTRAs = tras.filter(
      (t) => t.status === "approved" || t.status === "active"
    ).length;
    const vcaCompliantTRAs = tras.filter((t) => t.vcaCertified).length;
    const expiredTRAs = tras.filter((t) => t.status === "expired").length;
    const highRiskTRAs = tras.filter(
      (t) => t.overallRiskLevel === "high" || t.overallRiskLevel === "very_high"
    ).length;

    const complianceRate = totalTRAs > 0 ? ((approvedTRAs / totalTRAs) * 100).toFixed(1) : "0";
    const vcaComplianceRate =
      totalTRAs > 0 ? ((vcaCompliantTRAs / totalTRAs) * 100).toFixed(1) : "0";

    const data = [
      ["Compliance Rapport"],
      [],
      ["Algemene Statistieken"],
      ["Totaal TRA's", totalTRAs],
      ["Goedgekeurde TRA's", approvedTRAs],
      ["Compliance Rate", `${complianceRate}%`],
      [],
      ["VCA Compliance"],
      ["VCA Gecertificeerde TRA's", vcaCompliantTRAs],
      ["VCA Compliance Rate", `${vcaComplianceRate}%`],
      [],
      ["Risico Analyse"],
      ["Hoog Risico TRA's", highRiskTRAs],
      ["Verlopen TRA's", expiredTRAs],
      [],
      ["Status Verdeling"],
      ["Status", "Aantal", "Percentage"],
    ];

    // Add status breakdown
    const statusCounts: Record<string, number> = {};
    tras.forEach((tra) => {
      statusCounts[tra.status] = (statusCounts[tra.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = totalTRAs > 0 ? ((count / totalTRAs) * 100).toFixed(1) : "0";
      data.push([status, count, `${percentage}%`]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    worksheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Compliance");
  }

  /**
   * Format date
   */
  private formatDate(date: Date | any): string {
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString("nl-NL");
  }

  /**
   * Format date and time
   */
  private formatDateTime(date: Date | any): string {
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleString("nl-NL");
  }
}

/**
 * Generate Excel report
 */
export function generateExcelReport(options: ExcelGeneratorOptions): Blob {
  const generator = new ExcelReportGenerator(options);
  return generator.generate();
}
