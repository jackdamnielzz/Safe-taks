import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TraWizard from "../components/forms/TraWizard";

// Mock next/navigation useRouter for tests
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("TraWizard basic flows", () => {
  test("renders and progresses through steps", async () => {
    render(<TraWizard />);

    // Use Dutch labels since the component uses Dutch translations
    expect(screen.getByLabelText(/Titel/i)).toBeTruthy();

    // fill title
    const title = screen.getByLabelText(/Titel/i) as HTMLInputElement;
    fireEvent.change(title, { target: { value: "Test TRA" } });

    // go to next - use Dutch "Volgende"
    const next = screen.getByText(/Volgende/i);
    fireEvent.click(next);

    // Step 2 should show Task steps header - use Dutch "Taakstappen"
    await waitFor(() => screen.getAllByText(/Taakstappen/i)[0]);
    expect(screen.getAllByText(/Taakstappen/i).length).toBeGreaterThan(0);

    // add a step - use Dutch "Voeg stap toe"
    const add = screen.getByText(/Voeg stap toe/i);
    fireEvent.click(add);

    // go to team step
    fireEvent.click(next);
    await waitFor(() => screen.getAllByText(/Teamleden/i)[0]);

    // fill team members - use the email input placeholder
    const teamInput = screen.getByPlaceholderText(/Voer e-mailadres in/i) as HTMLInputElement;
    fireEvent.change(teamInput, { target: { value: "a@b.com" } });
    
    // Click add button to add team member - target the button specifically to avoid matching explanatory text
    const addButton = screen.getByRole('button', { name: /\+ Toevoegen/i });
    expect(addButton).toBeInTheDocument();
    fireEvent.click(addButton);

    // go to review - wait for the review heading ("Controleer je TRA") and verify title
    fireEvent.click(next);
    await waitFor(() => screen.getByText(/Controleer je TRA/i));
    expect(screen.getByText(/Test TRA/)).toBeTruthy();
  });

  test("autosave sends draft requests", async () => {
    // mock fetch
    const orig = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "draft_1" }) });

    render(<TraWizard />);

    // Use Dutch label "Titel"
    const title = screen.getByLabelText(/Titel/i) as HTMLInputElement;
    fireEvent.change(title, { target: { value: "Autosave TRA" } });

    // wait for debounce (2s) + some buffer
    await waitFor(
      () => {
        const calls = (global.fetch as any)?.mock?.calls?.length || 0;
        expect(calls).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    global.fetch = orig;
  });
});
