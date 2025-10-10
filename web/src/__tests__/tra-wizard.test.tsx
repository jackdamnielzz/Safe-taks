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

    expect(screen.getByLabelText(/Title/i)).toBeTruthy();

    // fill title
    const title = screen.getByLabelText(/Title/i) as HTMLInputElement;
    fireEvent.change(title, { target: { value: "Test TRA" } });

    // go to next
    const next = screen.getByText(/Next/i);
    fireEvent.click(next);

    // Step 2 should show Task steps header (use getAllByText because step text appears twice)
    await waitFor(() => screen.getAllByText(/Task steps/i)[0]);
    expect(screen.getAllByText(/Task steps/i).length).toBeGreaterThan(0);

    // add a step
    const add = screen.getByText(/Add step/i);
    fireEvent.click(add);

    // go to team step
    fireEvent.click(next);
    await waitFor(() => screen.getByLabelText(/Team members/i));

    // fill team members
    const team = screen.getByLabelText(/Team members/i) as HTMLInputElement;
    fireEvent.change(team, { target: { value: "a@b.com, c@d.com" } });

    // go to review
    fireEvent.click(next);
    await waitFor(() => screen.getByText(/Review/i));
    expect(screen.getByText(/Test TRA/)).toBeTruthy();
  });

  test("autosave sends draft requests", async () => {
    // mock fetch
    const orig = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "draft_1" }) });

    render(<TraWizard />);

    const title = screen.getByLabelText(/Title/i) as HTMLInputElement;
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
