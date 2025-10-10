/**
 * VCA Compliance Validator
 * Validates TRAs against VCA (Veiligheid, Gezondheid en Milieu Checklist Aannemers) requirements
 */

import type { TRA } from "../types/tra";
import type { TRATemplate } from "../types/template";

export interface VCAComplianceResult {
  isCompliant: boolean;
  score: number; // 0-100
  issues: VCAIssue[];
  recommendations: string[];
  certificationReady: boolean;
}

export interface VCAIssue {
  severity: "critical" | "major" | "minor";
  category: string;
  description: string;
  requirement: string;
  suggestion?: string;
}

export class VCAValidator {
  private readonly VCA_VERSION = "VCA 2017 v5.1";
  private readonly MIN_COMPLIANCE_SCORE = 85; // Minimum score for certification

  /**
   * Validate TRA against VCA requirements
   */
  validateTRA(tra: TRA): VCAComplianceResult {
    const issues: VCAIssue[] = [];
    let score = 100;

    // 1. Check basic information completeness
    score -= this.checkBasicInformation(tra, issues);

    // 2. Check risk assessment methodology
    score -= this.checkRiskAssessment(tra, issues);

    // 3. Check control measures
    score -= this.checkControlMeasures(tra, issues);

    // 4. Check team competencies
    score -= this.checkTeamCompetencies(tra, issues);

    // 5. Check approval workflow
    score -= this.checkApprovalWorkflow(tra, issues);

    // 6. Check validity period
    score -= this.checkValidityPeriod(tra, issues);

    // 7. Check documentation quality
    score -= this.checkDocumentation(tra, issues);

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues);

