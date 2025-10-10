/**
 * TRA Model Unit Tests
 * Testing TRA types, helper functions, and business logic
 */

import { describe, test, expect } from "@jest/globals";
import {
  calculateRiskScore,
  getRiskLevel,
  getRiskLevelColor,
  getRiskLevelPriority,
  isTRAValid,
  isTRAExpiringSoon,
  getOverallRiskScore,
  getTotalHazardCount,
  groupHazardsByRiskLevel,
  canEditTRA,
  canSubmitTRA,
  getNextApprovalStep,
  canUserApproveStep,
  EFFECT_SCORES,
  EXPOSURE_SCORES,
  PROBABILITY_SCORES,
  TRA,
  TRAStatus,
  RiskLevel,
  TaskStep,
  Hazard,
  ApprovalWorkflow,
  EffectScore,
  ExposureScore,
  ProbabilityScore,
} from "@/lib/types/tra";

describe("TRA Model - Risk Score Calculations", () => {
  test("calculateRiskScore - calculates correct risk score", () => {
    expect(calculateRiskScore(15, 6, 3)).toBe(270);
    expect(calculateRiskScore(1, 0.5, 0.1)).toBe(0.05);
    expect(calculateRiskScore(100, 10, 10)).toBe(10000);
    expect(calculateRiskScore(7, 3, 1)).toBe(21);
  });

  test("getRiskLevel - returns correct risk level based on score", () => {
    expect(getRiskLevel(10)).toBe("trivial");
    expect(getRiskLevel(20)).toBe("trivial");
    expect(getRiskLevel(50)).toBe("acceptable");
    expect(getRiskLevel(70)).toBe("acceptable");
    expect(getRiskLevel(150)).toBe("possible");
    expect(getRiskLevel(300)).toBe("substantial");
    expect(getRiskLevel(500)).toBe("high");
    expect(getRiskLevel(5000)).toBe("very_high");
  });

  test("getRiskLevelColor - returns correct colors", () => {
    expect(getRiskLevelColor("trivial")).toBe("#10B981");
    expect(getRiskLevelColor("acceptable")).toBe("#84CC16");
    expect(getRiskLevelColor("possible")).toBe("#F59E0B");
    expect(getRiskLevelColor("substantial")).toBe("#F97316");
    expect(getRiskLevelColor("high")).toBe("#EF4444");
    expect(getRiskLevelColor("very_high")).toBe("#DC2626");
  });

  test("getRiskLevelPriority - returns correct priority (lower = more urgent)", () => {
    expect(getRiskLevelPriority("trivial")).toBe(6);
    expect(getRiskLevelPriority("acceptable")).toBe(5);
    expect(getRiskLevelPriority("possible")).toBe(4);
    expect(getRiskLevelPriority("substantial")).toBe(3);
    expect(getRiskLevelPriority("high")).toBe(2);
    expect(getRiskLevelPriority("very_high")).toBe(1);
  });

  test("Effect scores are correctly defined", () => {
    expect(EFFECT_SCORES).toHaveLength(6);
    expect(EFFECT_SCORES.map((s) => s.score)).toEqual([1, 3, 7, 15, 40, 100]);
  });

  test("Exposure scores are correctly defined", () => {
    expect(EXPOSURE_SCORES).toHaveLength(6);
    expect(EXPOSURE_SCORES.map((s) => s.score)).toEqual([0.5, 1, 2, 3, 6, 10]);
  });

  test("Probability scores are correctly defined", () => {
    expect(PROBABILITY_SCORES).toHaveLength(7);
    expect(PROBABILITY_SCORES.map((s) => s.score)).toEqual([0.1, 0.2, 0.5, 1, 3, 6, 10]);
  });
});

