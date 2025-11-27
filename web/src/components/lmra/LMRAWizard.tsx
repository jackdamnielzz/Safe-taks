"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LMRA, LMRAStepNumber, StopWorkAlert } from "@/lib/types/lmra";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import Step1_TraSelection from "./steps/Step1_TraSelection";
import Step2_LocationVerification from "./steps/Step2_LocationVerification";
import Step3_WeatherConditions from "./steps/Step3_WeatherConditions";
import Step4_TeamCompetencies from "./steps/Step4_TeamCompetencies";
import Step5_EquipmentVerification from "./steps/Step5_EquipmentVerification";
import Step6_HazardAssessment from "./steps/Step6_HazardAssessment";
import Step7_GoNoGo from "./steps/Step7_GoNoGo";
import Step8_Signatures from "./steps/Step8_Signatures";
import { StopWorkButton } from "./StopWorkButton";
import { createLMRA, updateLMRA, LMRAPayload } from "@/lib/api/lmra";

/**
 * LMRAWizard.tsx
 *
 * Main wizard wrapper for the 8-step LMRA flow.
 * This is a lightweight, framework-ready skeleton:
 * - step navigation
 * - progress tracking
 * - auto-save hook placeholders
 * - per-step validation hook placeholders
 *
 * NOTE: Individual step components live under web/src/components/lmra/steps/
 * and should implement a shared contract:
 *   interface StepProps { lmra: Partial<LMRA>; onChange: (payload) => void; onValidate: () => boolean; }
 *
 * This file is intentionally conservative: it avoids importing step components
 * directly so it can be committed before the per-step components are created.
 */

type WizardState = {
  lmra: Partial<LMRA>;
  currentStep: LMRAStepNumber;
  saving: boolean;
  error?: string | null;
};

const TOTAL_STEPS = 8;

