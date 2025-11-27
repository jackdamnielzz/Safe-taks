/**
 * TRA-Specific PDF Generator
 * Generates comprehensive TRA documents with VCA compliance reporting
 * 
 * Features:
 * - Complete TRA document with all sections
 * - VCA compliance integration
 * - Materials and workplace conditions (Phase 1.3)
 * - Team roles and responsibilities  
 * - Detailed hazard analysis with control measures
 * - Risk matrices and visualizations
 * - Professional Dutch formatting
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { TRA, TaskStep, Hazard, Material, WorkplaceConditions, TeamMemberInfo } from "../types/tra";
import { calculateVCACompliance, type VCAComplianceResult } from "../vca-compliance";
import {
  getRiskLevelColor,
  getRiskLevel,
  getTeamRoleDisplayName,
  groupHazardsByRiskLevel,
  EFFECT_SCORES,
  EXPOSURE_SCORES,
  PROBABILITY_SCORES,
} from "../types/tra";

interface TRAPDFOptions {
  tra: TRA;
  organizationName: string;
  organizationLogo?: string;
  includeVCAReport?: boolean;
  includeSignatures?: boolean;
  includeAuditTrail?: boolean;
  generatedBy: string;
}

export class TRAPDFGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number = 297; // A4 height in mm
  private pageWidth: number = 210; // A4 width in mm
  private margin: number = 15;
  private primaryColor: string = "#f97316"; // Orange - brand color
  private secondaryColor: string = "#fb923c";
  private tra: TRA;
  private vcaResult?: VCAComplianceResult;

  constructor(private options: TRAPDFOptions) {
    this.tra = options.tra;
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Calculate VCA compliance if requested
    if (options.includeVCAReport !== false) {
      this.vcaResult = calculateVCACompliance(this.tra);
    }
  }

  /**
   * Generate complete TRA PDF
   */
  async generate(): Promise<Blob> {
    // Cover page
    this.addCoverPage();

    // Table of contents
    this.addNewPage();
    this.addTableOfContents();

    // Document info
    this.addNewPage();
    this.addDocumentInfo();

    // Team composition
    this.addNewPage();
    this.addTeamComposition();

    // Task steps with hazards
    this.addNewPage();
    this.addTaskSteps();

    // Risk summary
    this.addNewPage();
    this.addRiskSummary();

    // VCA Compliance Report
    if (this.vcaResult) {
      this.addNewPage();
      this.addVCAComplianceReport();
    }

    // Materials list (if any)
    const hasMaterials = this.tra.taskSteps.some(step => step.materials && step.materials.length > 0);
    if (hasMaterials) {
      this.addNewPage();
      this.addMaterialsList();
    }

    // Emergency procedures (if any)
    const hasEmergencyProcedures = this.tra.taskSteps.some(step => step.emergencyProcedure);
    if (hasEmergencyProcedures) {
      this.addNewPage();
      this.addEmergencyProcedures();
    }

    // Signatures (if requested)
    if (this.options.includeSignatures) {
      this.addNewPage();
      this.addSignaturesPage();
    }

    // Add page numbers and footers
    this.addFooters();

    return this.doc.output("blob");
  }

  /**
   * Add cover page
   */
  private addCoverPage(): void {
    // Header background
    this.doc.setFillColor(this.primaryColor);
    this.doc.rect(0, 0, this.pageWidth, 80, "F");

    // Title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(28);
    this.doc.setFont("helvetica", "bold");
    this.safeText("TAAK RISICO ANALYSE", this.pageWidth / 2, 35, { align: "center" });

    // TRA Title
    this.doc.setFontSize(18);
    this.doc.setFont("helvetica", "normal");
    const titleLines = this.doc.splitTextToSize(this.tra.title, this.pageWidth - 40);
    this.safeText(titleLines, this.pageWidth / 2, 55, { align: "center" });

    // Organization name
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "bold");
    this.safeText(this.options.organizationName, this.pageWidth / 2, 110, { align: "center" });

    // Project info
    if (this.tra.projectRef) {
      this.doc.setFontSize(14);
      this.doc.setFont("helvetica", "normal");
      this.safeText(`Project: ${this.tra.projectRef.projectName}`, this.pageWidth / 2, 125, { align: "center" });
    }

    // Status badge
    const statusY = 145;
    this.addStatusBadge(this.tra.status, statusY);

    // Risk level badge
    this.addRiskBadge(this.tra.overallRiskLevel, statusY + 15);

    // Document number and version
    this.doc.setFontSize(11);
    this.doc.setTextColor(100, 100, 100);
    this.safeText(`TRA-${this.tra.id.substring(0, 8).toUpperCase()}`, this.pageWidth / 2, 190, { align: "center" });
    this.safeText(`Versie ${this.tra.version}`, this.pageWidth / 2, 197, { align: "center" });

    // Validity period
    if (this.tra.validFrom && this.tra.validUntil) {
      const validFrom = this.normalizeDate(this.tra.validFrom);
      const validUntil = this.normalizeDate(this.tra.validUntil);
      
      if (validFrom && validUntil) {
        this.doc.setFontSize(10);
        this.safeText(`Geldig van: ${this.formatDate(validFrom)}`, this.pageWidth / 2, 210, { align: "center" });
        this.safeText(`Geldig tot: ${this.formatDate(validUntil)}`, this.pageWidth / 2, 217, { align: "center" });
      }
    }

    // Generated info - move slightly up to free space for footer
    this.doc.setFontSize(9);
    this.doc.setTextColor(128, 128, 128);
    this.safeText(
      `Gegenereerd door: ${this.options.generatedBy}`,
      this.pageWidth / 2,
      255,
      { align: "center" }
    );
    this.safeText(
      `Datum: ${this.formatDate(new Date())}`,
      this.pageWidth / 2,
      262,
      { align: "center" }
    );
 
    // Confidentiality - also move a bit up so it doesn't collide with footer
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.safeText(
      "VERTROUWELIJK - BEDRIJFSGEHEIM",
      this.pageWidth / 2,
      275,
      { align: "center" }
    );
  }

  /**
   * Add table of contents
   */
  private addTableOfContents(): void {
    this.addSectionTitle("Inhoudsopgave");
    this.currentY += 5;

    const sections = [
      "1. Document Informatie",
      "2. Team Samenstelling",
      "3. Taakstappen en Risico's",
      "4. Risico Samenvatting",
    ];

    if (this.vcaResult) {
      sections.push("5. VCA Compliance Rapport");
    }

    const hasMaterials = this.tra.taskSteps.some(step => step.materials && step.materials.length > 0);
    if (hasMaterials) {
      sections.push(`${sections.length + 1}. Materialen Lijst`);
    }

    const hasEmergency = this.tra.taskSteps.some(step => step.emergencyProcedure);
    if (hasEmergency) {
      sections.push(`${sections.length + 1}. Noodprocedures`);
    }

    if (this.options.includeSignatures) {
      sections.push(`${sections.length + 1}. Goedkeuringen en Handtekeningen`);
    }

    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    
    sections.forEach(section => {
      this.checkPageBreak(10);
      this.safeText(section, this.margin, this.currentY);
      this.currentY += 8;
    });
  }

  /**
   * Add document information section
   */
  private addDocumentInfo(): void {
    this.addSectionTitle("1. Document Informatie");
    this.currentY += 5;

    const info: [string, string][] = [
      ["TRA Titel", this.tra.title || "-"],
      ["Document ID", `TRA-${this.tra.id.substring(0, 8).toUpperCase()}`],
      ["Versie", this.tra.version != null ? String(this.tra.version) : "-"],
      ["Status", this.getStatusLabel(this.tra.status)],
      ["Project", this.tra.projectRef?.projectName || "-"],
      ["Gemaakt door", this.tra.createdByName || this.tra.createdBy || "-"],
      (() => {
        const createdAt = this.normalizeDate(this.tra.createdAt);
        return ["Gemaakt op", createdAt ? this.formatDate(createdAt) : "-"];
      })(),
    ];

    if (this.tra.description) {
      info.push(["Beschrijving", this.tra.description]);
    }

    if (this.tra.validFrom) {
      const validFrom = this.normalizeDate(this.tra.validFrom);
      info.push(["Geldig vanaf", validFrom ? this.formatDate(validFrom) : "-"]);
    }

    if (this.tra.validUntil) {
      const validUntil = this.normalizeDate(this.tra.validUntil);
      info.push(["Geldig tot", validUntil ? this.formatDate(validUntil) : "-"]);
    }

    // Render as table
    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Veld", "Waarde"]],
      body: info,
      theme: "striped",
      headStyles: {
        fillColor: this.primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { cellWidth: "auto" },
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 5;
  }

  /**
   * Add team composition section
   */
  private addTeamComposition(): void {
    this.addSectionTitle("2. Team Samenstelling");
    this.currentY += 5;

    const members = this.tra.teamMembersInfo || [];
    
    if (members.length === 0) {
      this.doc.setFontSize(10);
      this.safeText("Geen team leden gespecificeerd.", this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    const tableData = members.map(member => [
      member.name,
      getTeamRoleDisplayName(member.role),
      (member.responsibilities || []).join(", ") || "Niet gespecificeerd",
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Naam", "Rol", "Verantwoordelijkheden"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: this.primaryColor,
        textColor: [255, 255, 255],
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 40 },
        2: { cellWidth: "auto" },
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 5;

    // Required competencies
    if (this.tra.requiredCompetencies && this.tra.requiredCompetencies.length > 0) {
      this.currentY += 5;
      this.addSubSectionTitle("Vereiste Competenties");
      this.currentY += 3;

      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      
      this.tra.requiredCompetencies.forEach(comp => {
        this.checkPageBreak(8);
        this.safeText(`• ${comp}`, this.margin + 5, this.currentY);
        this.currentY += 6;
      });
    }
  }

  /**
   * Add task steps with hazards
   */
  private addTaskSteps(): void {
    this.addSectionTitle("3. Taakstappen en Risico's");
    this.currentY += 5;

    this.tra.taskSteps.forEach((step, index) => {
      this.checkPageBreak(30);
      
      // Step header
      const stepLabel = step.stepNumber ?? index + 1;
      this.addSubSectionTitle(`Stap ${stepLabel}: ${step.description}`);
      this.currentY += 3;

      // Step details
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      
      const details: string[] = [];
      if (step.duration) details.push(`Duur: ${step.duration} minuten`);
      if (step.requiredPersonnel) details.push(`Personen: ${step.requiredPersonnel}`);
      if (step.location) details.push(`Locatie: ${step.location}`);
      
      if (details.length > 0) {
        this.safeText(details.join(" | "), this.margin, this.currentY);
        this.currentY += 6;
      }

      // Workplace conditions (Phase 1.3)
      if (step.workplaceConditions) {
        this.currentY += 2;
        this.addWorkplaceConditions(step.workplaceConditions);
      }

      // Hazards table
      if (step.hazards.length > 0) {
        this.currentY += 3;
        this.addHazardsTable(step.hazards);
      } else {
        this.doc.setFontSize(10);
        this.doc.setTextColor(150, 150, 150);
        this.safeText("Geen gevaren geïdentificeerd voor deze stap.", this.margin, this.currentY);
        this.currentY += 8;
      }

      this.currentY += 5;
    });
  }

  /**
   * Add workplace conditions
   */
  private addWorkplaceConditions(conditions: WorkplaceConditions): void {
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.safeText("Werkomstandigheden:", this.margin, this.currentY);
    this.currentY += 5;

    const conditionLabels: [keyof WorkplaceConditions, string][] = [
      ["lighting", "Verlichting"],
      ["ventilation", "Ventilatie"],
      ["temperature", "Temperatuur"],
      ["noise", "Geluid"],
      ["spaceConstraint", "Ruimte"],
      ["groundCondition", "Ondergrond"],
      ["weatherExposure", "Weer"],
    ];

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);

    const conditionsText = conditionLabels
      .map(([key, label]) => `${label}: ${this.translateCondition(conditions[key] as string)}`)
      .join(" | ");

    const lines = this.doc.splitTextToSize(conditionsText, this.pageWidth - 2 * this.margin);
    this.safeText(lines, this.margin, this.currentY);
    this.currentY += lines.length * 4 + 3;
    
    if (conditions.notes) {
      this.safeText(`Opmerkingen: ${conditions.notes}`, this.margin, this.currentY);
      this.currentY += 5;
    }
  }

  /**
   * Add hazards table for a step
   */
  private addHazardsTable(hazards: Hazard[]): void {
    const tableData = hazards.map(hazard => [
      hazard.description.substring(0, 80) + (hazard.description.length > 80 ? "..." : ""),
      hazard.category,
      `${hazard.effectScore} × ${hazard.exposureScore} × ${hazard.probabilityScore}`,
      hazard.riskScore.toFixed(0),
      this.getRiskLevelLabel(hazard.riskLevel),
      hazard.controlMeasures.length.toString(),
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Gevaar", "Cat.", "E×B×W", "Score", "Niveau", "BBM"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: this.primaryColor,
        textColor: [255, 255, 255],
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20, halign: "center" },
        4: { cellWidth: 25 },
        5: { cellWidth: 15, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 4) {
          const riskLevel = hazards[data.row.index].riskLevel;
          const color = getRiskLevelColor(riskLevel);
          data.cell.styles.fillColor = this.hexToRgb(color);
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY;
  }

  /**
   * Add risk summary section
   */
  private addRiskSummary(): void {
    this.addSectionTitle("4. Risico Samenvatting");
    this.currentY += 5;

    // Overall risk
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.safeText("Totaal Risico Niveau:", this.margin, this.currentY);
    this.currentY += 7;

    this.addRiskBadge(this.tra.overallRiskLevel, this.currentY);
    this.currentY += 20;

    // Risk distribution
    const distribution = groupHazardsByRiskLevel(this.tra.taskSteps);
    const totalHazards = Object.values(distribution).reduce((sum, count) => sum + count, 0);

    // Flatten hazards to compute statistics independent of overallRiskScore
    const allHazards: Hazard[] = [];
    this.tra.taskSteps.forEach((step) => {
      step.hazards.forEach((hazard) => {
        allHazards.push(hazard);
      });
    });

    let highestHazardScore: number | null = null;
    let averageHazardScore: number | null = null;

    if (allHazards.length > 0) {
      let totalScore = 0;
      allHazards.forEach((hazard) => {
        totalScore += hazard.riskScore;
        if (highestHazardScore === null || hazard.riskScore > highestHazardScore) {
          highestHazardScore = hazard.riskScore;
        }
      });
      averageHazardScore = totalScore / allHazards.length;
    }

    const distributionData = Object.entries(distribution).map(([level, count]) => [
      this.getRiskLevelLabel(level as any),
      count.toString(),
      totalHazards > 0 ? `${Math.round((count / totalHazards) * 100)}%` : "0%",
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Risico Niveau", "Aantal", "Percentage"]],
      body: distributionData,
      theme: "striped",
      headStyles: {
        fillColor: this.primaryColor,
        textColor: [255, 255, 255],
      },
      margin: { left: this.margin, right: this.pageWidth / 2 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: 25, halign: "center" },
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;

    // Statistics
    this.addSubSectionTitle("Statistieken");
    this.currentY += 5;

    const overallScore =
      typeof this.tra.overallRiskScore === "number"
        ? this.tra.overallRiskScore
        : null;

    let averageScoreLabel = "Niet berekend";
    if (overallScore != null) {
      averageScoreLabel = overallScore.toFixed(0);
    } else if (averageHazardScore != null) {
      averageScoreLabel = averageHazardScore.toFixed(0);
    }

    let highestScoreLabel = "Niet berekend";
    if (highestHazardScore != null) {
      highestScoreLabel = Number(highestHazardScore).toFixed(0);
    }

    const stats: [string, string][] = [
      ["Totaal aantal stappen", this.tra.taskSteps.length.toString()],
      ["Totaal aantal gevaren", totalHazards.toString()],
      ["Gemiddeld risico score", averageScoreLabel],
      ["Hoogste risico score", highestScoreLabel],
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      body: stats,
      theme: "plain",
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 80 },
        1: { cellWidth: "auto" },
      },
      margin: { left: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY;
  }

  /**
   * Add VCA compliance report
   */
  private addVCAComplianceReport(): void {
    if (!this.vcaResult) return;

    this.addSectionTitle("5. VCA Compliance Rapport");
    this.currentY += 5;

    // Compliance score
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.safeText("VCA Score:", this.margin, this.currentY);
    
    this.doc.setFontSize(24);
    const scoreColor: [number, number, number] = this.vcaResult.isCompliant ? [16, 185, 129] : [239, 68, 68];
    this.doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    this.safeText(`${this.vcaResult.score}/100`, this.margin + 35, this.currentY + 2);
    
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 12;

    // Compliance level
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.safeText(`Status: ${this.getComplianceLevelLabel(this.vcaResult.level)}`, this.margin, this.currentY);
    this.currentY += 10;

    // Issues
    if (this.vcaResult.issues && this.vcaResult.issues.length > 0) {
      this.addSubSectionTitle("Te verbeteren punten");
      this.currentY += 3;

      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      
      this.vcaResult.issues.forEach(issue => {
        const text = this.formatVCAIssue(issue as any);
        if (!text) return;
        this.checkPageBreak(8);
        const lines = this.doc.splitTextToSize(`• ${text}`, this.pageWidth - 2 * this.margin - 5);
        this.safeText(lines, this.margin + 5, this.currentY);
        this.currentY += lines.length * 5;
      });

      this.currentY += 5;
    }

    // Recommendations
    if (this.vcaResult.recommendations && this.vcaResult.recommendations.length > 0) {
      this.addSubSectionTitle("Aanbevelingen");
      this.currentY += 3;

      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      
      this.vcaResult.recommendations.forEach(rec => {
        const text = this.formatVCARecommendation(rec as any);
        if (!text) return;
        this.checkPageBreak(8);
        const lines = this.doc.splitTextToSize(`• ${text}`, this.pageWidth - 2 * this.margin - 5);
        this.safeText(lines, this.margin + 5, this.currentY);
        this.currentY += lines.length * 5;
      });
    }
  }

  /**
   * Add materials list
   */
  private addMaterialsList(): void {
    this.addSectionTitle("Materialen Lijst");
    this.currentY += 5;

    this.tra.taskSteps.forEach((step, index) => {
      if (!step.materials || step.materials.length === 0) return;

      this.checkPageBreak(20);
      
      const stepLabel = step.stepNumber ?? index + 1;
      this.addSubSectionTitle(`Stap ${stepLabel}: ${step.description}`);
      this.currentY += 3;

      const materialData = step.materials.map(mat => [
        mat.name,
        mat.quantity + " " + mat.unit,
        mat.hazardous ? "Ja" : "Nee",
        mat.msdsRequired ? "Vereist" : "Niet vereist",
        mat.storageRequirements || "-",
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [["Materiaal", "Hoeveelheid", "Gevaarlijk", "VIB", "Opslag"]],
        body: materialData,
        theme: "grid",
        headStyles: {
          fillColor: this.primaryColor,
          textColor: [255, 255, 255],
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
        },
        margin: { left: this.margin, right: this.margin },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25, halign: "center" },
          3: { cellWidth: 30, halign: "center" },
          4: { cellWidth: "auto" },
        },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 5;
    });
  }

  /**
   * Add emergency procedures
   */
  private addEmergencyProcedures(): void {
    this.addSectionTitle("Noodprocedures");
    this.currentY += 5;

    this.tra.taskSteps.forEach((step, index) => {
      if (!step.emergencyProcedure) return;

      this.checkPageBreak(30);

      const ep = step.emergencyProcedure;
      
      const stepLabel = step.stepNumber ?? index + 1;
      this.addSubSectionTitle(`Stap ${stepLabel}: ${step.description}`);
      this.currentY += 5;

      // Emergency contacts
      if (ep.emergencyContacts && ep.emergencyContacts.length > 0) {
        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "bold");
        this.safeText("Noodcontacten:", this.margin, this.currentY);
        this.currentY += 5;

        const contactData = ep.emergencyContacts.map(contact => [
          contact.name,
          contact.role,
          contact.phone,
          contact.email || "-",
        ]);

        autoTable(this.doc, {
          startY: this.currentY,
          head: [["Naam", "Rol", "Telefoon", "Email"]],
          body: contactData,
          theme: "grid",
          headStyles: {
            fillColor: this.secondaryColor,
            fontSize: 9,
          },
          bodyStyles: {
            fontSize: 8,
          },
          margin: { left: this.margin, right: this.margin },
        });

        this.currentY = (this.doc as any).lastAutoTable.finalY + 5;
      }

      // Stop work conditions
      if (ep.stopWorkConditions && ep.stopWorkConditions.length > 0) {
        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "bold");
        this.safeText("Stop-werk condities:", this.margin, this.currentY);
        this.currentY += 5;
        
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(9);
        ep.stopWorkConditions.forEach(condition => {
          this.checkPageBreak(6);
          this.safeText(`• ${condition}`, this.margin + 5, this.currentY);
          this.currentY += 5;
        });
        this.currentY += 3;
      }

      this.currentY += 5;
    });
  }

  /**
   * Add signatures page
   */
  private addSignaturesPage(): void {
    this.addSectionTitle("Goedkeuringen en Handtekeningen");
    this.currentY += 10;

    const signatureBoxes = [
      { title: "Opgesteld door", name: this.tra.createdByName || this.tra.createdBy || "-", date: this.tra.createdAt },
      { title: "Beoordeeld door", name: this.tra.approvedBy || "-", date: this.tra.approvedAt },
      { title: "Goedgekeurd door", name: "-", date: undefined },
    ];

    signatureBoxes.forEach((box, index) => {
      const boxY = this.currentY + (index * 60);
      
      // Box
      this.doc.setDrawColor(200, 200, 200);
      this.doc.rect(this.margin, boxY, this.pageWidth - 2 * this.margin, 50);

      // Title
      this.doc.setFontSize(11);
      this.doc.setFont("helvetica", "bold");
      this.safeText(box.title, this.margin + 5, boxY + 8);
      
      // Name
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.safeText(`Naam: ${box.name}`, this.margin + 5, boxY + 20);
      
      // Date
      if (box.date) {
        const date = this.normalizeDate(box.date);
        if (date) {
          this.safeText(`Datum: ${this.formatDate(date)}`, this.margin + 5, boxY + 28);
        }
      }
      
      // Signature line
      this.doc.line(this.margin + 5, boxY + 42, this.pageWidth - this.margin - 5, boxY + 42);
      this.doc.setFontSize(8);
      this.safeText("Handtekening", this.margin + 5, boxY + 47);
    });

    this.currentY += 200;
  }

  private formatVCAIssue(issue: any): string {
    if (!issue) return "";
    if (typeof issue === "string") return issue;

    if (typeof issue === "object") {
      const parts: string[] = [];

      if (issue.description) {
        parts.push(String(issue.description));
      }

      if (issue.suggestion) {
        parts.push(`Suggestie: ${String(issue.suggestion)}`);
      }

      if (issue.category) {
        parts.push(`Categorie: ${String(issue.category)}`);
      }

      return parts.join(" — ") || JSON.stringify(issue);
    }

    return String(issue);
  }

  private formatVCARecommendation(rec: any): string {
    if (!rec) return "";
    if (typeof rec === "string") return rec;

    if (typeof rec === "object") {
      const parts: string[] = [];

      if (rec.description) {
        parts.push(String(rec.description));
      }

      if (rec.suggestion) {
        parts.push(`Suggestie: ${String(rec.suggestion)}`);
      }

      return parts.join(" — ") || JSON.stringify(rec);
    }

    return String(rec);
  }

  /**
   * Utility functions
   */
  
  private safeText(
    text: string | string[] | null | undefined,
    x: number,
    y: number,
    options?: any
  ): void {
    if (Array.isArray(text)) {
      const lines = text.map((t) => (t == null ? "" : String(t)));
      if (options) {
        this.doc.text(lines, x, y, options);
      } else {
        this.doc.text(lines, x, y);
      }
      return;
    }
  
    const safe = text == null ? "" : String(text);
    if (options) {
      this.doc.text(safe, x, y, options);
    } else {
      this.doc.text(safe, x, y);
    }
  }
  
  private addNewPage(): void {
    this.doc.addPage();
    this.currentY = this.margin + 10;
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - 20) {
      this.addNewPage();
    }
  }

  private addSectionTitle(title: string): void {
    this.checkPageBreak(15);
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(this.primaryColor);
    this.safeText(title, this.margin, this.currentY);
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 10;
  }

  private addSubSectionTitle(title: string): void {
    this.checkPageBreak(10);
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.safeText(title, this.margin, this.currentY);
    this.currentY += 6;
  }

  private addStatusBadge(status: string, y: number): void {
    const statusLabels: Record<string, string> = {
      draft: "Concept",
      submitted: "Ingediend",
      approved: "Goedgekeurd",
      active: "Actief",
      expired: "Verlopen",
      rejected: "Afgewezen",
    };

    const label = statusLabels[status] || status;
    const badgeWidth = 50;
    const badgeHeight = 8;
    const x = (this.pageWidth - badgeWidth) / 2;

    this.doc.setFillColor(this.secondaryColor);
    this.doc.roundedRect(x, y, badgeWidth, badgeHeight, 2, 2, "F");
    
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.safeText(label, this.pageWidth / 2, y + 6, { align: "center" });
    this.doc.setTextColor(0, 0, 0);
  }

  private addRiskBadge(riskLevel: string, y: number): void {
    const label = this.getRiskLevelLabel(riskLevel as any);
    const color = getRiskLevelColor(riskLevel as any);
    const badgeWidth = 60;
    const badgeHeight = 10;
    const x = (this.pageWidth - badgeWidth) / 2;

    const rgb = this.hexToRgb(color);
    this.doc.setFillColor(...rgb);
    this.doc.roundedRect(x, y, badgeWidth, badgeHeight, 2, 2, "F");
    
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.safeText(label, this.pageWidth / 2, y + 7, { align: "center" });
    this.doc.setTextColor(0, 0, 0);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat("nl-NL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  /**
   * Normalize various Firestore/JS date shapes to a real Date or null
   */
  private normalizeDate(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) return value;

    if (typeof value === "string" || typeof value === "number") {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }

    // Firestore Timestamp with toDate()
    if (typeof value === "object" && "toDate" in value && typeof (value as any).toDate === "function") {
      try {
        const d = (value as any).toDate();
        return d instanceof Date && !isNaN(d.getTime()) ? d : null;
      } catch {
        return null;
      }
    }

    // Firestore Timestamp-like { seconds: number }
    if (typeof value === "object" && "seconds" in value && typeof (value as any).seconds === "number") {
      const d = new Date((value as any).seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }

    return null;
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: "Concept",
      submitted: "Ingediend",
      in_review: "In behandeling",
      approved: "Goedgekeurd",
      rejected: "Afgewezen",
      active: "Actief",
      expired: "Verlopen",
      archived: "Gearchiveerd",
    };
    return labels[status] || status;
  }

  private getRiskLevelLabel(level: string): string {
    const labels: Record<string, string> = {
      trivial: "Triviaal",
      acceptable: "Acceptabel",
      possible: "Mogelijk",
      substantial: "Substantieel",
      high: "Hoog",
      very_high: "Zeer Hoog",
    };
    return labels[level] || level;
  }

  private getComplianceLevelLabel(level: string): string {
    const labels: Record<string, string> = {
      COMPLIANT: "Volledig Compliant",
      PARTIALLY_COMPLIANT: "Gedeeltelijk Compliant",
      NON_COMPLIANT: "Niet Compliant",
    };
    return labels[level] || level;
  }

  private translateCondition(value: string): string {
    const translations: Record<string, string> = {
      // Lighting
      adequate: "Adequaat",
      poor: "Slecht",
      dark: "Donker",
      bright: "Helder",
      // Ventilation
      good: "Goed",
      moderate: "Matig",
      none: "Geen",
      // Temperature
      comfortable: "Comfortabel",
      hot: "Heet",
      cold: "Koud",
      extreme: "Extreem",
      // Noise
      quiet: "Stil",
      loud: "Luid",
      // Space
      open: "Open",
      confined: "Beperkt",
      cramped: "Krap",
      restricted: "Beperkt",
      // Ground
      stable: "Stabiel",
      uneven: "Oneffen",
      slippery: "Glad",
      unstable: "Onstabiel",
      // Weather
      indoor: "Binnen",
      sheltered: "Beschut",
      exposed: "Blootgesteld",
    };
    return translations[value] || value;
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0];
  }

  private addFooters(): void {
    const pageCount = this.doc.getNumberOfPages();

    // Skip the cover page (page 1) to avoid overlapping with the
    // bottom "VERTROUWELIJK - BEDRIJFSGEHEIM" text on the cover.
    for (let i = 2; i <= pageCount; i++) {
      this.doc.setPage(i);

      // Footer line - clearly separated from the text
      this.doc.setDrawColor(this.primaryColor);
      this.doc.setLineWidth(0.5);
      this.doc.line(
        this.margin,
        this.pageHeight - 14,
        this.pageWidth - this.margin,
        this.pageHeight - 14
      );

      // Footer text row
      this.doc.setFontSize(9);
      this.doc.setTextColor(128, 128, 128);

      const textY = this.pageHeight - 8;

      // Page number (center)
      this.safeText(`Pagina ${i} van ${pageCount}`, this.pageWidth / 2, textY, {
        align: "center",
      });

      // Organization name (left)
      this.safeText(this.options.organizationName, this.margin, textY);

      // Document ID (right)
      this.safeText(
        `TRA-${this.tra.id.substring(0, 8).toUpperCase()}`,
        this.pageWidth - this.margin,
        textY,
        { align: "right" }
      );
    }
  }
}

/**
 * Generate TRA PDF
 */
export async function generateTRAPDF(options: TRAPDFOptions): Promise<Blob> {
  const generator = new TRAPDFGenerator(options);
  return await generator.generate();
}