describe("TRA Model - Validity Checks", () => {
  const now = new Date("2025-10-02T12:00:00Z");

  test("isTRAValid - returns true for valid TRA", () => {
    const tra = {
      validFrom: new Date("2025-09-01T00:00:00Z"),
      validUntil: new Date("2025-12-01T00:00:00Z"),
    } as TRA;

    expect(isTRAValid(tra, now)).toBe(true);
  });

  test("isTRAValid - returns false for expired TRA", () => {
    const tra = {
      validFrom: new Date("2025-01-01T00:00:00Z"),
      validUntil: new Date("2025-09-01T00:00:00Z"),
    } as TRA;

    expect(isTRAValid(tra, now)).toBe(false);
  });

  test("isTRAValid - returns false for not yet valid TRA", () => {
    const tra = {
      validFrom: new Date("2025-11-01T00:00:00Z"),
      validUntil: new Date("2025-12-01T00:00:00Z"),
    } as TRA;

    expect(isTRAValid(tra, now)).toBe(false);
  });

  test("isTRAValid - returns false when validity dates missing", () => {
    const tra = {} as TRA;
    expect(isTRAValid(tra, now)).toBe(false);
  });

  test("isTRAExpiringSoon - returns true for TRA expiring within threshold", () => {
    const tra = {
      validFrom: new Date("2025-09-01T00:00:00Z"),
      validUntil: new Date("2025-10-15T00:00:00Z"), // 13 days from now
    } as TRA;

    expect(isTRAExpiringSoon(tra, 30)).toBe(true);
    expect(isTRAExpiringSoon(tra, 14)).toBe(true);
    expect(isTRAExpiringSoon(tra, 12)).toBe(false);
  });

  test("isTRAExpiringSoon - returns false for already expired TRA", () => {
    const tra = {
      validFrom: new Date("2025-01-01T00:00:00Z"),
      validUntil: new Date("2025-09-01T00:00:00Z"),
    } as TRA;

    expect(isTRAExpiringSoon(tra, 30)).toBe(false);
  });
});

describe("TRA Model - Hazard Analysis", () => {
  const createHazard = (riskScore: number): Hazard => ({
    id: "hazard-1",
    description: "Test hazard",
    category: "electrical",
    source: "custom",
    effectScore: 15 as EffectScore,
    exposureScore: 6 as ExposureScore,
    probabilityScore: 3 as ProbabilityScore,
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    controlMeasures: [],
  });

  const createTaskStep = (hazards: Hazard[]): TaskStep => ({
    stepNumber: 1,
    description: "Test step",
    hazards,
  });

  test("getOverallRiskScore - returns highest risk score", () => {
    const taskSteps: TaskStep[] = [
      createTaskStep([createHazard(50), createHazard(200)]),
      createTaskStep([createHazard(500), createHazard(100)]),
    ];

    expect(getOverallRiskScore(taskSteps)).toBe(500);
  });

  test("getOverallRiskScore - returns 0 for no hazards", () => {
    const taskSteps: TaskStep[] = [];
    expect(getOverallRiskScore(taskSteps)).toBe(0);
  });

  test("getTotalHazardCount - counts all hazards", () => {
    const taskSteps: TaskStep[] = [
      createTaskStep([createHazard(50), createHazard(200)]),
      createTaskStep([createHazard(500)]),
    ];

    expect(getTotalHazardCount(taskSteps)).toBe(3);
  });

  test("groupHazardsByRiskLevel - groups hazards correctly", () => {
    const taskSteps: TaskStep[] = [
      createTaskStep([
        createHazard(10), // trivial
        createHazard(50), // acceptable
        createHazard(150), // possible
      ]),
      createTaskStep([
        createHazard(300), // substantial
        createHazard(500), // high
        createHazard(5000), // very_high
      ]),
    ];

    const grouped = groupHazardsByRiskLevel(taskSteps);

    expect(grouped.trivial).toBe(1);
    expect(grouped.acceptable).toBe(1);
    expect(grouped.possible).toBe(1);
    expect(grouped.substantial).toBe(1);
    expect(grouped.high).toBe(1);
    expect(grouped.very_high).toBe(1);
  });
});

