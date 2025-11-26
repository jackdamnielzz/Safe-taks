import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Use the global next-intl mock from jest.setup.js that loads real Dutch translations
import TemplateSelector from "../components/templates/TemplateSelector";

const sampleTemplates = [
  {
    id: "tpl-1",
    name: "Werk op hoogte",
    description: "Veilig werken op hoogte",
    industry: "Bouw",
    hazards: [],
    steps: [],
    vcaCompliant: true,
  },
  {
    id: "tpl-2",
    name: "Elektrisch onderhoud",
    description: "Veilig werken aan elektrische installaties",
    industry: "Industrie",
    hazards: [],
    steps: [],
    vcaCompliant: false,
  },
];

describe("TemplateSelector", () => {
  const origFetch = global.fetch;

  afterEach(() => {
    global.fetch = origFetch;
    jest.resetAllMocks();
  });

  test("loads templates from API and calls onChange when a template is selected", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ templates: sampleTemplates }),
    } as any);

    const onChange = jest.fn();
    const onTemplateLoad = jest.fn();

    render(
      <TemplateSelector
        value={undefined}
        onChange={onChange}
        onTemplateLoad={onTemplateLoad}
        organizationId="org-1"
      />
    );

    // Wait for templates to appear
    await waitFor(() => expect(screen.getByText(/Werk op hoogte/i)).toBeInTheDocument());

    // Ensure both templates are shown
    expect(screen.getByText(/Elektrisch onderhoud/i)).toBeInTheDocument();

    // Click the first template card/button
    const tplButton = screen.getByText(/Werk op hoogte/i).closest("button");
    expect(tplButton).toBeTruthy();
    fireEvent.click(tplButton!);

    // Expect onChange called with template id and onTemplateLoad called with template object
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("tpl-1");
      // onTemplateLoad may be called from TemplateSelector as well
      expect(onTemplateLoad).toHaveBeenCalled();
    });
  });

  test("shows start from scratch option and calls onChange(null) when clicked", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ templates: sampleTemplates }),
    } as any);

    const onChange = jest.fn();

    render(<TemplateSelector value={"tpl-1"} onChange={onChange} organizationId="org-1" />);

    // Wait for the start from scratch option to appear
    await waitFor(() => {
      const startFromScratchText = screen.getByText(/Begin zonder template/i);
      expect(startFromScratchText).toBeInTheDocument();
    });

    // Find the specific start from scratch button by looking for the h3 element
    const startFromScratchText = screen.getByText(/Begin zonder template/i);
    const scratchBtn = startFromScratchText.closest("button");
    expect(scratchBtn).toBeTruthy();
    fireEvent.click(scratchBtn!);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });
});