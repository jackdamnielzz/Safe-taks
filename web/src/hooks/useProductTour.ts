"use client";

import { useState, useEffect, useCallback } from "react";
import { Step } from "react-joyride";

// Local storage keys for tour state
const TOUR_COMPLETED_KEY = "safework-pro-tour-completed";
const TOUR_SKIPPED_KEY = "safework-pro-tour-skipped";

export interface TourState {
  run: boolean;
  stepIndex: number;
  steps: Step[];
}

export interface UseProductTourReturn {
  tourState: TourState;
  startTour: () => void;
  skipTour: () => void;
  resetTour: () => void;
  handleJoyrideCallback: (data: any) => void;
  shouldShowTour: boolean;
}

/**
 * Custom hook for managing the product tour state and lifecycle
 *
 * Features:
 * - Detects first-time users
 * - Manages tour progression
 * - Handles tour completion and skipping
 * - Persists tour state in localStorage
 */
export function useProductTour(): UseProductTourReturn {
  const [tourState, setTourState] = useState<TourState>({
    run: false,
    stepIndex: 0,
    steps: [],
  });

  const [shouldShowTour, setShouldShowTour] = useState(false);

  // Tour steps configuration
  const steps: Step[] = [
    {
      target: "body",
      content: "",
      placement: "center",
      disableBeacon: true,
      hideCloseButton: true,
      hideFooter: false,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      target: '[data-tour="create-tra"]',
      content: "",
      placement: "bottom",
      disableBeacon: true,
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="execute-lmra"]',
      content: "",
      placement: "bottom",
      disableBeacon: true,
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="view-reports"]',
      content: "",
      placement: "bottom",
      disableBeacon: true,
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="navigation"]',
      content: "",
      placement: "left",
      disableBeacon: true,
      spotlightPadding: 8,
    },
  ];

  // Check if user should see tour on component mount
  useEffect(() => {
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    const tourSkipped = localStorage.getItem(TOUR_SKIPPED_KEY);

    // Show tour if user hasn't completed or skipped it
    const shouldShow = !tourCompleted && !tourSkipped;
    setShouldShowTour(shouldShow);

    // Auto-start tour after a short delay if user should see it
    if (shouldShow) {
      const timer = setTimeout(() => {
        startTour();
      }, 2000); // 2 second delay to let page load

      return () => clearTimeout(timer);
    }
  }, []);

  // Initialize tour state with steps
  useEffect(() => {
    setTourState((prev) => ({
      ...prev,
      steps,
    }));
  }, []);

  const startTour = useCallback(() => {
    setTourState((prev) => ({
      ...prev,
      run: true,
      stepIndex: 0,
    }));
  }, []);

  const skipTour = useCallback(() => {
    setTourState((prev) => ({
      ...prev,
      run: false,
    }));
    localStorage.setItem(TOUR_SKIPPED_KEY, "true");
    setShouldShowTour(false);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    localStorage.removeItem(TOUR_SKIPPED_KEY);
    setShouldShowTour(true);
    setTourState((prev) => ({
      ...prev,
      run: false,
      stepIndex: 0,
    }));
  }, []);

  const handleJoyrideCallback = useCallback((data: any) => {
    const { action, index, status, type } = data;

    if (["finished", "skipped"].includes(status)) {
      // Tour completed or skipped
      setTourState((prev) => ({
        ...prev,
        run: false,
      }));

      if (status === "finished") {
        localStorage.setItem(TOUR_COMPLETED_KEY, "true");
      } else {
        localStorage.setItem(TOUR_SKIPPED_KEY, "true");
      }

      setShouldShowTour(false);
    } else if (type === "step:after") {
      // Move to next step
      setTourState((prev) => ({
        ...prev,
        stepIndex: index + (action === "prev" ? -1 : 1),
      }));
    }
  }, []);

  return {
    tourState,
    startTour,
    skipTour,
    resetTour,
    handleJoyrideCallback,
    shouldShowTour,
  };
}

/**
 * Helper function to add tour data attributes to elements
 */
export function addTourTarget(targetId: string) {
  return {
    "data-tour": targetId,
  };
}
