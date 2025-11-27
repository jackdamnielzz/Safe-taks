/**
 * Component tests for StopWorkButton
 * W1.6: Stop-Work Authority Implementation
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StopWorkButton } from "../StopWorkButton";
import { getStopWorkService } from "@/lib/stopWorkService";
import { StopWorkAlert } from "@/lib/types/lmra";

// Mock the stopWorkService
jest.mock("@/lib/stopWorkService", () => ({
  getStopWorkService: jest.fn(),
  getStopWorkSeverityLabel: jest.fn((severity: "moderate" | "high" | "critical") => {
    const labels: Record<string, string> = { moderate: "Matig", high: "Hoog", critical: "Kritiek" };
    return labels[severity];
  }),
  getStopWorkCategoryLabel: jest.fn(
    (category: "weather" | "equipment" | "personnel" | "hazard" | "other") => {
      const labels: Record<string, string> = {
        weather: "Weersomstandigheden",
        equipment: "Apparatuur",
        personnel: "Personeel",
        hazard: "Gevaar",
        other: "Overig",
      };
      return labels[category];
    }
  ),
}));

// Mock AuthProvider
jest.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      uid: "test-user-123",
      email: "test@example.com",
    },
    userProfile: {
      firstName: "John",
      lastName: "Doe",
      role: "field_worker",
    },
  }),
}));

// Mock SignaturePad component
jest.mock("../SignaturePad", () => ({
  __esModule: true,
  default: ({ onSave, signerName }: any) => (
    <div data-testid="signature-pad">
      <p>Signer: {signerName}</p>
      <button
        onClick={() => onSave("data:image/png;base64,mockSignature")}
        data-testid="save-signature"
      >
        Save Signature
      </button>
    </div>
  ),
}));

// Mock PhotoCapture component
jest.mock("../PhotoCapture", () => ({
  __esModule: true,
  default: () => <div data-testid="photo-capture">Photo Capture</div>,
}));

describe("StopWorkButton", () => {
  let mockStopWorkService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock service
    mockStopWorkService = {
      createStopWorkAlert: jest.fn(),
    };
    (getStopWorkService as jest.Mock).mockReturnValue(mockStopWorkService);
  });

  describe("Button Rendering", () => {
    it("should render stop work button", () => {
      render(<StopWorkButton lmraId="test-lmra-123" />);

      const button = screen.getByRole("button", { name: /stop werk/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("STOP WERK");
    });

    it("should be disabled when disabled prop is true", () => {
      render(<StopWorkButton lmraId="test-lmra-123" disabled={true} />);

      const button = screen.getByRole("button", { name: /stop werk/i });
      expect(button).toBeDisabled();
    });

    it("should apply custom className", () => {
      render(<StopWorkButton lmraId="test-lmra-123" className="custom-class" />);

      const button = screen.getByRole("button", { name: /stop werk/i });
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("Dialog Flow", () => {
    it("should open confirmation dialog when button is clicked", () => {
      render(<StopWorkButton lmraId="test-lmra-123" />);

      const button = screen.getByRole("button", { name: /stop werk/i });
      fireEvent.click(button);

      expect(screen.getByText(/STOP WERK BEVESTIGING/i)).toBeInTheDocument();
      expect(screen.getByText(/Weet u zeker dat u het werk wilt stopzetten/i)).toBeInTheDocument();
    });

    it("should close dialog when cancel is clicked", () => {
      render(<StopWorkButton lmraId="test-lmra-123" />);

      // Open dialog
      const button = screen.getByRole("button", { name: /stop werk/i });
      fireEvent.click(button);

      // Click cancel
      const cancelButton = screen.getByRole("button", { name: /annuleren/i });
      fireEvent.click(cancelButton);

      // Dialog should be closed
      expect(screen.queryByText(/STOP WERK BEVESTIGING/i)).not.toBeInTheDocument();
    });

    it("should progress to details step when confirmed", () => {
      render(<StopWorkButton lmraId="test-lmra-123" />);

      // Open dialog
      const button = screen.getByRole("button", { name: /stop werk/i });
      fireEvent.click(button);

      // Click continue
      const continueButton = screen.getByRole("button", { name: /doorgaan/i });
      fireEvent.click(continueButton);

      // Should show details form
      expect(screen.getByText(/STOP WERK DETAILS/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ernst/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/categorie/i)).toBeInTheDocument();
    });

    it("should navigate back from details to confirmation", () => {
      render(<StopWorkButton lmraId="test-lmra-123" />);

      // Navigate to details
      fireEvent.click(screen.getByRole("button", { name: /stop werk/i }));
      fireEvent.click(screen.getByRole("button", { name: /doorgaan/i }));

      // Click back
      const backButton = screen.getByRole("button", { name: /terug/i });
      fireEvent.click(backButton);

      // Should be back at confirmation
      expect(screen.getByText(/STOP WERK BEVESTIGING/i)).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show error when reason is empty", () => {
      render(<StopWorkButton lmraId="test-lmra-123" />);

      // Navigate to details
      fireEvent.click(screen.getByRole("button", { name: /stop werk/i }));
      fireEvent.click(screen.getByRole("button", { name: /doorgaan/i }));

      // Try to proceed without filling reason
      const nextButton = screen.getByRole("button", { name: /volgende/i });
      fireEvent.click(nextButton);

      expect(screen.getByText(/reden is verplicht/i)).toBeInTheDocument();
    });

    it("should show error when description is empty", () => {
      render(<StopWorkButton lmraId="test-lmra-123" />);

      // Navigate to details
      fireEvent.click(screen.getByRole("button", { name: /stop werk/i }));
      fireEvent.click(screen.getByRole("button", { name: /doorgaan/i }));

      // Fill only reason
      const reasonInput = screen.getByLabelText(/reden \(kort\)/i);
      fireEvent.change(reasonInput, { target: { value: "Test reason" } });

      // Try to proceed without description
      const nextButton = screen.getByRole("button", { name: /volgende/i });
      fireEvent.click(nextButton);

      expect(screen.getByText(/beschrijving is verplicht/i)).toBeInTheDocument();
    });

    it("should progress to signature when form is valid", () => {
      render(<StopWorkButton lmraId="test-lmra-123" />);

      // Navigate to details
      fireEvent.click(screen.getByRole("button", { name: /stop werk/i }));
      fireEvent.click(screen.getByRole("button", { name: /doorgaan/i }));

      // Fill form
      const reasonInput = screen.getByLabelText(/reden \(kort\)/i);
      const descriptionInput = screen.getByLabelText(/beschrijving \(gedetailleerd\)/i);

      fireEvent.change(reasonInput, { target: { value: "Unsafe scaffolding" } });
      fireEvent.change(descriptionInput, { target: { value: "Scaffolding is unstable" } });

      // Proceed
      const nextButton = screen.getByRole("button", { name: /volgende/i });
      fireEvent.click(nextButton);

      // Should show signature step
      expect(screen.getByText(/HANDTEKENING VEREIST/i)).toBeInTheDocument();
    });
  });

  describe("Form Inputs", () => {
    it("should update severity selection", () => {
      render(<StopWorkButton lmraId="test-lmra-123" />);

      // Navigate to details
      fireEvent.click(screen.getByRole("button", { name: /stop werk/i }));
      fireEvent.click(screen.getByRole("button", { name: /doorgaan/i }));

      const severitySelect = screen.getByLabelText(/ernst/i) as HTMLSelectElement;
      fireEvent.change(severitySelect, { target: { value: "critical" } });

      expect(severitySelect.value).toBe("critical");
    });

    it("should update category selection", () => {
      render(<StopWorkButton lmraId="test-lmra-123" />);

      // Navigate to details
      fireEvent.click(screen.getByRole("button", { name: /stop werk/i }));
      fireEvent.click(screen.getByRole("button", { name: /doorgaan/i }));

      const categorySelect = screen.getByLabelText(/categorie/i) as HTMLSelectElement;
      fireEvent.change(categorySelect, { target: { value: "equipment" } });

      expect(categorySelect.value).toBe("equipment");
    });

    it("should enforce character limits", () => {
      render(<StopWorkButton lmraId="test-lmra-123" />);

      // Navigate to details
      fireEvent.click(screen.getByRole("button", { name: /stop werk/i }));
      fireEvent.click(screen.getByRole("button", { name: /doorgaan/i }));

      const reasonInput = screen.getByLabelText(/reden \(kort\)/i) as HTMLInputElement;
      expect(reasonInput).toHaveAttribute("maxLength", "100");

      const descriptionInput = screen.getByLabelText(
        /beschrijving \(gedetailleerd\)/i
      ) as HTMLTextAreaElement;
      expect(descriptionInput).toHaveAttribute("maxLength", "500");
    });
  });

  describe("Signature Step", () => {
    beforeEach(() => {
      render(<StopWorkButton lmraId="test-lmra-123" />);

      // Navigate to signature step
      fireEvent.click(screen.getByRole("button", { name: /stop werk/i }));
      fireEvent.click(screen.getByRole("button", { name: /doorgaan/i }));

      const reasonInput = screen.getByLabelText(/reden \(kort\)/i);
      const descriptionInput = screen.getByLabelText(/beschrijving \(gedetailleerd\)/i);

      fireEvent.change(reasonInput, { target: { value: "Test reason" } });
      fireEvent.change(descriptionInput, { target: { value: "Test description" } });
      fireEvent.click(screen.getByRole("button", { name: /volgende/i }));
    });

    it("should show signature pad", () => {
      expect(screen.getByTestId("signature-pad")).toBeInTheDocument();
      expect(screen.getByText(/Signer: John Doe/i)).toBeInTheDocument();
    });

    it("should keep submit disabled when no signature (validation)", () => {
      const submitButton = screen.getByRole("button", { name: /stop werk bevestigen/i });
      // Button should be disabled when signature is not provided
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button after signature is saved", () => {
      const saveButton = screen.getByTestId("save-signature");
      fireEvent.click(saveButton);

      const submitButton = screen.getByRole("button", { name: /stop werk bevestigen/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Alert Submission", () => {
    it("should create stop-work alert successfully", async () => {
      const mockAlert: StopWorkAlert = {
        id: "alert-123",
        lmraId: "test-lmra-123",
        organizationId: "org-123",
        triggeredBy: "test-user-123",
        triggeredByName: "John Doe",
        triggeredAt: new Date(),
        reason: "Test reason",
        severity: "high",
        category: "hazard",
        description: "Test description",
        photoIds: [],
        signature: {
          signerId: "test-user-123",
          signerName: "John Doe",
          signatureData: "data:image/png;base64,mockSignature",
          signedAt: new Date(),
        },
        status: "active",
        notifiedUsers: [],
        notificationsSent: false,
        syncStatus: "synced",
        createdAt: new Date(),
      };

      mockStopWorkService.createStopWorkAlert.mockResolvedValue(mockAlert);

      render(<StopWorkButton lmraId="test-lmra-123" />);

      // Navigate through flow
      fireEvent.click(screen.getByRole("button", { name: /stop werk/i }));
      fireEvent.click(screen.getByRole("button", { name: /doorgaan/i }));

      fireEvent.change(screen.getByLabelText(/reden \(kort\)/i), {
        target: { value: "Test reason" },
      });
      fireEvent.change(screen.getByLabelText(/beschrijving \(gedetailleerd\)/i), {
        target: { value: "Test description" },
      });
      fireEvent.click(screen.getByRole("button", { name: /volgende/i }));

      // Add signature
      fireEvent.click(screen.getByTestId("save-signature"));

      // Submit
      const submitButton = screen.getByRole("button", { name: /stop werk bevestigen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockStopWorkService.createStopWorkAlert).toHaveBeenCalledWith(
          expect.objectContaining({
            lmraId: "test-lmra-123",
            triggeredBy: "test-user-123",
            triggeredByName: "John Doe",
            reason: "Test reason",
            description: "Test description",
            severity: "high",
            category: "hazard",
          })
        );
      });

      // Should show success message
      expect(screen.getByText(/STOP WERK GEACTIVEERD/i)).toBeInTheDocument();
    });

    it("should call onStopWork callback when provided", async () => {
      const mockAlert: StopWorkAlert = {
        id: "alert-123",
        lmraId: "test-lmra-123",
        organizationId: "org-123",
        triggeredBy: "test-user-123",
        triggeredByName: "John Doe",
        triggeredAt: new Date(),
        reason: "Test reason",
        severity: "high",
        category: "hazard",
        description: "Test description",
        photoIds: [],
        signature: {
          signerId: "test-user-123",
          signerName: "John Doe",
          signatureData: "data:image/png;base64,mockSignature",
          signedAt: new Date(),
        },
        status: "active",
        notifiedUsers: [],
        notificationsSent: false,
        syncStatus: "synced",
        createdAt: new Date(),
      };

      mockStopWorkService.createStopWorkAlert.mockResolvedValue(mockAlert);
      const onStopWork = jest.fn();

      render(<StopWorkButton lmraId="test-lmra-123" onStopWork={onStopWork} />);

      // Complete flow
      fireEvent.click(screen.getByRole("button", { name: /stop werk/i }));
      fireEvent.click(screen.getByRole("button", { name: /doorgaan/i }));
      fireEvent.change(screen.getByLabelText(/reden \(kort\)/i), {
        target: { value: "Test reason" },
      });
      fireEvent.change(screen.getByLabelText(/beschrijving \(gedetailleerd\)/i), {
        target: { value: "Test description" },
      });
      fireEvent.click(screen.getByRole("button", { name: /volgende/i }));
      fireEvent.click(screen.getByTestId("save-signature"));
      fireEvent.click(screen.getByRole("button", { name: /stop werk bevestigen/i }));

      await waitFor(() => {
        expect(onStopWork).toHaveBeenCalledWith(mockAlert);
      });
    });

    it("should show error message when submission fails", async () => {
      mockStopWorkService.createStopWorkAlert.mockRejectedValue(new Error("Network error"));

      render(<StopWorkButton lmraId="test-lmra-123" />);

      // Complete flow
      fireEvent.click(screen.getByRole("button", { name: /stop werk/i }));
      fireEvent.click(screen.getByRole("button", { name: /doorgaan/i }));
      fireEvent.change(screen.getByLabelText(/reden \(kort\)/i), {
        target: { value: "Test reason" },
      });
      fireEvent.change(screen.getByLabelText(/beschrijving \(gedetailleerd\)/i), {
        target: { value: "Test description" },
      });
      fireEvent.click(screen.getByRole("button", { name: /volgende/i }));
      fireEvent.click(screen.getByTestId("save-signature"));
      fireEvent.click(screen.getByRole("button", { name: /stop werk bevestigen/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it("should disable buttons during submission", async () => {
      mockStopWorkService.createStopWorkAlert.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<StopWorkButton lmraId="test-lmra-123" />);

      // Complete flow
      fireEvent.click(screen.getByRole("button", { name: /stop werk/i }));
      fireEvent.click(screen.getByRole("button", { name: /doorgaan/i }));
      fireEvent.change(screen.getByLabelText(/reden \(kort\)/i), {
        target: { value: "Test reason" },
      });
      fireEvent.change(screen.getByLabelText(/beschrijving \(gedetailleerd\)/i), {
        target: { value: "Test description" },
      });
      fireEvent.click(screen.getByRole("button", { name: /volgende/i }));
      fireEvent.click(screen.getByTestId("save-signature"));

      const submitButton = screen.getByRole("button", { name: /stop werk bevestigen/i });
      fireEvent.click(submitButton);

      // Button should show loading state
      expect(screen.getByRole("button", { name: /bezig/i })).toBeDisabled();
    });
  });
});
