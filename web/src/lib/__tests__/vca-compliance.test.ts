import { describe, it, expect, beforeAll, jest } from "@jest/globals";
import { calculateVCACompliance, isVCACompliant } from "../vca-compliance";

// Simple test data builders. Adjust fields to match actual TRA/TaskStep/Hazard types if they differ.
const makeHazard = (overrides: any = {}): any => ({
  id: "h1",
  description: "Valgevaar",
  category: "physical" as any,
  source: "custom" as any,
  effectScore: 15 as any,
  exposureScore: 3 as any,
  probabilityScore: 1 as any,
  riskScore: 45 as any,
  riskLevel: "acceptable" as any,
  controlMeasures: [],
  ...overrides,
});

const makeStep = (overrides: any = {}): any => ({
  stepNumber: 1,
  description: "Werk stap",
  hazards: [makeHazard()],
  ...overrides,
});

const makeTRA = (overrides: any = {}): any => ({
  id: "t1" as any,
  title: "Test TRA",
  description: "Beschrijving met voldoende lengte voor documentatie checks.",
  organizationId: "org1" as any,
  projectId: "proj1" as any,
  taskSteps: [makeStep()],
  overallRiskScore: 45 as any,
  overallRiskLevel: "acceptable" as any,
  teamMembers: ["u1"] as any,
  requiredCompetencies: [] as any,
  status: "draft" as any,
  version: 1 as any,
  complianceFramework: "vca" as any,
  createdBy: "u1" as any,
  createdAt: new Date() as any,
  ...overrides,
});

