import { describe, test, expect } from "@jest/globals";
import { calculateRiskScore, validateScore, determineRiskLevel } from "../lib/risk/kinney-wiruth";

describe("Kinney & Wiruth risk engine", () => {
  test("calculates basic risk score (E×B×W)", () => {
    const score = calculateRiskScore({ consequence: 15, exposure: 3, probability: 1 });
    expect(score).toBeCloseTo(45);
    expect(validateScore(score)).toBe(true);
  });

  test("handles optional exposure default (1)", () => {
    const score = calculateRiskScore({ consequence: 7, probability: 0.5 });
    expect(score).toBeCloseTo(3.5);
    expect(validateScore(score)).toBe(true);
  });

  test("applies multiplicative modifiers", () => {
    const score = calculateRiskScore({
      consequence: 40,
      exposure: 6,
      probability: 0.5,
      modifiers: { controls: 0.5, humanFactor: 1.2 },
    });
    // base = 40*6*0.5 = 120 ; after modifiers = 120 * 0.5 * 1.2 = 72
    expect(score).toBeCloseTo(72);
    // 72 > 70 so maps to Moderate
    expect(determineRiskLevel(score)).toBe("Moderate");
  });

  test("determines risk levels across thresholds", () => {
    expect(determineRiskLevel(20)).toBe("Low");
    expect(determineRiskLevel(70)).toBe("Low");
    expect(determineRiskLevel(71)).toBe("Moderate");
    expect(determineRiskLevel(200)).toBe("Moderate");
    expect(determineRiskLevel(201)).toBe("High");
    expect(determineRiskLevel(1000)).toBe("High");
    expect(determineRiskLevel(1001)).toBe("Extreme");
  });

  test("invalid inputs produce NaN and invalid validation", () => {
    expect(
      Number.isNaN(calculateRiskScore({ consequence: NaN, exposure: 3, probability: 1 }))
    ).toBe(true);
    expect(Number.isNaN(calculateRiskScore({ consequence: -1, exposure: 3, probability: 1 }))).toBe(
      true
    );
    expect(validateScore(NaN)).toBe(false);
    expect(validateScore(-5)).toBe(false);
  });

  test("very small scores normalized correctly", () => {
    const score = calculateRiskScore({ consequence: 1, exposure: 0.00001, probability: 0.00001 });
    // may be extremely small but should be finite (unless underflow)
    expect(typeof score).toBe("number");
    expect(validateScore(score)).toBe(false); // out of practical bounds
  });
});