    return {
      isCompliant:
        score >= this.MIN_COMPLIANCE_SCORE &&
        issues.filter((i) => i.severity === "critical").length === 0,
      score: Math.max(0, score),
      issues,
      recommendations,
      certificationReady: score >= 95 && issues.length === 0,
    };
  }

  /**
   * Validate template against VCA requirements
   */
  validateTemplate(template: TRATemplate): VCAComplianceResult {
    const issues: VCAIssue[] = [];
    let score = 100;

    // Check template completeness
    if (!template.vcaCertified) {
      issues.push({
        severity: "major",
        category: "Certificering",
        description: "Template is niet VCA gecertificeerd",
        requirement: "VCA certificering vereist",
        suggestion: "Laat template certificeren door VCA auditor",
      });
      score -= 15;
    }

    if (!template.vcaVersion || template.vcaVersion !== this.VCA_VERSION) {
      issues.push({
        severity: "minor",
        category: "Versie",
        description: `Template gebruikt niet de laatste VCA versie (${this.VCA_VERSION})`,
        requirement: "Gebruik laatste VCA versie",
        suggestion: "Update template naar nieuwste VCA versie",
      });
      score -= 5;
    }

    // Check hazard coverage
    if (template.taskStepsTemplate.length === 0) {
      issues.push({
        severity: "critical",
        category: "Inhoud",
        description: "Template bevat geen taakstappen",
        requirement: "Minimaal 1 taakstap vereist",
      });
      score -= 30;
    }

    const totalHazards = template.taskStepsTemplate.reduce(
      (sum, step) => sum + step.hazards.length,
      0
    );
    if (totalHazards === 0) {
      issues.push({
        severity: "critical",
        category: "Risicoanalyse",
        description: "Template bevat geen gevaren",
        requirement: "Minimaal 1 gevaar per taakstap vereist",
      });
      score -= 30;
    }

    const recommendations = this.generateRecommendations(issues);

    return {
      isCompliant:
        score >= this.MIN_COMPLIANCE_SCORE &&
        issues.filter((i) => i.severity === "critical").length === 0,
      score: Math.max(0, score),
      issues,
      recommendations,
      certificationReady: score >= 95 && issues.length === 0,
    };
  }

  /**
   * Check basic information
   */
  private checkBasicInformation(tra: TRA, issues: VCAIssue[]): number {
    let penalty = 0;

    if (!tra.title || tra.title.length < 5) {
      issues.push({
        severity: "major",
        category: "Basis Informatie",
        description: "TRA titel is te kort of ontbreekt",
        requirement: "Duidelijke, beschrijvende titel vereist (min. 5 tekens)",
        suggestion: "Voeg een duidelijke titel toe die de werkzaamheden beschrijft",
      });
      penalty += 10;
    }

    if (!tra.description) {
      issues.push({
        severity: "minor",
        category: "Basis Informatie",
        description: "TRA beschrijving ontbreekt",
        requirement: "Beschrijving aanbevolen voor context",
        suggestion: "Voeg een beschrijving toe met details over de werkzaamheden",
      });
      penalty += 5;
    }

    if (!tra.projectId) {
      issues.push({
        severity: "critical",
        category: "Basis Informatie",
        description: "TRA is niet gekoppeld aan een project",
        requirement: "Project koppeling verplicht",
      });
      penalty += 20;
    }

    return penalty;
  }

  /**
   * Check risk assessment
   */
  private checkRiskAssessment(tra: TRA, issues: VCAIssue[]): number {
    let penalty = 0;

    if (tra.taskSteps.length === 0) {
      issues.push({
        severity: "critical",
        category: "Risicoanalyse",
        description: "Geen taakstappen gedefinieerd",
        requirement: "Minimaal 1 taakstap vereist",
      });
      return 30;
    }

    // Check each task step has hazards
    const stepsWithoutHazards = tra.taskSteps.filter((step) => step.hazards.length === 0);
    if (stepsWithoutHazards.length > 0) {
      issues.push({
        severity: "critical",
        category: "Risicoanalyse",
        description: `${stepsWithoutHazards.length} taakstap(pen) zonder gevaren`,
        requirement: "Elke taakstap moet minimaal 1 gevaar hebben",
        suggestion: "Identificeer gevaren voor alle taakstappen",
      });
      penalty += 15;
    }

    // Check high risks have adequate controls
    tra.taskSteps.forEach((step) => {
      step.hazards.forEach((hazard) => {
        if (
          (hazard.riskLevel === "high" || hazard.riskLevel === "very_high") &&
          hazard.controlMeasures.length === 0
        ) {
          issues.push({
            severity: "critical",
            category: "Beheersmaatregelen",
            description: `Hoog risico zonder beheersmaatregelen: ${hazard.description}`,
            requirement: "Hoge risico's moeten beheersmaatregelen hebben",
            suggestion: "Voeg beheersmaatregelen toe volgens de arbeidshygiënische strategie",
          });
          penalty += 10;
        }
      });
    });

    return Math.min(penalty, 30);
  }

  /**
   * Check control measures
   */
  private checkControlMeasures(tra: TRA, issues: VCAIssue[]): number {
    let penalty = 0;
    let totalHazards = 0;
    let hazardsWithControls = 0;

    tra.taskSteps.forEach((step) => {
      step.hazards.forEach((hazard) => {
        totalHazards++;
        if (hazard.controlMeasures.length > 0) {
          hazardsWithControls++;
        }

        // Check hierarchy of controls
        const hasElimination = hazard.controlMeasures.some((c) => c.type === "elimination");
        const hasSubstitution = hazard.controlMeasures.some((c) => c.type === "substitution");
        const onlyPPE = hazard.controlMeasures.every((c) => c.type === "ppe");

        if (onlyPPE && hazard.riskLevel !== "trivial" && hazard.riskLevel !== "acceptable") {
          issues.push({
            severity: "major",
            category: "Beheersmaatregelen",
            description: `Alleen PBM voor ${hazard.riskLevel} risico: ${hazard.description}`,
            requirement:
              "Volg arbeidshygiënische strategie (eliminatie > substitutie > technisch > organisatorisch > PBM)",
            suggestion: "Overweeg hogere beheersmaatregelen in de hiërarchie",
          });
          penalty += 5;
        }
      });
    });

    const controlCoverage = totalHazards > 0 ? (hazardsWithControls / totalHazards) * 100 : 0;
    if (controlCoverage < 80) {
      issues.push({
        severity: "major",
        category: "Beheersmaatregelen",
        description: `Slechts ${controlCoverage.toFixed(0)}% van gevaren heeft beheersmaatregelen`,
        requirement: "Minimaal 80% dekking vereist",
        suggestion: "Voeg beheersmaatregelen toe voor alle geïdentificeerde gevaren",
      });
      penalty += 15;
    }

    return Math.min(penalty, 25);
  }

  /**
   * Check team competencies
   */
  private checkTeamCompetencies(tra: TRA, issues: VCAIssue[]): number {
    let penalty = 0;

    if (tra.teamMembers.length === 0) {
      issues.push({
        severity: "major",
        category: "Team",
        description: "Geen teamleden toegewezen",
        requirement: "Minimaal 1 teamlid vereist",
        suggestion: "Wijs teamleden toe aan deze TRA",
      });
      penalty += 10;
    }

    if (!tra.requiredCompetencies || tra.requiredCompetencies.length === 0) {
      issues.push({
        severity: "minor",
        category: "Competenties",
        description: "Geen vereiste competenties gedefinieerd",
        requirement: "Competenties aanbevolen voor VCA compliance",
        suggestion: "Definieer vereiste certificaten en trainingen",
      });
      penalty += 5;
    }

    return penalty;
  }

  /**
   * Check approval workflow
   */
  private checkApprovalWorkflow(tra: TRA, issues: VCAIssue[]): number {
    let penalty = 0;

    if (tra.status === "draft") {
      issues.push({
        severity: "minor",
        category: "Goedkeuring",
        description: "TRA is nog in concept status",
        requirement: "TRA moet goedgekeurd zijn voor gebruik",
        suggestion: "Dien TRA in voor goedkeuring",
      });
      penalty += 5;
    }

    if (!tra.approvalWorkflow) {
      issues.push({
        severity: "major",
        category: "Goedkeuring",
        description: "Geen goedkeuringsworkflow gedefinieerd",
        requirement: "Goedkeuringsworkflow vereist voor VCA compliance",
        suggestion: "Configureer goedkeuringsworkflow met minimaal 1 goedkeurder",
      });
      penalty += 10;
    }

    return penalty;
  }

  /**
   * Check validity period
   */
  private checkValidityPeriod(tra: TRA, issues: VCAIssue[]): number {
    let penalty = 0;

    if (!tra.validFrom || !tra.validUntil) {
      issues.push({
        severity: "major",
        category: "Geldigheid",
        description: "Geldigheidsduur niet ingesteld",
        requirement: "Geldigheidsduur verplicht (max 12 maanden)",
        suggestion: "Stel geldigheidsduur in (max 12 maanden volgens VCA)",
      });
      return 15;
    }

    const validFrom =
      tra.validFrom instanceof Date ? tra.validFrom : (tra.validFrom as any).toDate();
    const validUntil =
      tra.validUntil instanceof Date ? tra.validUntil : (tra.validUntil as any).toDate();
    const monthsDiff = (validUntil.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (monthsDiff > 12) {
      issues.push({
        severity: "critical",
        category: "Geldigheid",
        description: `Geldigheidsduur te lang (${monthsDiff.toFixed(1)} maanden)`,
        requirement: "Maximaal 12 maanden geldigheid volgens VCA",
        suggestion: "Verkort geldigheidsduur tot maximaal 12 maanden",
      });
      penalty += 20;
    }

    // Check if expired
    const now = new Date();
    if (validUntil < now) {
      issues.push({
        severity: "critical",
        category: "Geldigheid",
        description: "TRA is verlopen",
        requirement: "TRA moet geldig zijn",
        suggestion: "Vernieuw TRA of maak nieuwe versie",
      });
      penalty += 25;
    }

    return penalty;
  }

  /**
   * Check documentation quality
   */
  private checkDocumentation(tra: TRA, issues: VCAIssue[]): number {
    let penalty = 0;

    // Check if hazards have descriptions
    tra.taskSteps.forEach((step) => {
      step.hazards.forEach((hazard) => {
        if (!hazard.description || hazard.description.length < 10) {
          issues.push({
            severity: "minor",
            category: "Documentatie",
            description: "Gevaar heeft onvoldoende beschrijving",
            requirement: "Duidelijke beschrijving vereist",
            suggestion: "Voeg gedetailleerde beschrijving toe",
          });
          penalty += 2;
        }
      });
    });

    return Math.min(penalty, 10);
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(issues: VCAIssue[]): string[] {
    const recommendations: string[] = [];

    const criticalCount = issues.filter((i) => i.severity === "critical").length;
    const majorCount = issues.filter((i) => i.severity === "major").length;

    if (criticalCount > 0) {
      recommendations.push(
        `Los eerst de ${criticalCount} kritieke issue(s) op voor VCA compliance`
      );
    }

    if (majorCount > 0) {
      recommendations.push(
        `Verbeter ${majorCount} belangrijke issue(s) voor betere compliance score`
      );
    }

    // Category-specific recommendations
    const categories = new Set(issues.map((i) => i.category));
    if (categories.has("Risicoanalyse")) {
      recommendations.push("Voer een grondige risicoanalyse uit voor alle taakstappen");
    }
    if (categories.has("Beheersmaatregelen")) {
      recommendations.push(
        "Volg de arbeidshygiënische strategie bij het kiezen van beheersmaatregelen"
      );
    }
    if (categories.has("Geldigheid")) {
      recommendations.push("Controleer en update de geldigheidsduur volgens VCA richtlijnen");
    }

    if (recommendations.length === 0) {
      recommendations.push("TRA voldoet aan VCA vereisten - geen verdere acties nodig");
    }

    return recommendations;
  }
}

/**
 * Validate TRA against VCA requirements
 */
export function validateVCACompliance(tra: TRA): VCAComplianceResult {
  const validator = new VCAValidator();
  return validator.validateTRA(tra);
}

/**
 * Validate template against VCA requirements
 */
export function validateTemplateVCACompliance(template: TRATemplate): VCAComplianceResult {
  const validator = new VCAValidator();
  return validator.validateTemplate(template);
}
