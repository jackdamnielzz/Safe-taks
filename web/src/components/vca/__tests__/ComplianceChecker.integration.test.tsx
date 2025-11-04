/**
 * Phase 1.5 scaffold: TraWizard sidebar smoke test for compliance score
 * - Disabled by default (describe.skip) so it doesn't run in regular CI
 * - Includes minimal mocks for i18n and providers (lightweight)
 * - Intentionally small: asserts sidebar renders and displays a compliance badge placeholder
 *
 * Audit: created by automated update on 2025-11-04 to scaffold Phase 1.5 integration test.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "@jest/globals";
import { ComplianceChecker } from "../ComplianceChecker";

// Minimal mock for next-intl useTranslations / provider behavior
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "vca.fullyCompliant": "VCA Volledig Conform",
      "vca.partiallyCompliant": "Gedeeltelijk Conform",
    };
    return map[key] ?? key;
  },
}));

// Minimal TRA mock used in unit tests — keep lightweight
const baseTra = {
  id: "stub-tra-1",
  steps: [
    {
      hazards: [],
    },
  ],
  metadata: {
    title: "Stub TRA",
  },
};

describe.skip("Phase 1.5 - TraWizard sidebar integration (scaffold)", () => {
  it("renders sidebar compliance badge placeholder", () => {
    render(
      // Render the ComplianceChecker as a stand-in for sidebar integration.
      // In Phase 2 we will render the actual TraWizard and verify reactive updates.
      <ComplianceChecker tra={baseTra as any} compact />
    );

    // Assert that component renders and localized label can be found when fully compliant
    // (this test intentionally avoids asserting numeric thresholds)
    const badge = screen.getByText(/VCA Volledig Conform|Gedeeltelijk Conform/i);
    expect(badge).toBeDefined();
  });
});
