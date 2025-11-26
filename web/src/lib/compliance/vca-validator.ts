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

  // VCA 2017 v5.1 Category Weights
  private readonly CATEGORY_WEIGHTS = {
    riskAssessment: 0.25,    // 25%
    controlMeasures: 0.30,   // 30%
    competencies: 0.20,      // 20%
    documentation: 0.15,     // 15%
    approvals: 0.10,         // 10%
  };

  /**
   * Validate TRA against VCA requirements using weighted scoring
   */
  validateTRA(tra: TRA): VCAComplianceResult {
    const issues: VCAIssue[] = [];

    // Calculate category scores (0-100 each)
    const riskAssessmentScore = this.checkRiskAssessment(tra, issues);
    const controlMeasuresScore = this.checkControlMeasures(tra, issues);
    const competenciesScore = this.checkTeamCompetencies(tra, issues);
    const documentationScore = this.checkDocumentation(tra, issues);
    const approvalsScore = this.checkApprovalWorkflow(tra, issues);

    // Calculate weighted overall score
    let score = Math.round(
      riskAssessmentScore * this.CATEGORY_WEIGHTS.riskAssessment +
      controlMeasuresScore * this.CATEGORY_WEIGHTS.controlMeasures +
      competenciesScore * this.CATEGORY_WEIGHTS.competencies +
      documentationScore * this.CATEGORY_WEIGHTS.documentation +
      approvalsScore * this.CATEGORY_WEIGHTS.approvals
    );

    // Add bonus points for context fields (Phase 1.3)
    const contextBonus = this.calculateContextFieldsBonus(tra);
    score = Math.min(100, score + contextBonus);

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
   * Check risk assessment (25% weight)
   * Returns score 0-100
   */
  private checkRiskAssessment(tra: TRA, issues: VCAIssue[]): number {
    let score = 100;

    const taskSteps = Array.isArray((tra as any).taskSteps) ? (tra as any).taskSteps : [];

    if (taskSteps.length === 0) {
      issues.push({
        severity: "critical",
        category: "Risicoanalyse",
        description: "Geen taakstappen gedefinieerd",
        requirement: "Minimaal 1 taakstap vereist",
      });
      return 0; // Critical failure
    }

    // Check each task step has hazards
    const stepsWithoutHazards = taskSteps.filter((step: any) => {
      const hazards = Array.isArray(step?.hazards) ? step.hazards : [];
      return hazards.length === 0;
    });
    if (stepsWithoutHazards.length > 0) {
      issues.push({
        severity: "critical",
        category: "Risicoanalyse",
        description: `${stepsWithoutHazards.length} taakstap(pen) zonder gevaren`,
        requirement: "Elke taakstap moet minimaal 1 gevaar hebben",
        suggestion: "Identificeer gevaren voor alle taakstappen",
      });
      score -= 30;
    }

    // Check risk levels assigned (20 points)
    const hasRiskLevels = taskSteps.every((step: any) => {
      const hazards = Array.isArray(step?.hazards) ? step.hazards : [];
      return hazards.every((h: any) => h.riskLevel);
    });
    if (!hasRiskLevels) {
      issues.push({
        severity: "major",
        category: "Risicoanalyse",
        description: "Niet alle gevaren hebben een risiconiveau",
        requirement: "Alle gevaren moeten een risiconiveau hebben",
        suggestion: "Voeg risiconiveaus toe aan alle gevaren",
      });
      score -= 20;
    }

    return Math.max(0, score);
  }

  /**
   * Check control measures (30% weight)
   * Returns score 0-100
   */
  private checkControlMeasures(tra: TRA, issues: VCAIssue[]): number {
    let score = 100;
    let totalHazards = 0;
    let hazardsWithControls = 0;

    const taskSteps = Array.isArray((tra as any).taskSteps) ? (tra as any).taskSteps : [];

    taskSteps.forEach((step: any) => {
      const hazards = Array.isArray(step?.hazards) ? step.hazards : [];
      hazards.forEach((hazard: any) => {
        const controlMeasures = Array.isArray(hazard?.controlMeasures)
          ? hazard.controlMeasures
          : [];

        totalHazards++;
        if (controlMeasures.length > 0) {
          hazardsWithControls++;
        }

        // Check hierarchy of controls
        const hasElimination = controlMeasures.some(
          (c: any) => c && c.type === "elimination"
        );
        const hasSubstitution = controlMeasures.some(
          (c: any) => c && c.type === "substitution"
        );
        const onlyPPE =
          controlMeasures.length > 0 &&
          controlMeasures.every((c: any) => c && c.type === "ppe");

        if (
          onlyPPE &&
          hazard.riskLevel !== "trivial" &&
          hazard.riskLevel !== "acceptable"
        ) {
          issues.push({
            severity: "major",
            category: "Beheersmaatregelen",
            description: `Alleen PBM voor ${hazard.riskLevel} risico: ${hazard.description || ""}`,
            requirement:
              "Volg arbeidshygiënische strategie (eliminatie > substitutie > technisch > organisatorisch > PBM)",
            suggestion: "Overweeg hogere beheersmaatregelen in de hiërarchie",
          });
          score -= 5;
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
      score -= 20;
    }

    return Math.max(0, score);
  }

  /**
   * Check team competencies (20% weight)
   * Returns score 0-100
   */
  private checkTeamCompetencies(tra: TRA, issues: VCAIssue[]): number {
    let score = 100;

    const teamMembers = Array.isArray((tra as any).teamMembers)
      ? (tra as any).teamMembers
      : [];

    if (teamMembers.length === 0) {
      issues.push({
        severity: "critical",
        category: "Competenties",
        description: "Geen teamleden toegewezen",
        requirement: "Minimaal 1 teamlid vereist",
        suggestion: "Wijs teamleden toe aan deze TRA",
      });
      score -= 40;
    }

    const requiredCompetencies = Array.isArray((tra as any).requiredCompetencies)
      ? (tra as any).requiredCompetencies
      : [];

    // Check for high-risk work
    const taskSteps = Array.isArray((tra as any).taskSteps) ? (tra as any).taskSteps : [];
    const hasHighRisk = taskSteps.some((step: any) => {
      const hazards = Array.isArray(step?.hazards) ? step.hazards : [];
      return hazards.some((h: any) => h.riskScore > 400);
    });

    // For high-risk work, missing competencies is more severe
    if (requiredCompetencies.length === 0) {
      const penalty = hasHighRisk ? 40 : 30; // Increased penalty for high-risk
      issues.push({
        severity: hasHighRisk ? "critical" : "major",
        category: "Competenties",
        description: "Geen vereiste competenties gedefinieerd",
        requirement: "Competenties vereist voor VCA compliance",
        suggestion: hasHighRisk
          ? "Definieer vereiste certificaten en trainingen, inclusief VCA voor hoog-risico werk"
          : "Definieer vereiste certificaten en trainingen",
      });
      score -= penalty;
    } else if (hasHighRisk) {
      // Check for VCA certification requirement for high-risk work
      const hasVCA = requiredCompetencies.some((c: string) =>
        c.toLowerCase().includes("vca")
      );
      if (!hasVCA) {
        issues.push({
          severity: "major",
          category: "Competenties",
          description: "VCA-certificering aanbevolen voor hoog-risico werkzaamheden",
          requirement: "VCA-certificering voor hoog-risico werk",
          suggestion: "Voeg VCA-certificering toe aan vereiste competenties",
        });
        score -= 15;
      }
    }

    // Check team size for high-risk work or when personnel requirements are specified
    if (teamMembers.length === 1 && hasHighRisk) {
      issues.push({
        severity: "minor",
        category: "Competenties",
        description: "Minimaal 2 teamleden aanbevolen voor hoog-risico werk",
        requirement: "Voldoende teamleden voor veilige uitvoering",
        suggestion: "Wijs minimaal 2 teamleden toe voor hoog-risico werkzaamheden",
      });
      score -= 10;
    }

    // Check if team size meets task step requirements
    const maxRequiredPersonnel = taskSteps.reduce((max: number, step: any) => {
      return Math.max(max, step.requiredPersonnel || 0);
    }, 0);

    if (maxRequiredPersonnel > 0 && teamMembers.length < maxRequiredPersonnel) {
      issues.push({
        severity: "major",
        category: "Competenties",
        description: `Team te klein: ${teamMembers.length} teamleden, ${maxRequiredPersonnel} vereist`,
        requirement: `Minimaal ${maxRequiredPersonnel} teamleden vereist`,
        suggestion: `Wijs minimaal ${maxRequiredPersonnel} teamleden toe`,
      });
      score -= 15;
    }

    return Math.max(0, score);
  }

  /**
   * Check documentation (15% weight)
   * Returns score 0-100
   */
  private checkDocumentation(tra: TRA, issues: VCAIssue[]): number {
    let score = 100;

    // Check title length (25 points)
    if (!tra.title || tra.title.length < 10) {
      issues.push({
        severity: "major",
        category: "Documentatie",
        description: "TRA titel is te kort of ontbreekt",
        requirement: "Duidelijke, beschrijvende titel vereist (min. 10 tekens)",
        suggestion: "Voeg een duidelijke titel toe die de werkzaamheden beschrijft",
      });
      score -= 25;
    }

    // Check description length (25 points)
    if (!tra.description || tra.description.length < 50) {
      issues.push({
        severity: "major",
        category: "Documentatie",
        description: "TRA beschrijving is te kort of ontbreekt",
        requirement: "Beschrijving vereist (min. 50 tekens)",
        suggestion: "Voeg een gedetailleerde beschrijving toe",
      });
      score -= 25;
    }

    // Check task steps documented (20 points)
    const taskSteps = Array.isArray((tra as any).taskSteps) ? (tra as any).taskSteps : [];
    if (taskSteps.length === 0) {
      issues.push({
        severity: "major",
        category: "Documentatie",
        description: "Geen taakstappen gedocumenteerd",
        requirement: "Werkstappen moeten worden gedocumenteerd",
        suggestion: "Voeg taakstappen toe aan de TRA",
      });
      score -= 20;
    }

    // Check task step descriptions (15 points)
    const stepsWithoutDescriptions = taskSteps.filter(
      (ts: any) => !ts.description || ts.description.length < 10
    );
    if (stepsWithoutDescriptions.length > 0) {
      issues.push({
        severity: "minor",
        category: "Documentatie",
        description: `${stepsWithoutDescriptions.length} taakstap(pen) zonder beschrijving`,
        requirement: "Alle werkstappen moeten een duidelijke beschrijving hebben",
        suggestion: "Voeg beschrijvingen toe aan alle taakstappen",
      });
      score -= 15;
    }

    // Check project linkage (15 points)
    if (!tra.projectId) {
      issues.push({
        severity: "critical",
        category: "Documentatie",
        description: "TRA is niet gekoppeld aan een project",
        requirement: "Project koppeling verplicht",
        suggestion: "Koppel TRA aan een project",
      });
      score -= 15;
    }

    return Math.max(0, score);
  }

  /**
   * Check approval workflow (10% weight)
   * Returns score 0-100
   */
  private checkApprovalWorkflow(tra: TRA, issues: VCAIssue[]): number {
    let score = 100;

    // Check TRA status (50 points)
    if (tra.status === "draft") {
      issues.push({
        severity: "major",
        category: "Goedkeuring",
        description: "TRA is nog in concept status",
        requirement: "TRA moet goedgekeurd zijn voor gebruik",
        suggestion: "Dien TRA in voor goedkeuring",
      });
      score -= 50;
    }

    // Check approval workflow exists (30 points)
    if (!tra.approvalWorkflow) {
      issues.push({
        severity: "major",
        category: "Goedkeuring",
        description: "Geen goedkeuringsworkflow gedefinieerd",
        requirement: "Goedkeuringsworkflow vereist voor VCA compliance",
        suggestion: "Configureer goedkeuringsworkflow met minimaal 1 goedkeurder",
      });
      score -= 30;
    } else {
      // Check required approvers assigned (20 points)
      const hasRequiredApprovers = tra.approvalWorkflow.steps?.some(
        (step) => step.requiredRole === "safety_manager" || step.requiredRole === "supervisor"
      );
      if (!hasRequiredApprovers) {
        issues.push({
          severity: "minor",
          category: "Goedkeuring",
          description: "Geen vereiste goedkeurders toegewezen",
          requirement: "Safety manager of supervisor goedkeuring vereist",
          suggestion: "Voeg safety manager of supervisor toe aan goedkeuringsworkflow",
        });
        score -= 20;
      }
    }

    // Check validity period (bonus/penalty based on validity)
    if (tra.validFrom && tra.validUntil) {
      // Handle various date formats (Date, Firestore Timestamp, ISO string, number)
      const toDate = (val: any): Date | null => {
        if (!val) return null;
        if (val instanceof Date) return val;
        if (typeof val.toDate === 'function') return val.toDate();
        if (typeof val === 'string') return new Date(val);
        if (typeof val === 'number') return new Date(val);
        return null;
      };

      const validFrom = toDate(tra.validFrom);
      const validUntil = toDate(tra.validUntil);
      
      if (!validFrom || !validUntil) {
        issues.push({
          category: "Goedkeuring",
          severity: "minor",
          description: "TRA heeft ongeldige datum velden",
          requirement: "Geldige datums vereist voor geldigheidsperiode controle",
          suggestion: "Controleer de validFrom en validUntil datums",
        });
        return score; // Return current score, don't penalize further
      }

      const monthsDiff = (validUntil.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24 * 30);

      if (monthsDiff > 12) {
        issues.push({
          severity: "minor",
          category: "Goedkeuring",
          description: `Geldigheidsduur te lang (${monthsDiff.toFixed(1)} maanden)`,
          requirement: "Maximaal 12 maanden geldigheid volgens VCA",
          suggestion: "Verkort geldigheidsduur tot maximaal 12 maanden",
        });
        // Note: This is informational, doesn't affect approval score
      }
    }

    return Math.max(0, score);
  }

  /**
   * Calculate bonus points for context fields documentation
   * Phase 1.3: TRA Context Fields Integration
   * @returns Bonus points (0-8)
   */
  private calculateContextFieldsBonus(tra: TRA): number {
    let bonus = 0;
    const taskSteps = Array.isArray((tra as any).taskSteps) ? (tra as any).taskSteps : [];

    // Check if tasks have workplace conditions documented (+5 points)
    const tasksWithConditions = taskSteps.filter((step: any) =>
      step.workplaceConditions && Object.keys(step.workplaceConditions).length > 0
    );
    if (tasksWithConditions.length > 0) {
      bonus += 5; // Bonus voor gedocumenteerde werkomstandigheden
    }

    // Check for materials with MSDS documentation (+3 points)
    const tasksWithMsdsMaterials = taskSteps.filter((step: any) =>
      step.materials && Array.isArray(step.materials) &&
      step.materials.some((m: any) => m.msdsRequired === true)
    );
    if (tasksWithMsdsMaterials.length > 0) {
      bonus += 3; // Bonus voor MSDS documentatie
    }

    return bonus;
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
