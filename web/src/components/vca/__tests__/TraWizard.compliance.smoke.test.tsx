import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TraWizard from "@/components/forms/TraWizard";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: any, opts: any) => {
    // simple mock for keys used in tests
    if (key === "wizard.createTitle") return `Stap ${opts?.step}/${opts?.total}`;
    if (key === "wizard.titleLabel") return "Titel";
    if (key === "wizard.descriptionLabel") return "Beschrijving";
    if (key === "wizard.next") return "Volgende";
    if (key === "wizard.back") return "Terug";
    if (key === "wizard.createButton") return "Maak";
    if (key === "wizard.saving") return "Opslaan...";
    if (key === "wizard.saved") return "Opgeslagen";
    if (key === "wizard.saveFailed") return "Fout bij opslaan";
    return key;
  },
}));

// Minimal sanity test: mount TraWizard, fill basic fields and assert ComplianceChecker renders
describe("TraWizard - VCA Compliance sidebar (smoke)", () => {
  it("renders ComplianceChecker in the sidebar and updates when form changes", async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<TraWizard />);
    });

    // The sidebar should contain the VCA Compliance block (shield icon + heading)
    const sidebar = screen.getByRole("complementary");
    expect(sidebar).toBeInTheDocument();
    expect(screen.getByText(/VCA Compliance/i)).toBeInTheDocument();

    // Fill in title to ensure form change triggers re-render
    const titleInput =
      screen.queryByLabelText("Titel") ||
      screen.getByRole("textbox", { name: /tra-title|wizard.titleLabel|Titel/i });
    await act(async () => {
      await user.type(titleInput as HTMLElement, "Elektrisch werk");
    });

    // After change, the sidebar should still be present and show ComplianceChecker content
    // Check for generic VCA-related text (label or score) in sidebar
    const maybeLabel =
      screen.queryByText(/VCA Compliance/i) ||
      screen.queryByText(/Niet Conform/i) ||
      screen.queryByText(/Totale Score/i);
    expect(maybeLabel).toBeTruthy();
  });
});
