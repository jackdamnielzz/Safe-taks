/**
 * Unit tests for HazardSelector component
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HazardSelector from "@/components/hazards/HazardSelector";

// Mock next-intl translations helper
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string, opts?: any) => (opts && opts.default) || key,
}));

describe("HazardSelector", () => {
  it("renders and shows hazards list", async () => {
    render(<HazardSelector />);

    // Expect search input by aria-label (stable, independent of translation)
    await waitFor(() => {
      expect(screen.getByLabelText(/Zoek gevaren/i)).toBeTruthy();
    });

    // There should be hazard list items (from hazard-library.json)
    const checkboxes = await screen.findAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("filters hazards by search query", async () => {
    render(<HazardSelector />);

    const search = screen.getByLabelText(/Zoek gevaren/i);
    // Type something specific that likely matches 'Elektrische' or 'Val van hoogte'
    fireEvent.change(search, { target: { value: "Elektrische" } });

    // Wait for filtered results
    await waitFor(() => {
      const items = screen.queryAllByRole("checkbox");
      // Expect at least one match
      expect(items.length).toBeGreaterThan(0);
    });

    // Now search for nonsense
    fireEvent.change(search as HTMLInputElement, { target: { value: "this-does-not-exist-xyz" } });
    await waitFor(() => {
      // No checkboxes since filtered out
      const items = screen.queryAllByRole("checkbox");
      expect(items.length).toBe(0);
    });
  });

  it("allows selecting and removing hazards", async () => {
    render(<HazardSelector />);

    // Wait for list and select the first hazard
    const checkboxes = await screen.findAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);

    fireEvent.click(checkboxes[0]);
    // After selecting, the selected list (aside) should show an item
    await waitFor(() => {
      // Selected hazards aside should render at least one selected item (checkbox still checked)
      const selected = screen.getAllByRole("checkbox").some((cb) => (cb as HTMLInputElement).checked);
      expect(selected).toBe(true);
    });

    // Remove the selected hazard via Remove button in the aside
    const removeButtons = screen.getAllByText(/Verwijder|Verwijder/i);
    if (removeButtons.length > 0) {
      // Capture the label/text of the removed item (if available) and click remove
      const removedLabel = removeButtons[0].closest("li")?.textContent || "";
      fireEvent.click(removeButtons[0]);
      await waitFor(() => {
        // Expect the removed item's text to no longer be present in the document
        if (removedLabel) {
          expect(screen.queryByText(new RegExp(removedLabel.trim().slice(0, 40), "i"))).toBeNull();
        } else {
          // Fallback: ensure no selected items remain by checking for absence of selected-list heading or items
          expect(screen.queryByText(/Geselecteerde gevaren|geselecteerd/i)).toBeNull();
        }
      });
    }
  });
});