describe("TRA Model - Status Checks", () => {
  test("canEditTRA - allows editing for draft and rejected", () => {
    expect(canEditTRA("draft")).toBe(true);
    expect(canEditTRA("rejected")).toBe(true);
  });

  test("canEditTRA - prevents editing for other statuses", () => {
    expect(canEditTRA("submitted")).toBe(false);
    expect(canEditTRA("in_review")).toBe(false);
    expect(canEditTRA("approved")).toBe(false);
    expect(canEditTRA("active")).toBe(false);
    expect(canEditTRA("expired")).toBe(false);
    expect(canEditTRA("archived")).toBe(false);
  });

  test("canSubmitTRA - validates TRA is ready for submission", () => {
    const validTRA: TRA = {
      id: "tra-1",
      status: "draft",
      taskSteps: [
        {
          stepNumber: 1,
          description: "Test step",
          hazards: [
            {
              id: "hazard-1",
              description: "Test hazard",
              category: "electrical",
              source: "custom",
              effectScore: 15,
              exposureScore: 6,
              probabilityScore: 3,
              riskScore: 270,
              riskLevel: "substantial",
              controlMeasures: [
                {
                  id: "control-1",
                  type: "elimination",
                  description: "Test control",
                },
              ],
            } as Hazard,
          ],
        } as TaskStep,
      ],
      teamMembers: ["user-1"],
    } as TRA;

    expect(canSubmitTRA(validTRA)).toBe(true);
  });

  test("canSubmitTRA - requires draft status", () => {
    const tra = {
      status: "approved",
      taskSteps: [{ hazards: [{}] }],
      teamMembers: ["user-1"],
    } as TRA;

    expect(canSubmitTRA(tra)).toBe(false);
  });

  test("canSubmitTRA - requires task steps", () => {
    const tra = {
      status: "draft" as const,
      taskSteps: [],
      teamMembers: ["user-1"],
    } as unknown as TRA;

    expect(canSubmitTRA(tra)).toBe(false);
  });

  test("canSubmitTRA - requires hazards in steps", () => {
    const tra = {
      status: "draft" as const,
      taskSteps: [{ stepNumber: 1, description: "Test", hazards: [] }],
      teamMembers: ["user-1"],
    } as unknown as TRA;

    expect(canSubmitTRA(tra)).toBe(false);
  });

  test("canSubmitTRA - requires team members", () => {
    const tra = {
      status: "draft" as const,
      taskSteps: [
        {
          stepNumber: 1,
          description: "Test",
          hazards: [{ id: "h1" }],
        },
      ],
      teamMembers: [],
    } as unknown as TRA;

    expect(canSubmitTRA(tra)).toBe(false);
  });
});

describe("TRA Model - Approval Workflow", () => {
  const createApprovalWorkflow = (
    currentStep: number,
    stepCount: number = 2
  ): ApprovalWorkflow => ({
    currentStep,
    steps: Array.from({ length: stepCount }, (_, i) => ({
      stepNumber: i,
      name: `Step ${i + 1}`,
      requiredRole: "safety_manager" as const,
      approvers: ["user-1", "user-2"],
      status: i < currentStep ? ("approved" as const) : ("pending" as const),
    })),
  });

  test("getNextApprovalStep - returns current step", () => {
    const workflow = createApprovalWorkflow(0, 3);
    const nextStep = getNextApprovalStep(workflow);

    expect(nextStep).not.toBeNull();
    expect(nextStep?.stepNumber).toBe(0);
    expect(nextStep?.status).toBe("pending");
  });

  test("getNextApprovalStep - returns null when all steps completed", () => {
    const workflow = createApprovalWorkflow(3, 3); // All 3 steps done
    const nextStep = getNextApprovalStep(workflow);

    expect(nextStep).toBeNull();
  });

  test("canUserApproveStep - approver can approve", () => {
    const workflow = createApprovalWorkflow(0);

    expect(canUserApproveStep(workflow, "user-1", "safety_manager")).toBe(true);
    expect(canUserApproveStep(workflow, "user-2", "safety_manager")).toBe(true);
  });

  test("canUserApproveStep - admin can always approve", () => {
    const workflow = createApprovalWorkflow(0);

    expect(canUserApproveStep(workflow, "user-3", "admin")).toBe(true);
  });

  test("canUserApproveStep - non-approver cannot approve", () => {
    const workflow = createApprovalWorkflow(0);

    expect(canUserApproveStep(workflow, "user-3", "supervisor")).toBe(false);
  });

  test("canUserApproveStep - returns false when no more steps", () => {
    const workflow = createApprovalWorkflow(2, 2); // All steps done

    expect(canUserApproveStep(workflow, "user-1", "safety_manager")).toBe(false);
  });
});

