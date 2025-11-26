import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LMRAWizard from "../LMRAWizard";
import { LMRA } from "@/lib/types/lmra";

// Mock next-intl translations in a minimal but stable way
jest.mock("next-intl", () => ({
  useTranslations: (ns?: string) => {
    return (key: string, values?: Record<string, any>) => {
      if (key === "stepOf" && values) {
        return `Stap ${values.current} van ${values.total}`;
      }
      if (key === "progressPercent" && values) {
        return `${values.percent}% voltooid`;
      }

      if (ns === "common" && key === "buttons.previous") return "Vorige";
      if (ns === "common" && key === "buttons.next") return "Volgende";

      if (ns === "safety.lmra.wizard" && key === "title") return "LMRA Wizard";

      // Step titles: we only need something renderable, not exact copy
      if (ns?.startsWith("safety.lmra.steps.") && key === "title") {
        const step = ns.split(".").pop() || "step";
        return `Stap ${step}`;
      }

      // Fallback: include namespace + key for easier debugging
      return `${ns || "t"}.${key}`;
    };
  },
}));

// Mock LMRA API helpers to avoid real network/Firestore calls
jest.mock("@/lib/api/lmra", () => ({
  createLMRA: jest.fn().mockResolvedValue({ id: "lmra-1" }),
  updateLMRA: jest.fn().mockResolvedValue({ ok: true }),
}));

// Prevent Step1_TraSelection from doing real fetches/side-effects in this suite
jest.mock("../steps/Step1_TraSelection", () => {
  return function MockStep1() {
    return (
      <div data-testid="mock-step1">
        Mock Step1_TraSelection
        <button
          type="button"
          onClick={() => {
            // no-op; LMRAWizard initial props drive validation in tests
          }}
        >
          select-tra
        </button>
      </div>
    );
  };
});

function renderWizard(initial?: Partial<LMRA>) {
  return render(<LMRAWizard initial={initial} userId="user-1" userName="Tester" />);
}

describe("LMRAWizard - basic navigation and validation", () => {
  test("renders header, progress and navigation buttons", () => {
    renderWizard();

    expect(screen.getByText("LMRA Wizard")).toBeInTheDocument();
    // use getAllByText because header + footer both show this
    expect(screen.getAllByText(/Stap 1 van 8/).length).toBeGreaterThanOrEqual(1);

    const prev = screen.getByRole("button", { name: "Vorige" });
    const next = screen.getByRole("button", { name: "Volgende" });

    expect(prev).toBeDisabled();
    expect(next).toBeEnabled();
  });

  test("blocks navigation when current step is invalid", async () => {
    renderWizard(); // no step1.traId

    const next = screen.getByRole("button", { name: "Volgende" });
    fireEvent.click(next);

    await waitFor(() => {
      // LMRAWizard sets a generic validationError message; here we assert on the key/fallback
      expect(screen.getByText(/validationError/i)).toBeInTheDocument();
    });

    // Still on step 1 (use allByText-safe check)
    expect(screen.getAllByText(/Stap 1 van 8/).length).toBeGreaterThanOrEqual(1);
  });

  test("advances to step 2 when step1 has traId", async () => {
    renderWizard({
      step1: { traId: "tra-123" },
    } as Partial<LMRA>);

    const next = screen.getByRole("button", { name: "Volgende" });
    fireEvent.click(next);

    await waitFor(() => {
      expect(screen.queryByText(/validationError/i)).toBeNull();
      expect(screen.getAllByText(/Stap 2 van 8/).length).toBeGreaterThanOrEqual(1);
    });
  });

  test("supports going forward and back across steps when data is valid", async () => {
    renderWizard({
      step1: { traId: "tra-1" },
      step2: { latitude: 52.1, longitude: 4.3 },
      step3: {}, // allowed as presence is enough
      step4: {
        teamMembers: [{ userId: "u1", competencyLevel: "certified" }],
        requiredCompetencies: [],
      },
      step5: {
        equipmentList: [{ status: "available" }],
      },
      step6: {
        hazards: [
          {
            id: "h1",
            description: "Test hazard",
            category: "other",
            effectScore: 1,
            exposureScore: 0.5,
            probabilityScore: 0.1,
            riskScore: 0.05,
            riskLevel: "trivial",
          },
        ],
      },
      step7: { decision: "go" },
      step8: {
        signatures: [
          {
            signerId: "s1",
            signatureType: "image",
            signatureData: "x",
            signedAt: new Date(),
          },
        ],
      },
    } as Partial<LMRA>);

    const next = screen.getByRole("button", { name: "Volgende" });
    const prev = screen.getByRole("button", { name: "Vorige" });

    // Start: step 1
    expect(screen.getAllByText(/Stap 1 van 8/).length).toBeGreaterThanOrEqual(1);

    // To step 2
    fireEvent.click(next);
    await waitFor(() => {
      expect(screen.getAllByText(/Stap 2 van 8/).length).toBeGreaterThanOrEqual(1);
    });

    // Back to step 1
    fireEvent.click(prev);
    await waitFor(() => {
      expect(screen.getAllByText(/Stap 1 van 8/).length).toBeGreaterThanOrEqual(1);
    });
  });
});