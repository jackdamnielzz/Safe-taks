import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Control, useForm } from "react-hook-form";
import "@testing-library/jest-dom";
import { TraHazardWithRisk } from "../TraHazardWithRisk";
import { RiskResult, RiskParameters } from "@/types/risk";

// Minimal test wrapper to provide react-hook-form Control + setValue
function renderWithForm(
  ui: (control: Control<any>, setValue: any) => React.ReactElement,
  defaultValues: any = {}
) {
  const Wrapper: React.FC = () => {
    const { control, setValue } = useForm({
      defaultValues: {
        taskSteps: defaultValues.taskSteps ?? [],
      },
    });
    return ui(control, setValue);
  };

  return render(<Wrapper />);
}

// Mock child components to make tests stable and focused on TraHazardWithRisk behavior

jest.mock("@/components/hazards/HazardSelector", () => {
  type HazardItem = { id: string; name: string; description?: string };

  const HazardSelectorMock: React.FC<{
    value: HazardItem[];
    onChange: (hazards: HazardItem[]) => void;
    allowCustom?: boolean;
    maxSelectable?: number;
  }> = ({ value, onChange }) => {
    return (
      <div data-testid="hazard-selector-mock">
        <button
          type="button"
          onClick={() =>
            onChange([
              ...value,
              {
                id: "h1",
                name: "Valgevaar",
                description: "Werken op hoogte",
              },
            ])
          }
        >
          Add Hazard Mock
        </button>
      </div>
    );
  };

  return {
    __esModule: true,
    default: HazardSelectorMock,
    HazardItem: {} as any,
  };
});

jest.mock("@/components/risk/RiskCalculator", () => {
  const RiskCalculatorMock: React.FC<{
    initialParams: RiskParameters;
    initialNotes?: string;
    onRiskSaved: (result: RiskResult, params: RiskParameters, notes: string) => void;
    title?: string;
    description?: string;
  }> = ({ onRiskSaved }) => {
    return (
      <div data-testid="risk-calculator-mock">
        <button
          type="button"
          onClick={() =>
            onRiskSaved(
              {
                score: 400,
                level: "high",
                requiresAction: true,
                recommendedControls: [],
              },
              {
                effect: 10,
                exposure: 4,
                probability: 10,
              },
              "Test notes"
            )
          }
        >
          Save Risk Mock
        </button>
      </div>
    );
  };

  return {
    __esModule: true,
    default: RiskCalculatorMock,
  };
});

jest.mock("@/components/tra/ControlMeasureManager", () => {
  const ControlMeasureManagerMock: React.FC<{
    hazardId: string;
    existingMeasures: any[];
    suggestedControls?: any[];
    onUpdate: (measures: any[]) => void;
  }> = ({ hazardId, onUpdate }) => {
    return (
      <div data-testid={`control-measure-manager-${hazardId}`}>
        <button
          type="button"
          onClick={() =>
            onUpdate([
              {
                id: "cm1",
                type: "ppe",
                description: "Valbeveiliging",
              },
            ])
          }
        >
          Add Control Mock
        </button>
      </div>
    );
  };

  return {
    __esModule: true,
    default: ControlMeasureManagerMock,
  };
});

jest.mock("@/lib/risk-calculator", () => ({
  formatRiskScore: (score: number) => score.toFixed(0),
}));

// Tests

