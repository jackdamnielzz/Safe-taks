/**
 * PDF Report Generator
 * Generates professional PDF reports with custom branding using jsPDF
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportTemplate, ReportSection } from "../types/report";
import type { TRA } from "../types/tra";
import type { LMRASession } from "../types/lmra";

interface PDFGeneratorOptions {
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

export class PDFReportGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number = 297; // A4 height in mm
  private pageWidth: number = 210; // A4 width in mm
  private margin: number = 20;
  private primaryColor: string;
  private secondaryColor: string;

  constructor(private options: PDFGeneratorOptions) {
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    this.primaryColor = options.template.branding?.primaryColor || "#f97316";
    this.secondaryColor = options.template.branding?.secondaryColor || "#fb923c";
  }

  /**
   * Generate complete PDF report
   */
  async generate(): Promise<Blob> {
    // Add cover page
    this.addCoverPage();

    // Add table of contents
    this.addNewPage();
    this.addTableOfContents();

    // Process each section
    for (const section of this.options.template.sections) {
      this.addNewPage();
      await this.renderSection(section);
    }

    // Add footer to all pages
    this.addFooters();

    // Return as blob
    return this.doc.output("blob");
  }

  /**
   * Add cover page
   */
  private addCoverPage(): void {
    // Background color
    this.doc.setFillColor(this.primaryColor);
    this.doc.rect(0, 0, this.pageWidth, 100, "F");

    // Title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(32);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(this.options.template.name, this.pageWidth / 2, 50, { align: "center" });

    // Subtitle
    if (this.options.template.description) {
      this.doc.setFontSize(14);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(this.options.template.description, this.pageWidth / 2, 65, { align: "center" });
    }

    // Organization name
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(this.options.organizationName, this.pageWidth / 2, 130, { align: "center" });

    // Date range
    if (this.options.data.startDate && this.options.data.endDate) {
      this.doc.setFontSize(12);
      this.doc.setFont("helvetica", "normal");
      const dateRange = `${this.formatDate(this.options.data.startDate)} - ${this.formatDate(this.options.data.endDate)}`;
      this.doc.text(dateRange, this.pageWidth / 2, 145, { align: "center" });
    }

    // Generated info
    this.doc.setFontSize(10);
    this.doc.setTextColor(128, 128, 128);
    this.doc.text(`Gegenereerd door: ${this.options.generatedBy}`, this.pageWidth / 2, 270, {
      align: "center",
    });
    this.doc.text(`Datum: ${this.formatDate(new Date())}`, this.pageWidth / 2, 277, {
      align: "center",
    });

    // Confidentiality marking
    this.doc.setFontSize(8);
    this.doc.text("VERTROUWELIJK - INTERN GEBRUIK", this.pageWidth / 2, 290, { align: "center" });
  }

  /**
   * Add table of contents
   */
  private addTableOfContents(): void {
    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(0, 0, 0);
    this.doc.text("Inhoudsopgave", this.margin, this.currentY);
    this.currentY += 15;

    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");

    this.options.template.sections.forEach((section, index) => {
      const title = section.title || this.getSectionTypeName(section.type);
      const pageNum = index + 3; // Cover + TOC + sections

      this.doc.text(`${index + 1}. ${title}`, this.margin, this.currentY);
      this.doc.text(`${pageNum}`, this.pageWidth - this.margin, this.currentY, { align: "right" });
      this.currentY += 7;
    });
  }

  /**
   * Render individual section
   */
  private async renderSection(section: ReportSection): Promise<void> {
    // Section title
    this.doc.setFontSize(18);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(this.primaryColor);
    this.doc.text(
      section.title || this.getSectionTypeName(section.type),
      this.margin,
      this.currentY
    );
    this.currentY += 10;

    // Reset text color
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(11);

    // Render based on section type
    switch (section.type) {
      case "executive_summary":
        this.renderExecutiveSummary(section as any);
        break;
      case "text_block":
        this.renderTextBlock(section as any);
        break;
      case "data_table":
        this.renderDataTable(section as any);
        break;
      case "chart":
        this.renderChartPlaceholder(section as any);
        break;
      case "tra_list":
        this.renderTRAList(section as any);
        break;
      case "lmra_list":
        this.renderLMRAList(section as any);
        break;
      case "page_break":
        // Page break handled automatically
        break;
      default:
        this.doc.text(`[${this.getSectionTypeName(section.type)}]`, this.margin, this.currentY);
        this.currentY += 10;
    }
  }

  /**
   * Render executive summary
   */
  private renderExecutiveSummary(section: any): void {
    const lines = this.doc.splitTextToSize(section.content, this.pageWidth - 2 * this.margin);
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += lines.length * 7;

    if (section.highlights && section.highlights.length > 0) {
      this.currentY += 5;
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Belangrijkste Punten:", this.margin, this.currentY);
      this.currentY += 7;
      this.doc.setFont("helvetica", "normal");

      section.highlights.forEach((highlight: string) => {
        this.doc.text(`• ${highlight}`, this.margin + 5, this.currentY);
        this.currentY += 7;
      });
    }
  }

  /**
   * Render text block
   */
  private renderTextBlock(section: any): void {
    const lines = this.doc.splitTextToSize(section.content, this.pageWidth - 2 * this.margin);
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += lines.length * 7 + 5;
  }

  /**
   * Render data table
   */
  private renderDataTable(section: any): void {
    if (!section.config || !section.config.columns) return;

    const headers = section.config.columns.map((col: any) => col.label);
    const data: any[][] = [];

    // Mock data for demonstration
    for (let i = 0; i < 5; i++) {
      const row = section.config.columns.map((col: any) => `Data ${i + 1}`);
      data.push(row);
    }

    autoTable(this.doc, {
      startY: this.currentY,
      head: [headers],
      body: data,
      theme: "striped",
      headStyles: {
        fillColor: this.primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      margin: { left: this.margin, right: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Render chart placeholder
   */
  private renderChartPlaceholder(section: any): void {
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setFillColor(245, 245, 245);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 80, "FD");

    this.doc.setFontSize(10);
    this.doc.setTextColor(128, 128, 128);
    this.doc.text("[Grafiek wordt hier weergegeven]", this.pageWidth / 2, this.currentY + 40, {
      align: "center",
    });

    this.currentY += 90;
  }

  /**
   * Render TRA list
   */
  private renderTRAList(section: any): void {
    const tras = this.options.data.tras || [];

    if (tras.length === 0) {
      this.doc.text("Geen TRA's gevonden voor deze periode.", this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    const headers = ["Titel", "Project", "Status", "Risico", "Datum"];
    const data = tras
      .slice(0, 10)
      .map((tra) => [
        tra.title,
        tra.projectRef?.projectName || "-",
        tra.status,
        tra.overallRiskLevel,
        this.formatDate(
          tra.createdAt instanceof Date ? tra.createdAt : (tra.createdAt as any).toDate()
        ),
      ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [headers],
      body: data,
      theme: "grid",
      headStyles: {
        fillColor: this.primaryColor,
        textColor: [255, 255, 255],
      },
      margin: { left: this.margin, right: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Render LMRA list
   */
  private renderLMRAList(section: any): void {
    const lmras = this.options.data.lmras || [];

    if (lmras.length === 0) {
      this.doc.text("Geen LMRA's gevonden voor deze periode.", this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    const headers = ["TRA", "Locatie", "Beoordeling", "Datum"];
    const data = lmras
      .slice(0, 10)
      .map((lmra) => [
        lmra.traId || "-",
        `${lmra.location?.coordinates?.latitude || 0}, ${lmra.location?.coordinates?.longitude || 0}`,
        lmra.overallAssessment || "-",
        this.formatDate(
          lmra.startedAt instanceof Date ? lmra.startedAt : (lmra.startedAt as any).toDate()
        ),
      ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [headers],
      body: data,
      theme: "grid",
      headStyles: {
        fillColor: this.primaryColor,
        textColor: [255, 255, 255],
      },
      margin: { left: this.margin, right: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Add new page
   */
  private addNewPage(): void {
    this.doc.addPage();
    this.currentY = this.margin;
  }

  /**
   * Add footers to all pages
   */
  private addFooters(): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // Footer line
      this.doc.setDrawColor(this.primaryColor);
      this.doc.setLineWidth(0.5);
      this.doc.line(
        this.margin,
        this.pageHeight - 15,
        this.pageWidth - this.margin,
        this.pageHeight - 15
      );

      // Page number
      this.doc.setFontSize(9);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(`Pagina ${i} van ${pageCount}`, this.pageWidth / 2, this.pageHeight - 10, {
        align: "center",
      });

      // Organization name
      this.doc.text(this.options.organizationName, this.margin, this.pageHeight - 10);

      // Date
      this.doc.text(
        this.formatDate(new Date()),
        this.pageWidth - this.margin,
        this.pageHeight - 10,
        { align: "right" }
      );
    }
  }

  /**
   * Format date
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat("nl-NL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  /**
   * Get section type name
   */
  private getSectionTypeName(type: string): string {
    const names: Record<string, string> = {
      executive_summary: "Managementsamenvatting",
      kpi_widget: "KPI Widget",
      chart: "Grafiek",
      data_table: "Gegevenstabel",
      tra_list: "TRA Lijst",
      lmra_list: "LMRA Lijst",
      photo_gallery: "Fotogalerij",
      text_block: "Tekstblok",
      risk_matrix: "Risicomatrix",
      compliance_summary: "Compliance Samenvatting",
      page_break: "Pagina-einde",
    };
    return names[type] || type;
  }
}

/**
 * Generate PDF report
 */
export async function generatePDFReport(options: PDFGeneratorOptions): Promise<Blob> {
  const generator = new PDFReportGenerator(options);
  return await generator.generate();
}
