"use client";

import React, { useState } from "react";
import { Control, UseFormSetValue } from "react-hook-form";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TraHazardWithRisk } from "@/components/tra/TraHazardWithRisk";
import { MaterialsList } from "@/components/tra/MaterialsList";
import { WorkplaceConditionsForm } from "@/components/tra/WorkplaceConditionsForm";
import type { Material, WorkplaceConditions } from "@/lib/types/tra";

/**
 * Step component to edit basic task steps for TRA wizard.
 * - Supports description + duration
 * - Adds TraHazardWithRisk per step to attach hazards and perform risk assessments
 *
 * Props:
 * - control: react-hook-form control (passed from parent)
 * - setValue: react-hook-form setValue to update taskSteps
 * - currentSteps: current taskSteps array
 *
 * Note: this keeps behaviour simple and updates the parent form via setValue.
 */

export function TraStepBasic({
  control,
  setValue,
  currentSteps,
}: {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  currentSteps?: any[];
}) {
  const steps = currentSteps || [];
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  // Per-step active tab index within a task step:
  // 0: stapinformatie, 1: materialen, 2: werkomstandigheden, 3: gevaren & risico
  const [activeSubTabs, setActiveSubTabs] = useState<Record<number, number>>({});

  type SubTabStatus = "empty" | "partial" | "complete" | "skipped";

  const getSubTabStatuses = (step: any): Record<number, SubTabStatus> => {
    const hasDescription =
      typeof step?.description === "string" && step.description.trim().length >= 5;
    const hasDuration = typeof step?.duration === "number" && step.duration > 0;

    const materials = Array.isArray(step?.materials) ? step.materials : [];
    const hasMaterials = materials.length > 0;

    const conditions = step?.workplaceConditions as WorkplaceConditions | undefined;
    const hasAnyConditionFilled =
      !!conditions &&
      Object.entries(conditions).some(([key, value]) => {
        if (key === "notes") {
          return typeof value === "string" && value.trim().length > 0;
        }
        return value !== undefined && value !== null && value !== "";
      });

    const hazards = Array.isArray(step?.hazards) ? step.hazards : [];
    const hasHazards = hazards.length > 0;
    const allHazardsHaveInitialRiskAndControls =
      hasHazards &&
      hazards.every((h: any) => {
        if (!h) return false;
        const hasRiskFields =
          h.effectScore !== undefined &&
          h.exposureScore !== undefined &&
          h.probabilityScore !== undefined &&
          h.riskScore !== undefined &&
          !!h.riskLevel;
        const hasControls =
          Array.isArray(h.controlMeasures) && h.controlMeasures.filter((m: any) => !!m).length > 0;
        return hasRiskFields && hasControls;
      });

    const statuses: Record<number, SubTabStatus> = {
      // 0: Stapinformatie
      0: !hasDescription && !hasDuration ? "empty" : hasDescription && hasDuration ? "complete" : "partial",
      // 1: Materialen (mag leeg zijn - wordt dan "overgeslagen")
      1: !hasMaterials ? "skipped" : "complete",
      // 2: Werkomstandigheden
      2: !conditions
        ? "empty"
        : hasAnyConditionFilled
          ? "complete"
          : "partial",
      // 3: Gevaren & risico
      3: !hasHazards ? "empty" : allHazardsHaveInitialRiskAndControls ? "complete" : "partial",
    };

    return statuses;
  };

  const isStepFullyComplete = (step: any): boolean => {
    const statuses = getSubTabStatuses(step);
    const basicOk = statuses[0] === "complete";
    const materialsOk = statuses[1] === "complete" || statuses[1] === "skipped";
    const conditionsOk = statuses[2] === "complete";
    const hazardsOk = statuses[3] === "complete";

    return basicOk && materialsOk && conditionsOk && hazardsOk;
  };

  const createEmptyStep = () => ({
    description: "",
    duration: 0,
    hazards: [],
    materials: [],
    workplaceConditions: undefined,
  });

  const getActiveSubTabForStep = (stepIndex: number) => {
    const tabIndex = activeSubTabs[stepIndex];
    if (tabIndex === 0 || tabIndex === 1 || tabIndex === 2 || tabIndex === 3) {
      return tabIndex;
    }
    return 0;
  };

  const setActiveSubTabForStep = (stepIndex: number, tabIndex: number) => {
    setActiveSubTabs((prev) => ({
      ...prev,
      [stepIndex]: tabIndex,
    }));
  };

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        // Zorg dat de aangeklikte stap actief wordt en de rest dicht gaat
        newSet.clear();
        newSet.add(index);
        setActiveStepIndex(index);
      }
      return newSet;
    });
  };

  const updateStepAt = (idx: number, patch: Partial<any>) => {
    const updated = [...steps];
    const prevStep = updated[idx] || {};
    const nextStep = { ...prevStep, ...patch };
    updated[idx] = nextStep;

    // Geen automatische extra stap meer toevoegen; gebruiker gebruikt de balk onderaan
    setValue("taskSteps", updated, { shouldDirty: true });
  };

  const goToStep = (idx: number) => {
    if (idx < 0 || idx >= steps.length) return;
    setActiveStepIndex(idx);
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      newSet.clear();
      newSet.add(idx);
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Compacte, mobile-first layout:
          - Bovenaan: compacte lijst met taakstappen (altijd dunne rijen)
          - Onder de lijst: één focuspaneel met tabs voor de actieve stap */}
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm md:text-base text-blue-900">
              Taakstappen en Risicobeoordeling
            </h3>
            <p className="text-xs md:text-sm text-blue-800">
              Werk stap voor stap: kies een taakstap in de lijst en vul daarna de details per tab in.
            </p>
          </div>
          {steps.length > 0 && (
            <div className="hidden md:flex flex-col items-end text-xs text-blue-900">
              <span>{steps.length} stap{steps.length > 1 ? "pen" : ""}</span>
              <span>
                {steps.reduce((acc, step) => acc + (step.hazards?.length || 0), 0)} gevaren
              </span>
            </div>
          )}
        </div>

        {/* Compacte lijst met taakstappen */}
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden max-h-64 md:max-h-72 overflow-y-auto">
          {steps.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-500">
              Nog geen taakstappen. Voeg onderaan de eerste stap toe.
            </div>
          )}

          {steps.map((s, idx) => {
            const hazardCount = s.hazards?.length || 0;
            const hasDescription = s.description && s.description.trim().length > 0;
            const isActive = activeStepIndex === idx;
            const statuses = getSubTabStatuses(s);
            const isComplete = isStepFullyComplete(s);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveStepIndex(idx);
                }}
                className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors ${
                  isActive ? "bg-blue-50 border-l-4 border-l-blue-500" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                      isActive ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm md:text-base text-slate-900">
                      {hasDescription ? s.description : `Stap ${idx + 1}`}
                    </span>
                    <span className="text-xs text-slate-600">
                      {hazardCount > 0
                        ? `${hazardCount} gevaar${hazardCount > 1 ? "en" : ""} • ${
                            s.duration || 0
                          } min`
                        : "Nog geen gevaren toegevoegd"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Kleine indicatoren voor sub-tap status (basic / materialen / condities / gevaren) */}
                  <div className="hidden md:flex items-center gap-1">
                    {[0, 1, 2, 3].map((tabId) => {
                      const status = statuses[tabId];
                      const color =
                        status === "complete"
                          ? "bg-emerald-500"
                          : status === "partial"
                            ? "bg-amber-500"
                            : status === "skipped"
                              ? "bg-slate-400"
                              : "bg-slate-300";
                      return <span key={tabId} className={`w-2 h-2 rounded-full ${color}`} />;
                    })}
                  </div>

                  {s?.status === "completed" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                      Afgerond
                    </span>
                  )}

                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = steps.filter((_, i) => i !== idx);
                        setValue("taskSteps", updated, { shouldDirty: true });

                        // Corrigeer activeStepIndex indien nodig
                        if (activeStepIndex >= updated.length) {
                          setActiveStepIndex(Math.max(0, updated.length - 1));
                        }
                      }}
                      className="ml-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Compacte "nieuwe stap" rij: altijd onder de lijst */}
        <div
          className="border-2 border-dashed border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-600 cursor-pointer hover:border-blue-400 hover:bg-blue-50 flex items-center justify-between"
          onClick={() => {
            const newStep = createEmptyStep();
            const updated = [...steps, newStep];
            setValue("taskSteps", updated, { shouldDirty: true });

            const newIndex = updated.length - 1;
            setActiveStepIndex(newIndex);
          }}
        >
          <span>
            {steps.length === 0 ? (
              <>
                Nog geen taakstappen toegevoegd.{" "}
                <span className="font-medium text-blue-700">
                  Klik hier om de eerste stap aan te maken.
                </span>
              </>
            ) : (
              <>
                Nog een taakstap nodig?{" "}
                <span className="font-medium text-blue-700">
                  Klik hier om een extra stap toe te voegen.
                </span>
              </>
            )}
          </span>
          <span className="text-blue-600 font-bold text-lg">+</span>
        </div>
      </div>

      {/* Focuspaneel voor de actieve stap */}
      {steps.length > 0 && activeStepIndex >= 0 && activeStepIndex < steps.length && (
        <div className="mt-4 space-y-4">
          {(() => {
            const s = steps[activeStepIndex];

            return (
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-base md:text-lg text-slate-900">
                      Stap {activeStepIndex + 1}: {s.description || "Nieuwe taakstap"}
                    </h4>
                    <p className="text-xs md:text-sm text-slate-600">
                      Vul per tab de informatie voor deze taakstap in. Begin bij stapinformatie en
                      werk door naar gevaren & risico.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs md:text-sm">
                    <span className="px-2 py-1 rounded bg-slate-50 border border-slate-200">
                      ⏱ {s.duration || 0} min
                    </span>
                    <span className="px-2 py-1 rounded bg-slate-50 border border-slate-200">
                      ⚠️ {s.hazards?.length || 0} gevaren
                    </span>
                    {s?.status === "completed" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                        Afgerond
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 md:p-5 space-y-4">
                  {/* Tabs voor de actieve stap */}
                  <div className="border-b border-slate-200">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 0, label: "Stapinformatie" },
                        { id: 1, label: "Materialen" },
                        { id: 2, label: "Werkomstandigheden" },
                        { id: 3, label: "Gevaren & risico" },
                      ].map((tab) => {
                        const isActiveTab = getActiveSubTabForStep(activeStepIndex) === tab.id;
                        const subTabStatuses = getSubTabStatuses(s);
                        const status = subTabStatuses[tab.id];
                        const isComplete = status === "complete";
                        const isSkipped = status === "skipped";
                        const isPartial = status === "partial";

                        let statusColor = "bg-slate-300";
                        let statusText = "Dit onderdeel is nog niet ingevuld.";
                        if (isComplete) {
                          statusColor = "bg-emerald-500";
                          statusText = "Dit onderdeel is ingevuld.";
                        } else if (isPartial) {
                          statusColor = "bg-amber-500";
                          statusText = "Dit onderdeel is nog niet compleet.";
                        } else if (isSkipped) {
                          statusColor = "bg-slate-400";
                          statusText =
                            "Dit onderdeel is overgeslagen (niet gebruikt in deze taakstap).";
                        }

                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveSubTabForStep(activeStepIndex, tab.id)}
                            className={`px-3 py-2 text-xs md:text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-2 ${
                              isActiveTab
                                ? "border-blue-600 text-blue-700"
                                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                            }`}
                          >
                            <span>{tab.label}</span>
                            <span
                              className="inline-flex items-center"
                              title={statusText}
                              aria-label={statusText}
                            >
                              <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Korte 1-regel beschrijving per tab */}
                  <div className="mt-1 mb-3 text-xs text-slate-600">
                    {getActiveSubTabForStep(activeStepIndex) === 0 &&
                      "Stap 1: omschrijving en duur van de taakstap."}
                    {getActiveSubTabForStep(activeStepIndex) === 1 &&
                      "Stap 2: voeg materialen en hulpmiddelen toe."}
                    {getActiveSubTabForStep(activeStepIndex) === 2 &&
                      "Stap 3: beschrijf kort de belangrijkste werkomstandigheden."}
                    {getActiveSubTabForStep(activeStepIndex) === 3 &&
                      "Stap 4: selecteer gevaren en beoordeel het risico (initieel en residueel)."}
                  </div>

                  {/* Subtab 1: Basis stapinformatie */}
                  {getActiveSubTabForStep(activeStepIndex) === 0 && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-slate-700">
                            Stap omschrijving
                          </label>
                          <input
                            className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            defaultValue={s.description || ""}
                            onBlur={(e) => updateStepAt(activeStepIndex, { description: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.currentTarget.blur();
                              }
                            }}
                            placeholder="Controleer alle gereedschappen, persoonlijke beschermingsmiddelen..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 text-slate-700">
                            Duur (minuten)
                          </label>
                          <input
                            className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            defaultValue={s.duration ?? ""}
                            onBlur={(e) => {
                              const val = Number(e.target.value) || 0;
                              updateStepAt(activeStepIndex, { duration: val });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.currentTarget.blur();
                              }
                            }}
                            type="number"
                            min={0}
                            placeholder="15"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Subtab 2: Materialen */}
                  {getActiveSubTabForStep(activeStepIndex) === 1 && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <MaterialsList
                        materials={s.materials || []}
                        onChange={(materials: Material[]) =>
                          updateStepAt(activeStepIndex, { materials })
                        }
                        readOnly={false}
                      />
                    </div>
                  )}

                  {/* Subtab 3: Werkomstandigheden */}
                  {getActiveSubTabForStep(activeStepIndex) === 2 && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <WorkplaceConditionsForm
                        conditions={s.workplaceConditions}
                        onChange={(workplaceConditions: WorkplaceConditions) =>
                          updateStepAt(activeStepIndex, { workplaceConditions })
                        }
                        readOnly={false}
                      />
                    </div>
                  )}

                  {/* Subtab 4: Gevaren & risicobeoordeling */}
                  {getActiveSubTabForStep(activeStepIndex) === 3 && (
                    <div className="border-t border-slate-200 pt-4 mt-2">
                      <TraHazardWithRisk
                        stepIndex={activeStepIndex}
                        step={s}
                        control={control}
                        setValue={setValue}
                        readOnly={false}
                      />
                    </div>
                  )}

                  {/* Stapstatus en afronden-actie */}
                  <div className="mt-4 border-t border-slate-200 pt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-xs md:text-sm text-slate-700">
                      {isStepFullyComplete(s) ? (
                        <p>Alle onderdelen van deze stap zijn ingevuld.</p>
                      ) : (
                        <p>Deze stap is nog niet compleet. Controleer de onderdelen per tab.</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isStepFullyComplete(s) && s?.status !== "completed" && (
                        <button
                          type="button"
                          onClick={() => {
                            updateStepAt(activeStepIndex, { status: "completed" });
                          }}
                          className="inline-flex items-center px-4 py-2 rounded bg-emerald-600 text-white text-xs md:text-sm font-medium hover:bg-emerald-700"
                        >
                          Stap afronden
                        </button>
                      )}
                      {s?.status === "completed" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                          Stap is afgerond
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
