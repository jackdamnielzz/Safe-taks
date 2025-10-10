/**
 * LMRA Execution Hook
 * Manages LMRA session state and execution workflow
 * Task 5.5: LMRA Execution Workflow
 */

import { useState, useCallback, useEffect } from "react";
import {
  LMRASession,
  CreateLMRARequest,
  UpdateLMRARequest,
  EnvironmentalCheck,
  PersonnelCheck,
  EquipmentCheck,
  LMRAPhoto,
  LMRAAssessment,
  WeatherConditions,
} from "@/lib/types/lmra";
import { TRA } from "@/lib/types/tra";
import { getOfflineSyncManager } from "@/lib/offlineSyncManager";
import { getWeatherService } from "@/lib/weatherService";

// ============================================================================
// TYPES
// ============================================================================

interface UseLMRAExecutionOptions {
  traId: string;
  projectId: string;
  onComplete?: (session: LMRASession) => void;
  onError?: (error: Error) => void;
}

interface LMRAExecutionState {
  session: LMRASession | null;
  currentStep: number;
  isLoading: boolean;
  error: string | null;
  weather: WeatherConditions | null;
  isOffline: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useLMRAExecution(options: UseLMRAExecutionOptions) {
  const { traId, projectId, onComplete, onError } = options;

  const [state, setState] = useState<LMRAExecutionState>({
    session: null,
    currentStep: 0,
    isLoading: false,
    error: null,
    weather: null,
    isOffline: !navigator.onLine,
  });

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setState((s) => ({ ...s, isOffline: false }));
    const handleOffline = () => setState((s) => ({ ...s, isOffline: true }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /**
   * Start new LMRA session
   */
  const startSession = useCallback(
    async (
      location: CreateLMRARequest["location"],
      teamMembers: string[]
    ): Promise<LMRASession | null> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const requestData: CreateLMRARequest = {
          traId,
          projectId,
          teamMembers,
          location,
        };

        // If offline, queue for sync
        if (!navigator.onLine) {
          const offlineSession: LMRASession = {
            id: `offline_${Date.now()}`,
            ...requestData,
            organizationId: "", // Will be filled on sync
            performedBy: "", // Will be filled on sync
            location: {
              ...location,
              capturedAt: new Date(),
            },
            environmentalChecks: [],
            personnelChecks: [],
            equipmentChecks: [],
            photos: [],
            overallAssessment: "safe_to_proceed",
            startedAt: new Date(),
            syncStatus: "pending_sync",
            createdAt: new Date(),
          };

          const syncManager = getOfflineSyncManager();
          await syncManager.queueLMRASession(offlineSession.id, offlineSession, "create");

          setState((s) => ({ ...s, session: offlineSession, isLoading: false, currentStep: 1 }));
          return offlineSession;
        }

        // Online - create via API
        const response = await fetch("/api/lmra-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          throw new Error("Failed to create LMRA session");
        }

        const result = await response.json();
        const newSession: LMRASession = result.data;

        setState((s) => ({ ...s, session: newSession, isLoading: false, currentStep: 1 }));
        return newSession;
      } catch (error) {
        const err = error as Error;
        setState((s) => ({ ...s, error: err.message, isLoading: false }));
        onError?.(err);
        return null;
      }
    },
    [traId, projectId, onError]
  );

  /**
   * Fetch weather conditions
   */
  const fetchWeather = useCallback(
    async (latitude: number, longitude: number): Promise<void> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const weatherService = getWeatherService();
        const weather = await weatherService.getWeatherWithCache(latitude, longitude);

        setState((s) => ({ ...s, weather, isLoading: false }));

        // Update session with weather data
        if (state.session) {
          await updateSession({ weatherConditions: weather });
        }
      } catch (error) {
        const err = error as Error;
        setState((s) => ({ ...s, error: err.message, isLoading: false }));
        onError?.(err);
      }
    },
    [state.session, onError]
  );

  /**
   * Add environmental check
   */
  const addEnvironmentalCheck = useCallback(
    async (check: EnvironmentalCheck): Promise<void> => {
      if (!state.session) return;

      const updatedChecks = [...state.session.environmentalChecks, check];
      await updateSession({ environmentalChecks: updatedChecks });
    },
    [state.session]
  );

  /**
   * Add personnel check
   */
  const addPersonnelCheck = useCallback(
    async (check: PersonnelCheck): Promise<void> => {
      if (!state.session) return;

      const updatedChecks = [...state.session.personnelChecks, check];
      await updateSession({ personnelChecks: updatedChecks });
    },
    [state.session]
  );

  /**
   * Add equipment check
   */
  const addEquipmentCheck = useCallback(
    async (check: EquipmentCheck): Promise<void> => {
      if (!state.session) return;

      const updatedChecks = [...state.session.equipmentChecks, check];
      await updateSession({ equipmentChecks: updatedChecks });
    },
    [state.session]
  );

  /**
   * Add photo
   */
  const addPhoto = useCallback(
    async (photo: LMRAPhoto): Promise<void> => {
      if (!state.session) return;

      const updatedPhotos = [...state.session.photos, photo];
      await updateSession({ photos: updatedPhotos });
    },
    [state.session]
  );

  /**
   * Update session
   */
  const updateSession = useCallback(
    async (updates: UpdateLMRARequest): Promise<void> => {
      if (!state.session) return;

      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        // If offline, queue for sync
        if (!navigator.onLine) {
          const updatedSession = {
            ...state.session,
            ...updates,
            syncStatus: "pending_sync" as const,
            updatedAt: new Date(),
          };

          const syncManager = getOfflineSyncManager();
          await syncManager.queueLMRASession(updatedSession.id, updatedSession, "update");

          setState((s) => ({ ...s, session: updatedSession, isLoading: false }));
          return;
        }

        // Online - update via API
        const response = await fetch(`/api/lmra-sessions/${state.session.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error("Failed to update LMRA session");
        }

        const result = await response.json();
        setState((s) => ({ ...s, session: result.data, isLoading: false }));
      } catch (error) {
        const err = error as Error;
        setState((s) => ({ ...s, error: err.message, isLoading: false }));
        onError?.(err);
      }
    },
    [state.session, onError]
  );

  /**
   * Complete LMRA session
   */
  const completeSession = useCallback(
    async (
      assessment: LMRAAssessment,
      comments?: string,
      digitalSignature?: string
    ): Promise<void> => {
      if (!state.session) return;

      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const response = await fetch(`/api/lmra-sessions/${state.session.id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: state.session.id,
            overallAssessment: assessment,
            comments,
            digitalSignature,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to complete LMRA session");
        }

        const result = await response.json();
        const completedSession: LMRASession = result.data;

        setState((s) => ({ ...s, session: completedSession, isLoading: false }));
        onComplete?.(completedSession);
      } catch (error) {
        const err = error as Error;
        setState((s) => ({ ...s, error: err.message, isLoading: false }));
        onError?.(err);
      }
    },
    [state.session, onComplete, onError]
  );

  /**
   * Go to next step
   */
  const nextStep = useCallback(() => {
    setState((s) => ({ ...s, currentStep: Math.min(s.currentStep + 1, 7) }));
  }, []);

  /**
   * Go to previous step
   */
  const previousStep = useCallback(() => {
    setState((s) => ({ ...s, currentStep: Math.max(s.currentStep - 1, 0) }));
  }, []);

  /**
   * Go to specific step
   */
  const goToStep = useCallback((step: number) => {
    setState((s) => ({ ...s, currentStep: Math.max(0, Math.min(step, 7)) }));
  }, []);

  return {
    // State
    session: state.session,
    currentStep: state.currentStep,
    isLoading: state.isLoading,
    error: state.error,
    weather: state.weather,
    isOffline: state.isOffline,

    // Actions
    startSession,
    updateSession,
    completeSession,
    fetchWeather,
    addEnvironmentalCheck,
    addPersonnelCheck,
    addEquipmentCheck,
    addPhoto,

    // Navigation
    nextStep,
    previousStep,
    goToStep,
  };
}

/**
 * Hook for real-time LMRA session updates
 * Task 5.10: Real-time Dashboard Updates
 */
export function useLMRARealtimeUpdates(sessionId: string | null) {
  const [session, setSession] = useState<LMRASession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    // This will be enhanced with Firestore real-time listeners in Task 5.10
    // For now, polling approach
    const fetchSession = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/lmra-sessions/${sessionId}`);
        if (response.ok) {
          const result = await response.json();
          setSession(result.data);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
    const interval = setInterval(fetchSession, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [sessionId]);

  return { session, isLoading };
}