describe("TraHazardWithRisk", () => {
  it("initializes from existing step hazards with complete risk data", () => {
    const step = {
      hazards: [
        {
          id: "h-initial",
          name: "Initieel gevaar",
          description: "Bestaande hazard",
          effectScore: 10,
          exposureScore: 2,
          probabilityScore: 2,
          riskScore: 40,
          riskLevel: "acceptable",
          controlMeasures: [],
        },
      ],
    };

    renderWithForm(
      (control, setValue) => (
        <TraHazardWithRisk
          stepIndex={0}
          step={step}
          control={control}
          setValue={setValue}
        />
      ),
      { taskSteps: [step] }
    );
 
    // New UI: we no longer show a single header, but the hazard and overall
    // risk summary must be present. Use getAllBy* because the title may appear
    // in multiple places.
    expect(screen.getAllByText(/Initieel gevaar/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Risico Overzicht - Stap 1/i)
    ).toBeInTheDocument();
  });

  it("adds hazards via HazardSelector and persists into form state", () => {
    const initialStep = { hazards: [] };

    const { getByText } = renderWithForm(
      (control, setValue) => (
        <TraHazardWithRisk
          stepIndex={0}
          step={initialStep}
          control={control}
          setValue={setValue}
        />
      ),
      { taskSteps: [initialStep] }
    );

    fireEvent.click(getByText("Add Hazard Mock"));

    expect(
      screen.getByText(/Valgevaar/i)
    ).toBeInTheDocument();
  });

  it("saves risk assessment via RiskCalculator and shows summary", () => {
    const step = {
      hazards: [
        {
          id: "h1",
          name: "Valgevaar",
          description: "Werken op hoogte",
          controlMeasures: [],
        },
      ],
    };

    const { getByRole } = renderWithForm(
      (control, setValue) => (
        <TraHazardWithRisk
          stepIndex={0}
          step={step}
          control={control}
          setValue={setValue}
        />
      ),
      { taskSteps: [step] }
    );
 
    // Only consider the button labeled "Uitklappen", not descriptive text.
    const toggle = getByRole("button", { name: /Uitklappen/i });
    fireEvent.click(toggle);

    const saveBtn = screen.getByText("Save Risk Mock");
    fireEvent.click(saveBtn);

    expect(
      screen.getByText(/Risico Score/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/HIGH/i).length
    ).toBeGreaterThan(0);
  });

  it("shows overall highest risk summary banner when hazards have risk", () => {
    const step = {
      hazards: [
        {
          id: "h1",
          name: "Hoog risico",
          description: "Test",
          effectScore: 10,
          exposureScore: 4,
          probabilityScore: 10,
          riskScore: 400,
          riskLevel: "high",
          controlMeasures: [],
        },
      ],
    };

    renderWithForm(
      (control, setValue) => (
        <TraHazardWithRisk
          stepIndex={0}
          step={step}
          control={control}
          setValue={setValue}
        />
      ),
      { taskSteps: [step] }
    );

    expect(
      screen.getByText(/Hoogste risiconiveau in deze stap/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/HIGH/i).length
    ).toBeGreaterThan(0);
  });

  it("renders validation warnings when hazards missing risk assessments or controls", () => {
    const step = {
      hazards: [
        {
          id: "h-no-risk",
          name: "Onvolledig gevaar",
          description: "Geen riskScore",
          controlMeasures: [],
        },
      ],
    };

    renderWithForm(
      (control, setValue) => (
        <TraHazardWithRisk
          stepIndex={0}
          step={step}
          control={control}
          setValue={setValue}
        />
      ),
      { taskSteps: [step] }
    );

    expect(
      screen.getByText(/Niet alle gevaren hebben een risicobeoordeling/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Ten minste één beheersmaatregel per gevaar is vereist/i)
    ).toBeInTheDocument();
  });

  it("uses readOnly mode to hide interactive controls", () => {
    const step = {
      hazards: [
        {
          id: "h1",
          name: "Valgevaar",
          description: "Test",
          effectScore: 10,
          exposureScore: 2,
          probabilityScore: 2,
          riskScore: 40,
          riskLevel: "acceptable",
          controlMeasures: [],
        },
      ],
    };

    renderWithForm(
      (control, setValue) => (
        <TraHazardWithRisk
          stepIndex={0}
          step={step}
          control={control}
          setValue={setValue}
          readOnly={true}
        />
      ),
      { taskSteps: [step] }
    );
 
    // In readOnly mode, there should be no interactive "Uitklappen" button,
    // but descriptive text may still mention the word "Uitklappen".
    expect(
      screen.queryByRole("button", { name: /Uitklappen/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/Valgevaar/i).length
    ).toBeGreaterThan(0);
  });
});
