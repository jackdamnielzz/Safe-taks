import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import TraWizard from "@/components/forms/TraWizard";

jest.mock("@/components/templates/TemplateSelector", () => {
  return function MockTemplateSelector(props: any) {
    return (
      <div>
        <button onClick={() => props.onChange("tpl-123")}>Use template</button>
        <button onClick={() => props.onChange(null)}>Start from scratch</button>
      </div>
    );
  };
});

describe("TraWizard - template loading", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn(async (input: RequestInfo) => {
      const url = typeof input === "string" ? input : (input as any).url;
      if (url && url.includes("/api/templates/tpl-123")) {
        return {
          ok: true,
          json: async () => ({
            id: "tpl-123",
            name: "Electric Work Template",
            description: "Template for electrical jobs",
            taskSteps: [
              { id: "s1", title: "Isolate power", hazards: [{ id: "h1", title: "Shock" }] },
            ],
            steps: [],
            hazards: [{ id: "h1", title: "Shock" }],
          }),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("pre-populates title, description and steps when a template is selected", async () => {
    renderWithProviders(<TraWizard />);

    // Click the mocked TemplateSelector's "Use template" button
    const btn = screen.getByText("Use template");
    fireEvent.click(btn);

    // Wait for title input to be populated from template
    await waitFor(() => {
      // Label uses "TRA Titel" mapped to id="tra-title"
      const input = screen.getByLabelText(/TRA Titel/i) as HTMLInputElement;
      expect(input).toHaveValue("Electric Work Template");
    });

    // Description should be populated (label text "Beschrijving" with id="tra-description")
    expect(screen.getByLabelText(/Beschrijving/i)).toHaveValue("Template for electrical jobs");

    // The task steps preview (in review step) should reflect loaded steps after navigation
    const nextBtn = screen.getByText(/next/i);
    fireEvent.click(nextBtn); // to Steps
    fireEvent.click(nextBtn); // to Team
    fireEvent.click(nextBtn); // to Review
 
    // Assert that the review step reflects that task steps from the template were loaded.
    await waitFor(() => {
      expect(screen.getByText(/review\.stepsAdded/i)).toBeTruthy();
    });
  });
});