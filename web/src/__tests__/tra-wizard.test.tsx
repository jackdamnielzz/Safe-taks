import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TraWizard from "../components/forms/TraWizard";

// Mock next/navigation useRouter for tests
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

beforeAll(() => {
  // Mock scrollIntoView so we can assert on smooth scroll behavior
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

describe("TraWizard basic flows", () => {
  test("blocks next on missing start mode and then basic fields", async () => {
    render(<TraWizard />);

    // Initially on step 0 (start mode + project selector)
    const nextButton = screen.getByRole("button", {
      name: /Volgende|Next|templates\.selector\.startWithTemplate/i,
    });

    // Click next without choosing start mode
    fireEvent.click(nextButton);

    // Step-level error banner should be rendered for step 0
    const stepError = await screen.findByTestId("tra-step-error");
    expect(stepError).toBeInTheDocument();

    // scrollIntoView should have been called to bring the error into view
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();

    // Now choose a start mode so we can progress (keep using template mode to match other tests)
    const startWithTemplate = screen.getByRole("button", {
      name: /Start met TRA-sjabloon/i,
    });
    fireEvent.click(startWithTemplate);

    // Error should disappear when a valid choice is made and we go to next step
    fireEvent.click(nextButton);

    // On step 1 the title field must now be present
    expect(screen.getByLabelText(/Titel|titleLabel/i)).toBeTruthy();

    // Raw i18n key for "required" must never leak into the UI
    expect(
      screen.queryByText(/safety\.tra\.wizard\.validation\.required/)
    ).toBeNull();
  });

  test("renders and progresses through steps", async () => {
    const initialData: any = {
      title: "Init TRA",
      projectId: "project-1",
      taskSteps: [
        {
          stepNumber: 1,
          description: "Stap 1",
          hazards: [
            {
              id: "h1",
              description: "Test hazard",
              category: "physical",
              source: "custom",
              effectScore: 1,
              exposureScore: 0.5,
              probabilityScore: 0.5,
              riskScore: 0.25,
              riskLevel: "trivial",
              controlMeasures: [
                {
                  id: "cm1",
                  type: "ppe",
                  description: "Test control",
                },
              ],
            },
          ],
        },
      ],
      teamMembers: [],
    };
 
    render(<TraWizard initialData={initialData} />);
 
    // Step 0: choose start mode (project is already in initialData)
    const nextButton = screen.getByRole("button", {
      name: /Volgende|Next|templates\.selector\.startWithTemplate/i,
    });

    const startEmpty = screen.getByRole("button", {
      name: /Begin met lege TRA/i,
    });
    fireEvent.click(startEmpty);

    // Move to basic info step
    fireEvent.click(nextButton);

    // Label text may be translated or fall back to key when next-intl is mocked
    expect(screen.getByLabelText(/Titel|titleLabel/i)).toBeTruthy();
 
    // fill title
    const title = screen.getByLabelText(/Titel|titleLabel/i) as HTMLInputElement;
    fireEvent.change(title, { target: { value: "Test TRA" } });
 
    // go to next via primary CTA button (label comes from i18n)
    fireEvent.click(nextButton);
 
    // Step 3 (wizard index 2) should show Task steps section - use Dutch "Taakstappen"
    await waitFor(() => screen.getAllByText(/Taakstappen/i)[0]);
    expect(screen.getAllByText(/Taakstappen/i).length).toBeGreaterThan(0);
 
    // go to team step using same next button
    fireEvent.click(nextButton);
    await waitFor(() => screen.getAllByText(/Teamleden/i)[0]);
  
    // fill team members - use the email input placeholder (current UI uses "naam@voorbeeld.nl")
    const teamInput = screen.getByPlaceholderText(/naam@voorbeeld\.nl/i) as HTMLInputElement;
    fireEvent.change(teamInput, { target: { value: "a@b.com" } });
  
    // Click add button to add team member - label currently "+ Teamlid toevoegen"
    const addButton = screen.getByRole("button", { name: /\+ Teamlid toevoegen/i });
    expect(addButton).toBeInTheDocument();
    fireEvent.click(addButton);
  });
 
  // Autosave is currently disabled in TraWizard (AUTOSAVE_DELAY = null), so this
  // test is skipped to avoid asserting on behavior that is not active.
  test.skip("autosave sends draft requests", async () => {
    render(<TraWizard />);
 
    const title = screen.getByLabelText(/Titel|titleLabel/i) as HTMLInputElement;
    fireEvent.change(title, { target: { value: "Autosave TRA" } });
 
    await waitFor(
      () => {
        // no-op – kept for backward compatibility
      },
      { timeout: 100 }
    );
  });

  test("step 3 blocks Next when no step is afgerond", async () => {
    const initialData: any = {
      title: "Init TRA",
      projectId: "project-1",
      taskSteps: [
        {
          stepNumber: 1,
          description: "Stap 1",
          duration: 10,
          hazards: [
            {
              id: "h1",
              description: "Test hazard",
              category: "physical",
              source: "custom",
              effectScore: 1,
              exposureScore: 0.5,
              probabilityScore: 0.5,
              riskScore: 0.25,
              riskLevel: "trivial",
              controlMeasures: [
                {
                  id: "cm1",
                  type: "ppe",
                  description: "Test control",
                },
              ],
            },
          ],
          // Let op: geen status: "completed"
        },
      ],
      teamMembers: [],
    };

    render(<TraWizard initialData={initialData} />);

    const nextButton = screen.getByRole("button", {
      name: /Volgende|Next|templates\.selector\.startWithTemplate/i,
    });

    // Kies start mode zodat we verder kunnen (project in initialData is al aanwezig)
    const startEmpty = screen.getByRole("button", {
      name: /Begin met lege TRA/i,
    });
    fireEvent.click(startEmpty);
    fireEvent.click(nextButton); // naar basic

    // vul verplichte velden op basis-stap zodat we naar taakstappen kunnen
    const titleInput = screen.getByLabelText(/Titel|titleLabel/i) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "Test TRA" } });

    fireEvent.click(nextButton); // naar steps

    // Nog geen stap afgerond -> Next vanuit stap 3 moet blokkeren
    fireEvent.click(nextButton);

    const error = await screen.findByText(
      /Rond minimaal één taakstap af met de knop 'Stap afronden' voordat je verder gaat\./i
    );
    expect(error).toBeInTheDocument();
  });

  test("Wijzigingen opslaan calls draft endpoint without triggering final submit", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "draft-tra-1" }),
    });
    (global as any).fetch = fetchMock;

    const initialData: any = {
      title: "Draft TRA",
      projectId: "project-1",
      taskSteps: [],
      teamMembers: [],
    };

    render(<TraWizard initialData={initialData} />);

    const saveButton = screen.getByRole("button", { name: /Wijzigingen opslaan/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/tras/draft",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/tras",
      expect.anything()
    );
  });
});