export default function LMRAWizard({
  initial,
  userId,
  userName,
}: {
  initial?: Partial<LMRA>;
  userId?: string;
  userName?: string;
}) {
  const t = useTranslations("safety.lmra.wizard");
  const tSteps = useTranslations("safety.lmra.steps");
  const tCommon = useTranslations("common");

  const [state, setState] = useState<WizardState>({
    lmra: initial || {},
    currentStep: (initial?.currentStep as LMRAStepNumber) || 1,
    saving: false,
    error: null,
  });

  // Navigation
  const goTo = useCallback((step: number) => {
    if (step < 1) step = 1;
    if (step > TOTAL_STEPS) step = TOTAL_STEPS;
    setState((s) => ({ ...s, currentStep: step as LMRAStepNumber }));
  }, []);

  const next = useCallback(() => {
    setState((s) => {
      const nextStep = Math.min(TOTAL_STEPS, s.currentStep + 1) as LMRAStepNumber;
      return { ...s, currentStep: nextStep };
    });
  }, []);

  const previous = useCallback(() => {
    setState((s) => ({ ...s, currentStep: Math.max(1, s.currentStep - 1) as LMRAStepNumber }));
  }, []);

  // Auto-save with create/update via API helper (debounced + simple retry)
  const autoSave = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      const debounceMs = 500;
      let retryCount = 0;

      const doSave = async (lmraPatch: Partial<LMRA>) => {
        setState((s) => ({ ...s, saving: true }));
        try {
          // determine if we need to create or update
          const lmraId = (state.lmra as any)?.id;
          const payload: LMRAPayload = { ...lmraPatch };
          if (!lmraId) {
            const res = await createLMRA(payload);
            // expect created object with id
            const newId = res?.id || res?.lmra?.id;
            setState((s) => ({
              ...s,
              lmra: { ...s.lmra, ...lmraPatch, id: newId },
              saving: false,
            }));
          } else {
            await updateLMRA(lmraId, payload);
            setState((s) => ({ ...s, lmra: { ...s.lmra, ...lmraPatch }, saving: false }));
          }
          retryCount = 0;
        } catch (err: any) {
          retryCount++;
          setState((s) => ({ ...s, saving: false, error: err?.message || "Save failed" }));
          // simple exponential backoff up to 3 retries
          if (retryCount <= 3) {
            const backoff = 200 * Math.pow(2, retryCount);
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => doSave(lmraPatch), backoff);
          }
        }
      };

      return async (lmraPatch: Partial<LMRA>) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          // capture latest state patch
          void doSave(lmraPatch);
        }, debounceMs);
      };
    })(),
    [state.lmra]
  );

  // Per-step change handler used by step components
  const handleStepChange = useCallback(
    (stepNumber: LMRAStepNumber, payload: Partial<LMRA>) => {
      setState((s) => {
        const newLmra = { ...s.lmra };
        const stepKey = `step${stepNumber}` as keyof Partial<LMRA>;
        // @ts-expect-error dynamic step assignment
        newLmra[stepKey] = { ...(newLmra[stepKey] as object), ...payload };
        // trigger autosave with merged snapshot
        void autoSave({ ...newLmra });
        return { ...s, lmra: newLmra };
      });
    },
    [autoSave]
  );


  // Validation for current step, using strict per-step rules
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const { currentStep, lmra } = state;

    switch (currentStep) {
      case 1:
        return !!lmra.step1?.traId;
      case 2:
        return !!lmra.step2?.latitude && !!lmra.step2?.longitude;
      case 3:
        return !!lmra.step3;
      case 4:
        return !!lmra.step4?.teamMembers && lmra.step4.teamMembers.length > 0;
      case 5:
        return !!lmra.step5?.equipmentList && lmra.step5.equipmentList.length > 0;
      case 6:
        return !!lmra.step6?.hazards && lmra.step6.hazards.length > 0;
      case 7:
        return !!lmra.step7?.decision && lmra.step7.decision !== "pending";
      case 8:
        return !!lmra.step8?.signatures && lmra.step8.signatures.length > 0;
      default:
        return false;
    }
  }, [state]);

  const handleNextClicked = useCallback(async () => {
    const ok = await validateCurrentStep();
    if (!ok) {
      setState((s) => ({ ...s, error: t("validationError") }));
      return;
    }
    setState((s) => ({ ...s, error: null }));
    next();
  }, [next, validateCurrentStep, t]);

  // Handle stop-work alert creation
  const handleStopWorkCreated = useCallback((alert: StopWorkAlert) => {
    console.log("Stop-work alert created:", alert);
    // Show notification to user
    setState((s) => ({
      ...s,
      error: null,
    }));
    // Optionally pause LMRA execution or show warning
    // The LMRA status will be updated to 'stop_work' by the API
  }, []);

  // Keyboard shortcuts for navigation (optional)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNextClicked();
      if (e.key === "ArrowLeft") previous();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNextClicked, previous]);

  // Render step content placeholder
  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <div>
            <h3>{tSteps("step1.title")}</h3>
            <Step1_TraSelection
              lmra={state.lmra}
              onChange={(stepPayload) => {
                handleStepChange(1, { step1: stepPayload } as Partial<LMRA>);
              }}
            />
          </div>
        );
      case 2:
        return (
          <div>
            <h3>{tSteps("step2.title")}</h3>
            <Step2_LocationVerification
              lmra={state.lmra}
              onChange={(stepPayload) => {
                handleStepChange(2, { step2: stepPayload } as Partial<LMRA>);
              }}
            />
          </div>
        );
      case 3:
        return (
          <div>
            <h3>{tSteps("step3.title")}</h3>
            <Step3_WeatherConditions
              lmra={state.lmra}
              onChange={(stepPayload) => {
                handleStepChange(3, { step3: stepPayload } as Partial<LMRA>);
              }}
            />
          </div>
        );
      case 4:
        return (
          <div>
            <h3>{tSteps("step4.title")}</h3>
            <Step4_TeamCompetencies
              lmra={state.lmra}
              onChange={(stepPayload) => {
                handleStepChange(4, { step4: stepPayload } as Partial<LMRA>);
              }}
            />
          </div>
        );
      case 5:
        return (
          <div>
            <h3>{tSteps("step5.title")}</h3>
            <Step5_EquipmentVerification
              lmra={state.lmra}
              onChange={(stepPayload) => {
                handleStepChange(5, { step5: stepPayload } as Partial<LMRA>);
              }}
            />
          </div>
        );
      case 6:
        return (
          <div>
            <h3>{tSteps("step6.title")}</h3>
            <Step6_HazardAssessment
              lmra={state.lmra}
              onChange={(stepPayload) => {
                handleStepChange(6, { step6: stepPayload } as Partial<LMRA>);
              }}
            />
          </div>
        );
      case 7:
        return (
          <div>
            <h3>{tSteps("step7.title")}</h3>
            <Step7_GoNoGo
              lmra={state.lmra}
              onChange={(stepPayload) => {
                handleStepChange(7, { step7: stepPayload } as Partial<LMRA>);
              }}
            />
          </div>
        );
      case 8:
        return (
          <div>
            <h3>{tSteps("step8.title")}</h3>
            <Step8_Signatures
              lmra={state.lmra}
              onChange={(stepPayload) => {
                handleStepChange(8, { step8: stepPayload } as Partial<LMRA>);
              }}
            />
          </div>
        );
      default:
        return <div>{t("unknownStep")}</div>;
    }
  };

  return (
    <div className="lmra-wizard relative">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <div className="text-sm text-muted">
            {t("stepOf", { current: state.currentStep, total: TOTAL_STEPS })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {state.saving && <LoadingSpinner size="sm" />}
          {state.error && <div className="text-sm text-red-600">{state.error}</div>}
        </div>
      </header>

      <main className="p-4 bg-white rounded shadow-sm">{renderStep()}</main>

      <footer className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={previous}
            disabled={state.currentStep === 1}
            className="btn btn-secondary"
            aria-label={tCommon("buttons.previous")}
          >
            {tCommon("buttons.previous")}
          </button>
          <button
            onClick={handleNextClicked}
            className="btn btn-primary"
            aria-label={tCommon("buttons.next")}
          >
            {tCommon("buttons.next")}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted">
            {t("progressPercent", { percent: Math.round((state.currentStep / TOTAL_STEPS) * 100) })}
          </div>
          <div className="text-sm text-muted">
            {t("stepOf", { current: state.currentStep, total: TOTAL_STEPS })}
          </div>
        </div>
      </footer>

      {/* Emergency Stop-Work Button - Always visible during LMRA execution */}
      {state.lmra.id && (
        <div className="fixed bottom-4 right-4 z-50">
          <StopWorkButton lmraId={state.lmra.id as string} onStopWork={handleStopWorkCreated} />
        </div>
      )}
    </div>
  );
}