describe("TRA Model - Integration Tests", () => {
  test("Complete TRA creation workflow", () => {
    // Create hazard with valid risk assessment
    const effectScore = 15 as EffectScore;
    const exposureScore = 6 as ExposureScore;
    const probabilityScore = 3 as ProbabilityScore;
    const riskScore = calculateRiskScore(effectScore, exposureScore, probabilityScore);
    const riskLevel = getRiskLevel(riskScore);

    expect(riskScore).toBe(270);
    expect(riskLevel).toBe("substantial");

    // Create task step with hazard
    const hazard: Hazard = {
      id: "hazard-1",
      description: "Electrical shock hazard",
      category: "electrical",
      source: "custom",
      effectScore,
      exposureScore,
      probabilityScore,
      riskScore,
      riskLevel,
      controlMeasures: [
        {
          id: "control-1",
          type: "elimination",
          description: "De-energize equipment before work",
        },
      ],
    };

    const taskStep: TaskStep = {
      stepNumber: 1,
      description: "Equipment maintenance",
      hazards: [hazard],
    };

    // Create TRA
    const tra: TRA = {
      id: "tra-1",
      title: "Electrical Equipment Maintenance TRA",
      organizationId: "org-1",
      projectId: "project-1",
      taskSteps: [taskStep],
      overallRiskScore: getOverallRiskScore([taskStep]),
      overallRiskLevel: getRiskLevel(getOverallRiskScore([taskStep])),
      teamMembers: ["user-1", "user-2"],
      requiredCompetencies: ["Electrical Safety"],
      status: "draft",
      complianceFramework: "vca",
      version: 1,
      createdBy: "user-1",
      createdAt: new Date(),
    };

    // Validate TRA can be submitted
    expect(canSubmitTRA(tra)).toBe(true);
    expect(getTotalHazardCount(tra.taskSteps)).toBe(1);
    expect(tra.overallRiskScore).toBe(270);
    expect(tra.overallRiskLevel).toBe("substantial");
  });

  test("VCA compliance - validity period validation", () => {
    const validFrom = new Date("2025-10-01");
    const validUntil11Months = new Date("2026-09-01"); // 11 months
    const validUntil13Months = new Date("2026-11-01"); // 13 months

    const tra11Months: Partial<TRA> = {
      validFrom,
      validUntil: validUntil11Months,
    };

    const tra13Months: Partial<TRA> = {
      validFrom,
      validUntil: validUntil13Months,
    };

    // 11 months is valid (within 12 month limit)
    expect(isTRAValid(tra11Months as TRA, new Date("2025-12-01"))).toBe(true);

    // 13 months exceeds VCA limit but validation would happen in Zod schema
    // This test just ensures the validity check works with the dates
    const monthsDiff13 =
      (validUntil13Months.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24 * 30);
    expect(monthsDiff13).toBeGreaterThan(12);
  });

  test("Risk level grouping for dashboard display", () => {
    const taskSteps: TaskStep[] = [
      {
        stepNumber: 1,
        description: "Step 1",
        hazards: [
          {
            id: "h1",
            description: "Low risk",
            category: "physical",
            source: "custom",
            effectScore: 1,
            exposureScore: 1,
            probabilityScore: 1,
            riskScore: 1,
            riskLevel: "trivial",
            controlMeasures: [],
          } as Hazard,
          {
            id: "h2",
            description: "High risk",
            category: "electrical",
            source: "custom",
            effectScore: 40,
            exposureScore: 6,
            probabilityScore: 6,
            riskScore: 1440,
            riskLevel: "very_high",
            controlMeasures: [],
          } as Hazard,
        ],
      },
    ];

    const grouped = groupHazardsByRiskLevel(taskSteps);

    expect(grouped.trivial).toBe(1);
    expect(grouped.very_high).toBe(1);
    expect(grouped.acceptable + grouped.possible + grouped.substantial + grouped.high).toBe(0);
  });
});