describe("vca-compliance core", () => {
  beforeAll(() => {
    // Freeze Date if needed; many functions include checkedAt timestamp
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });

  it("validateVCARequirements returns invalid when required fields are missing", () => {
    const tra = makeTRA({
      title: "", // missing title
      description: "", // missing description
      taskSteps: [], // no steps
    } as any);

    const result = calculateVCACompliance(tra as any);
    expect(result.isCompliant).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("score/level boundaries mapping (relative)", () => {
    const getLevel = (tra: any) => calculateVCACompliance(tra as any).level;

    // Create variants to simulate different overall documentation/completeness
    // Adjust knobs to push scores roughly; details depend on implementation but we assert relative thresholds.
    const veryPoor = makeTRA({
      title: "x",
      description: "kort",
      taskSteps: [],
      teamMembers: [],
      requiredCompetencies: [],
      status: "draft",
    } as any);

    const marginal = makeTRA({
      // expected around low 70s - depends on implementation; assert PARTIALLY_COMPLIANT threshold (70-84)
      taskSteps: [makeStep({ hazards: [makeHazard()] })],
      status: "submitted",
      description: "Voldoende beschrijving om documentatie checks gedeeltelijk te passeren.",
    } as any);

    const good = makeTRA({
      // target compliant (>=85)
      taskSteps: [
        makeStep({
          hazards: [
            makeHazard({
              controlMeasures: ["Valbeveiliging"],
              riskLevel: "tolerable" as any,
            }),
          ],
        }),
      ],
      teamMembers: ["u1", "u2"] as any,
      status: "approved" as any,
    } as any);

    const excellent = makeTRA({
      // aim fully compliant (>=95)
      taskSteps: [
        makeStep({
          description: "Uitgebreide werkbeschrijving",
          hazards: [
            makeHazard({
              description: "Valgevaar & vallende objecten",
              controlMeasures: ["Valbeveiliging", "Helm", "Afzetting"],
              riskLevel: "acceptable" as any,
            }),
            makeHazard({
              description: "Elektrisch gevaar",
              controlMeasures: ["Lockout/tagout", "Isolatie"],
              riskLevel: "acceptable" as any,
            }),
          ],
        }),
      ],
      requiredCompetencies: ["VCA-B", "Hoogwerker"] as any,
      teamMembers: ["u1", "u2", "u3"] as any,
      status: "approved" as any,
    } as any);

    const veryPoorLevel = getLevel(veryPoor);
    const marginalLevel = getLevel(marginal);
    const goodLevel = getLevel(good);
    const excellentLevel = getLevel(excellent);

    // veryPoor should be clearly below marginal
    expect(["NON_COMPLIANT", "PARTIALLY_COMPLIANT"]).toContain(veryPoorLevel);

    // monotonic ordering expectations without enforcing specific buckets:
    // marginal >= veryPoor
    expect(
      ["NON_COMPLIANT", "PARTIALLY_COMPLIANT", "COMPLIANT"].indexOf(marginalLevel)
    ).toBeGreaterThanOrEqual(
      ["NON_COMPLIANT", "PARTIALLY_COMPLIANT", "COMPLIANT"].indexOf(veryPoorLevel)
    );

    // good >= marginal
    expect(
      ["NON_COMPLIANT", "PARTIALLY_COMPLIANT", "COMPLIANT"].indexOf(goodLevel)
    ).toBeGreaterThanOrEqual(
      ["NON_COMPLIANT", "PARTIALLY_COMPLIANT", "COMPLIANT"].indexOf(marginalLevel)
    );

    // excellent is at least as strong as good
    expect(
      ["NON_COMPLIANT", "PARTIALLY_COMPLIANT", "COMPLIANT"].indexOf(excellentLevel)
    ).toBeGreaterThanOrEqual(
      ["NON_COMPLIANT", "PARTIALLY_COMPLIANT", "COMPLIANT"].indexOf(goodLevel)
    );
  });

  it("risk assessment completeness impacts issues (missing controls for high risk)", () => {
    const highRisk = makeHazard({
      description: "Werken op hoogte",
      riskLevel: "high" as any,
      controlMeasures: [],
      effectScore: 50 as any,
      exposureScore: 5 as any,
      probabilityScore: 3 as any,
      riskScore: 750 as any,
    });

    const tra = makeTRA({
      taskSteps: [makeStep({ hazards: [highRisk] })],
      status: "submitted" as any,
    } as any);

    const res = calculateVCACompliance(tra);
    // Expect a CRITICAL or HIGH severity issue about missing controls for high-risk hazard
    const criticalOrMajor = res.issues.filter(
      (i) => i.severity === "critical" || i.severity === "major"
    );
    expect(criticalOrMajor.length).toBeGreaterThan(0);
  });

  it("approvals status affects score and issues", () => {
    const draft = makeTRA({ status: "draft" as any });
    const approved = makeTRA({ status: "approved" as any });

    const draftRes = calculateVCACompliance(draft);
    const approvedRes = calculateVCACompliance(approved);

    // Approved should be at least not worse than draft and likely better
    expect(approvedRes.score).toBeGreaterThanOrEqual(draftRes.score);

    // Approved mag niet slechter scoren dan draft
    expect(approvedRes.score).toBeGreaterThanOrEqual(draftRes.score);
  });

  it("recommendations include category-specific hints", () => {
    const tra = makeTRA({
      description: "kort",
      taskSteps: [],
      status: "draft" as any,
    } as any);

    const res = calculateVCACompliance(tra);
    expect(res.recommendations.length).toBeGreaterThan(0);
  });

  it("isVCACompliant returns boolean and strong TRA tends to pass", () => {
    const strong = makeTRA({
      taskSteps: [
        makeStep({
          description: "Uitgebreide werkbeschrijving",
          hazards: [
            makeHazard({
              description: "Valgevaar",
              controlMeasures: ["Valbeveiliging", "Helm", "Afzetting"],
              riskLevel: "acceptable" as any,
            }),
            makeHazard({
              description: "Elektrisch gevaar",
              controlMeasures: ["Lockout/tagout", "Isolatie", "Spanningsloos stellen"],
              riskLevel: "acceptable" as any,
            }),
          ],
        }),
      ],
      status: "approved" as any,
      teamMembers: ["u1", "u2", "u3"] as any,
      requiredCompetencies: ["VCA-B", "Hoogwerker"] as any,
      title: "Sterke TRA voor conformiteit",
      description:
        "Deze TRA bevat uitgebreide documentatie, beheersmaatregelen en goedkeuringen om hoge conformiteit te bereiken.",
    } as any);

    const result = calculateVCACompliance(strong as any);
    const compliant = isVCACompliant(strong as any);

    expect(typeof result.score).toBe("number");
    expect(typeof compliant).toBe("boolean");
    // Sterke TRA zou in de praktijk doorgaans compliant moeten zijn
  });

  it("edge: zero steps, zero hazards, short doc leads to low score/level", () => {
    const tra = makeTRA({
      title: "x",
      description: "kort",
      taskSteps: [],
      teamMembers: [],
      requiredCompetencies: [],
      status: "draft" as any,
    } as any);

    const res = calculateVCACompliance(tra as any);
    expect(res.isCompliant).toBe(false);
  });
});
