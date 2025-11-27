"use client";

import React, { useState, useEffect } from "react";
import { Control, UseFormSetValue } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AlertTriangle, Calculator, ChevronDown, ChevronUp } from "lucide-react";
import RiskCalculator from "@/components/risk/RiskCalculator";
import HazardSelector, { HazardItem } from "@/components/hazards/HazardSelector";
import ControlMeasureManager from "@/components/tra/ControlMeasureManager";
import { getRiskLevelColor } from "@/lib/types/tra";
import { formatRiskScore } from "@/lib/risk-calculator";
import type { RiskResult, RiskParameters, RiskLevel } from "@/types/risk";
import type { ControlMeasure } from "@/lib/types/tra";

interface TraHazardWithRiskProps {
  /** Step index in the wizard */
  stepIndex: number;
  /** Current step data */
  step: any;
  /** Form control */
  control: Control<any>;
  /** Form setValue function */
  setValue: UseFormSetValue<any>;
  /** Whether this is in read-only mode */
  readOnly?: boolean;
}

interface HazardWithRiskData extends HazardItem {
  /** Risk calculation parameters */
  effectScore?: number;
  exposureScore?: number;
  probabilityScore?: number;
  /** Calculated risk values */
  riskScore?: number;
  riskLevel?: string;
  /** Risk assessment notes */
  riskNotes?: string;
  /** Control measures associated with this hazard */
  controlMeasures?: ControlMeasure[];
  /** Residual risk (after controls) */
  residualEffectScore?: number;
  residualExposureScore?: number;
  residualProbabilityScore?: number;
  residualRiskScore?: number;
  residualRiskLevel?: string;
}

export function TraHazardWithRisk({
  stepIndex,
  step,
  control,
  setValue,
  readOnly = false,
}: TraHazardWithRiskProps) {
  const [selectedHazards, setSelectedHazards] = useState<HazardWithRiskData[]>(
    Array.isArray(step?.hazards) ? step.hazards.filter((h: any) => h && h.id) : [],
  );
  const [expandedHazardIndex, setExpandedHazardIndex] = useState<number | null>(null);
  const [hazardRisks, setHazardRisks] = useState<
    Record<string, { result: RiskResult; params: RiskParameters }>
  >({});
  const [hazardResidualRisks, setHazardResidualRisks] = useState<
    Record<string, { result: RiskResult; params: RiskParameters }>
  >({});

  // Collapsible section states voor detailweergaven
  const [isHazardSelectorExpanded, setIsHazardSelectorExpanded] = useState(false);
  const [isRiskAssessmentExpanded, setIsRiskAssessmentExpanded] = useState(false);


  // Keep local hazards in sync when the step.hazards input changes (avoid loops)
  useEffect(() => {
    const safeHazards: HazardWithRiskData[] = Array.isArray(step?.hazards)
      ? step.hazards.filter((h: any) => h && h.id)
      : [];

    setSelectedHazards((prev) => {
      const prevIds = prev
        .filter((h) => h && h.id)
        .map((h) => h.id)
        .join(",");
      const nextIds = safeHazards.map((h) => h.id).join(",");
      if (prevIds === nextIds) {
        return prev;
      }
      return safeHazards;
    });
  }, [step?.hazards]);

  // Initialize hazardRisks from existing hazard data on mount
  useEffect(() => {
    const initialRisks: Record<string, { result: RiskResult; params: RiskParameters }> = {};

    selectedHazards.forEach((hazard) => {
      // Only add to hazardRisks if the hazard exists and has complete risk data
      if (
        hazard &&
        hazard.id &&
        hazard.riskScore !== undefined &&
        hazard.riskLevel &&
        hazard.effectScore !== undefined &&
        hazard.exposureScore !== undefined &&
        hazard.probabilityScore !== undefined
      ) {
        // Validate that riskLevel is a valid RiskLevel type
        const validRiskLevels: RiskLevel[] = [
          "trivial",
          "acceptable",
          "possible",
          "substantial",
          "high",
          "very_high",
        ];
        const level = validRiskLevels.includes(hazard.riskLevel as RiskLevel)
          ? (hazard.riskLevel as RiskLevel)
          : "possible";

        initialRisks[hazard.id] = {
          result: {
            score: hazard.riskScore,
            level: level,
            requiresAction: level === "high" || level === "very_high" || level === "substantial",
            recommendedControls: [],
          },
          params: {
            effect: hazard.effectScore,
            exposure: hazard.exposureScore,
            probability: hazard.probabilityScore,
          },
        };
      }
    });

    if (Object.keys(initialRisks).length > 0) {
      setHazardRisks(initialRisks);
    }
  }, []); // Only run on mount

  // Auto-expand first hazard with high risk (defensive for null/undefined hazards)
  useEffect(() => {
    const highRiskHazard = selectedHazards.findIndex((h) => {
      if (!h || !h.id) return false;
      const risk = hazardRisks[h.id];
      return risk && (risk.result.level === "high" || risk.result.level === "very_high");
    });
    if (highRiskHazard !== -1) {
      setExpandedHazardIndex(highRiskHazard);
    }
  }, [selectedHazards, hazardRisks]);

  const handleHazardsChange = (hazards: HazardItem[]) => {
    // Convert to HazardWithRiskData and preserve existing risk data
    const updatedHazards: HazardWithRiskData[] = (hazards || []).map((hazard) => {
      const existing = selectedHazards.find((e) => e.id === hazard.id);
      return {
        ...hazard,
        effectScore: existing?.effectScore,
        exposureScore: existing?.exposureScore,
        probabilityScore: existing?.probabilityScore,
        riskScore: existing?.riskScore,
        riskLevel: existing?.riskLevel,
        controlMeasures: Array.isArray(existing?.controlMeasures)
          ? existing.controlMeasures.filter((m): m is ControlMeasure => !!m)
          : [],
      };
    });

    // Only update if something actually changed (by id) to avoid feedback loops
    const nextIds = updatedHazards.map((h) => h.id).join(",");
    const currentIds = (Array.isArray(step?.hazards) ? step.hazards : [])
      .map((h: any) => h && h.id)
      .join(",");
    if (nextIds === currentIds) {
      return;
    }

    setSelectedHazards(updatedHazards);

    // Update hazards in the step (form state is source of truth)
    const currentSteps = Array.isArray(control._formValues?.taskSteps)
      ? control._formValues.taskSteps
      : [];
    const updatedSteps = [...currentSteps];
    const updatedStep = {
      ...step,
      hazards: updatedHazards,
    };
    updatedSteps[stepIndex] = updatedStep;
    setValue("taskSteps", updatedSteps, { shouldDirty: true });
  };

  const handleRiskSaved = (
    hazardId: string,
    riskResult: RiskResult,
    params: RiskParameters,
    notes: string,
  ) => {
    setHazardRisks((prev) => ({
      ...prev,
      [hazardId]: { result: riskResult, params },
    }));

    // Update the hazard with risk data
    const updatedHazards = selectedHazards.map((hazard) => {
      if (hazard.id === hazardId) {
        return {
          ...hazard,
          effectScore: params.effect,
          exposureScore: params.exposure,
          probabilityScore: params.probability,
          riskScore: riskResult.score,
          riskLevel: riskResult.level,
          riskNotes: notes,
        };
      }
      return hazard;
    });

    setSelectedHazards(updatedHazards);

    // Update in form
    const updatedStep = {
      ...step,
      hazards: updatedHazards,
    };
    const currentSteps = control._formValues?.taskSteps || [];
    const updatedSteps = [...currentSteps];
    updatedSteps[stepIndex] = updatedStep;
    setValue("taskSteps", updatedSteps, { shouldDirty: true });
  };

  const handleResidualRiskSaved = (
    hazardId: string,
    riskResult: RiskResult,
    params: RiskParameters,
    notes: string,
  ) => {
    setHazardResidualRisks((prev) => ({
      ...prev,
      [hazardId]: { result: riskResult, params },
    }));

    // Update the hazard with residual risk data
    const updatedHazards = selectedHazards.map((hazard) => {
      if (hazard.id === hazardId) {
        return {
          ...hazard,
          residualEffectScore: params.effect,
          residualExposureScore: params.exposure,
          residualProbabilityScore: params.probability,
          residualRiskScore: riskResult.score,
          residualRiskLevel: riskResult.level,
        };
      }
      return hazard;
    });

    setSelectedHazards(updatedHazards);

    // Update in form
    const updatedStep = {
      ...step,
      hazards: updatedHazards,
    };
    const currentSteps = control._formValues?.taskSteps || [];
    const updatedSteps = [...currentSteps];
    updatedSteps[stepIndex] = updatedStep;
    setValue("taskSteps", updatedSteps, { shouldDirty: true });
  };

  const handleControlsUpdated = (
    hazardId: string,
    measures: ControlMeasure[] | null | undefined,
  ) => {
    // Normalize measures to a safe array to protect downstream validators / consumers
    const safeMeasures: ControlMeasure[] = Array.isArray(measures)
      ? measures.filter((m): m is ControlMeasure => !!m)
      : [];

    // Update in-memory hazards defensively
    const updatedHazards = (selectedHazards || []).map((hazard) => {
      if (!hazard || !hazard.id) return hazard;
      if (hazard.id === hazardId) {
        return {
          ...hazard,
          controlMeasures: safeMeasures,
        };
      }
      return {
        ...hazard,
        // Ensure controlMeasures is always an array for consumers like VCA validator
        controlMeasures: Array.isArray(hazard.controlMeasures)
          ? hazard.controlMeasures.filter((m): m is ControlMeasure => !!m)
          : [],
      };
    });

    setSelectedHazards(updatedHazards);

    // Persist to form (also guard against undefined taskSteps)
    const currentSteps = Array.isArray(control._formValues?.taskSteps)
      ? control._formValues.taskSteps
      : [];
    const updatedStep = {
      ...step,
      hazards: updatedHazards,
    };
    const updatedSteps = [...currentSteps];
    updatedSteps[stepIndex] = updatedStep;
    setValue("taskSteps", updatedSteps, { shouldDirty: true });
  };

  const getHighestRiskLevel = () => {
    const risks = Object.values(hazardRisks);
    if (risks.length === 0) return null;

    const priorityOrder = ["very_high", "high", "substantial", "possible", "acceptable", "trivial"];
    let highest = risks[0].result.level;

    for (const risk of risks) {
      if (priorityOrder.indexOf(risk.result.level) < priorityOrder.indexOf(highest)) {
        highest = risk.result.level;
      }
    }

    return highest;
  };

  const highestRisk = getHighestRiskLevel();
  const hasHazards = selectedHazards.length > 0;
  const allHazardsHaveInitialRisk =
    hasHazards &&
    selectedHazards
      .filter((h) => h && h.id)
      .every((h) => !!hazardRisks[h.id as string]);

  return (
    <div className="space-y-4">
      {/* 1. Hazard-overzicht met samenvattingsbadges + Bewerken-knop */}
      {hasHazards && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm md:text-base text-slate-900">
              Gevarenoverzicht
            </h4>
            <span className="text-xs text-slate-500">
              {selectedHazards.length} gevaar
              {selectedHazards.length > 1 ? "en" : ""} in deze taakstap
            </span>
          </div>
          <div className="space-y-2">
            {selectedHazards
              .filter((hazard) => hazard && hazard.id)
              .map((hazard, index) => {
                const initial = hazardRisks[hazard.id];
                const residual = hazardResidualRisks[hazard.id];
                const measuresCount =
                  Array.isArray(hazard.controlMeasures)
                    ? hazard.controlMeasures.filter((m) => !!m).length
                    : 0;

                return (
                  <div
                    key={hazard.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-3 py-2 rounded border border-slate-200 bg-slate-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase text-slate-500">
                          Gevaar {index + 1}
                        </span>
                        <span className="font-medium text-sm text-slate-900 truncate">
                          {hazard.name || hazard.description || `Gevaar ${index + 1}`}
                        </span>
                      </div>
                      {hazard.category && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Categorie: {hazard.category}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {initial && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 text-white text-[11px] font-medium">
                          Initieel: {initial.result.level.toUpperCase().replace("_", " ")} (
                          {formatRiskScore(initial.result.score)})
                        </span>
                      )}

                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-medium">
                        Maatregelen: {measuresCount}
                      </span>

                      {residual && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-medium">
                          Residueel: {residual.result.level.toUpperCase().replace("_", " ")} (
                          {formatRiskScore(residual.result.score)})
                        </span>
                      )}

                      {!readOnly && (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="text-xs"
                          onClick={() => {
                            setExpandedHazardIndex(index);
                          }}
                        >
                          Bewerken
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Overzicht van hoogste risico (zodra er beoordelingen zijn) */}
      {selectedHazards.length > 0 && highestRisk && Object.keys(hazardRisks).length > 0 && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Risico Overzicht - Stap {stepIndex + 1}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Hoogste risiconiveau in deze stap (op basis van ingevulde matrix):
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={`${
                      highestRisk === "very_high"
                        ? "bg-red-900 text-white"
                        : highestRisk === "high"
                          ? "bg-red-500 text-white"
                          : highestRisk === "substantial"
                            ? "bg-orange-500 text-white"
                            : highestRisk === "possible"
                              ? "bg-yellow-500 text-white"
                              : "bg-green-500 text-white"
                    }`}
                  >
                    {highestRisk.toUpperCase().replace("_", " ")}
                  </Badge>
                  {Object.keys(hazardRisks).length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      ({Object.keys(hazardRisks).length} gevaar
                      {Object.keys(hazardRisks).length > 1 ? "en" : ""} beoordeeld)
                    </span>
                  )}
                </div>
              </div>

              {/* Validation Warning */}
              {highestRisk === "very_high" && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Werk niet toegestaan</span>
                </div>
              )}
              {highestRisk === "high" && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Management goedkeuring vereist</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kaart 1: Gevaren kiezen */}
      <div className="bg-white border-2 border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsHazardSelectorExpanded(!isHazardSelectorExpanded)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="text-left">
              <h4 className="font-semibold text-lg text-slate-900">Gevaren kiezen</h4>
              <p className="text-sm text-slate-600">
                {selectedHazards.length > 0
                  ? `${selectedHazards.length} gevaar${
                      selectedHazards.length > 1 ? "en" : ""
                    } geselecteerd`
                  : "Selecteer gevaren uit de bibliotheek voor deze taakstap"}
              </p>
            </div>
          </div>
          {isHazardSelectorExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-600" />
          )}
        </button>
 
        {isHazardSelectorExpanded && (
          <div className="px-5 pb-5 border-t border-slate-200">
            <div className="pt-4">
              <p className="text-sm text-slate-600 mb-4">
                Kies uit de gevarenbibliotheek of voeg een eigen gevaar toe. Voor elk geselecteerd
                gevaar voert u daarna een risicobeoordeling uit volgens de Kinney & Wiruth
                methode.
              </p>
 
              <HazardSelector
                value={selectedHazards}
                onChange={handleHazardsChange}
                allowCustom={true}
                maxSelectable={10}
              />
 
              {selectedHazards.length === 0 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      <strong>Belangrijk:</strong> Selecteer minimaal één gevaar voor deze stap om
                      de risicobeoordeling te kunnen invullen.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
 
      {/* Kaart 2: Risicobeoordeling per gevaar (geblokkeerd totdat er gevaren zijn) */}
      <div className="bg-white border-2 border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div className="text-left">
              <h5 className="font-semibold text-lg text-slate-900">
                Risicobeoordeling per gevaar
              </h5>
              <p className="text-sm text-slate-600">
                {Object.keys(hazardRisks).length > 0 && hasHazards
                  ? `${Object.keys(hazardRisks).length} van ${selectedHazards.length} gevaren beoordeeld`
                  : hasHazards
                    ? "Beoordeel elk geselecteerd gevaar afzonderlijk"
                    : "Selecteer eerst gevaren in de bovenste kaart"}
              </p>
            </div>
          </div>
        </div>
 
        <div className="px-5 pb-5">
          {!hasHazards && (
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm text-slate-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>
                  Selecteer eerst minimaal één gevaar in de kaart <strong>Gevaren kiezen</strong>{" "}
                  hierboven. Daarna kunt u hier het initiële risico per gevaar beoordelen.
                </span>
              </p>
            </div>
          )}
 
          {hasHazards && (
            <>
              <div className="pt-4 space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Beoordeel elk gevaar afzonderlijk. Klik op "Uitklappen" om de Kinney
                  & Wiruth calculator te openen.
                </p>
 
                {selectedHazards
                  .filter((hazard) => hazard && hazard.id)
                  .map((hazard, index) => {
                    const riskData = hazardRisks[hazard.id];
                    const riskResult = riskData?.result;
                    const riskParams = riskData?.params;
                    const riskColor = riskResult
                      ? getRiskLevelColor(riskResult.level)
                      : "#94a3b8";
 
                    return (
                      <div
                        key={hazard.id}
                        className="bg-white border-2 rounded-lg p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
                        style={{ borderLeftColor: riskColor, borderLeftWidth: "6px" }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${riskColor}20` }}
                            >
                              <AlertTriangle
                                className="h-5 w-5"
                                style={{ color: riskColor }}
                              />
                            </div>
                            <div>
                              <h6 className="font-semibold text-slate-900">
                                {hazard.name || `Gevaar ${index + 1}`}
                              </h6>
                              {hazard.category && (
                                <p className="text-xs text-slate-500">{hazard.category}</p>
                              )}
                            </div>
                            {riskResult && (
                              <Badge
                                className={`${
                                  riskResult.level === "very_high"
                                    ? "bg-red-900 text-white"
                                    : riskResult.level === "high"
                                      ? "bg-red-500 text-white"
                                      : riskResult.level === "substantial"
                                        ? "bg-orange-500 text-white"
                                        : riskResult.level === "possible"
                                          ? "bg-yellow-500 text-white"
                                          : "bg-green-500 text-white"
                                }`}
                              >
                                {riskResult.level.toUpperCase().replace("_", " ")}
                              </Badge>
                            )}
                          </div>
 
                          <div className="flex items-center gap-2">
                            {!readOnly && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setExpandedHazardIndex(
                                    expandedHazardIndex === index ? null : index,
                                  )
                                }
                              >
                                {expandedHazardIndex === index ? "Inklappen" : "Uitklappen"}
                              </Button>
                            )}
                          </div>
                        </div>
 
                        {hazard.description && (
                          <div className="bg-slate-50 rounded p-3 border border-slate-200">
                            <p className="text-sm text-slate-700 break-words whitespace-normal">
                              {hazard.description}
                            </p>
                          </div>
                        )}
 
                        {/* STEP 1: Risk Calculator (Moet eerst ingevuld worden) */}
                        {expandedHazardIndex === index && !readOnly && (
                          <div className="border-t pt-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                                1
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-blue-900">
                                  Stap 1: Beoordeel eerst het initiële risico
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                  Beoordeel het risico ZONDER beheersmaatregelen om de ernst van het
                                  gevaar te bepalen.
                                </p>
                              </div>
                            </div>
                            <RiskCalculator
                              initialParams={{
                                effect: hazard.effectScore || 0,
                                exposure: hazard.exposureScore || 0,
                                probability: hazard.probabilityScore || 0,
                              }}
                              initialNotes={hazard.riskNotes || ""}
                              onRiskSaved={(result, params, notes) => {
                                handleRiskSaved(hazard.id, result, params, notes);
                              }}
                              title={`Risicobeoordeling: ${hazard.name || `Gevaar ${index + 1}`}`}
                              description="Bereken het risico volgens Kinney & Wiruth"
                            />
                          </div>
                        )}
 
                        {/* Risk Summary (Altijd zichtbaar na beoordeling) */}
                        {riskResult && riskParams && (
                          <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">Risico Score</p>
                                <p className="text-lg font-mono" style={{ color: riskColor }}>
                                  {formatRiskScore(riskResult.score)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">
                                  E × B × W = {riskParams.effect} × {riskParams.exposure} ×{" "}
                                  {riskParams.probability}
                                </p>
                              </div>
                            </div>
                            {hazard.riskNotes && (
                              <div className="pt-2 border-t border-slate-200">
                                <p className="text-xs font-medium text-slate-600 mb-1">
                                  Opmerkingen:
                                </p>
                                <p className="text-sm text-slate-700">{hazard.riskNotes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </div>
 
      {/* Kaart 3: Beheersmaatregelen & residueel risico (geblokkeerd totdat alle gevaren een initieel risico hebben) */}
      <div className="bg-white border-2 border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div className="text-left">
              <h5 className="font-semibold text-lg text-slate-900">
                Beheersmaatregelen & residueel risico
              </h5>
              <p className="text-sm text-slate-600">
                {!hasHazards
                  ? "Selecteer eerst gevaren en voer een initiële risicobeoordeling uit."
                  : !allHazardsHaveInitialRisk
                    ? "Beoordeel eerst het initiële risico voor elk geselecteerd gevaar."
                    : "Voeg beheersmaatregelen toe en beoordeel het residuele risico per gevaar."}
              </p>
            </div>
          </div>
        </div>
 
        <div className="px-5 pb-5">
          {!hasHazards && (
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm text-slate-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>
                  Selecteer eerst één of meer gevaren in de kaart <strong>Gevaren kiezen</strong>{" "}
                  en vul het initiële risico in de kaart{" "}
                  <strong>Risicobeoordeling per gevaar</strong> in.
                </span>
              </p>
            </div>
          )}
 
          {hasHazards && !allHazardsHaveInitialRisk && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  Beoordeel eerst het initiële risico voor elk geselecteerd gevaar in de kaart{" "}
                  <strong>Risicobeoordeling per gevaar</strong>. Daarna kunt u hier
                  beheersmaatregelen toevoegen en het residuele risico beoordelen.
                </span>
              </p>
            </div>
          )}
 
          {hasHazards && allHazardsHaveInitialRisk && (
            <div className="pt-4 space-y-4">
              {selectedHazards
                .filter((hazard) => hazard && hazard.id)
                .map((hazard, index) => {
                  const riskData = hazardRisks[hazard.id];
                  const riskResult = riskData?.result;
                  const residual = hazardResidualRisks[hazard.id];
                  const residualResult = residual?.result;
                  const residualParams = residual?.params;
                  const baseRiskColor = riskResult
                    ? getRiskLevelColor(riskResult.level)
                    : "#94a3b8";
 
                  return (
                    <div
                      key={hazard.id}
                      className="bg-white border-2 rounded-lg p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
                      style={{
                        borderLeftColor: baseRiskColor,
                        borderLeftWidth: "6px",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${baseRiskColor}20` }}
                          >
                            <AlertTriangle
                              className="h-5 w-5"
                              style={{ color: baseRiskColor }}
                            />
                          </div>
                          <div>
                            <h6 className="font-semibold text-slate-900">
                              {hazard.name || `Gevaar ${index + 1}`}
                            </h6>
                            {hazard.category && (
                              <p className="text-xs text-slate-500">{hazard.category}</p>
                            )}
                          </div>
                        </div>
                      </div>
 
                      {/* STEP 2: Beheersmaatregelen */}
                      {riskResult ? (
                        <div className="pt-3">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                              2
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-green-900">
                                Stap 2: Bepaal nu de beheersmaatregelen
                              </p>
                              <p className="text-xs text-green-700 mt-1">
                                Op basis van het{" "}
                                {riskResult.level.replace("_", " ").toUpperCase()} risico bepaalt u
                                welke maatregelen nodig zijn.
                              </p>
                            </div>
                          </div>
                          <ControlMeasureManager
                            hazardId={hazard.id}
                            existingMeasures={hazard.controlMeasures || []}
                            suggestedControls={(hazard as any).commonControls || []}
                            onUpdate={(measures) => handleControlsUpdated(hazard.id, measures)}
                          />
                        </div>
                      ) : (
                        !readOnly && (
                          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg mt-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-amber-900 mb-1">
                                  ⚠️ Risicobeoordeling Vereist
                                </p>
                                <p className="text-sm text-amber-800">
                                  U moet eerst het initiële risico beoordelen voordat u
                                  beheersmaatregelen kunt toevoegen. Vul deze stap in de kaart{" "}
                                  <strong>Risicobeoordeling per gevaar</strong> in.
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )}
 
                      {/* STEP 3: Residueel risico */}
                      {riskResult &&
                      hazard.controlMeasures &&
                      hazard.controlMeasures.length > 0 ? (
                        <div className="pt-3">
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                              3
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-purple-900">
                                Stap 3: Beoordeel het residuele risico
                              </p>
                              <p className="text-xs text-purple-700 mt-1">
                                Beoordeel het restrisico NA toepassing van de beheersmaatregelen.
                              </p>
                            </div>
                          </div>
 
                          <RiskCalculator
                            initialParams={{
                              effect: hazard.residualEffectScore || 0,
                              exposure: hazard.residualExposureScore || 0,
                              probability: hazard.residualProbabilityScore || 0,
                            }}
                            initialNotes=""
                            onRiskSaved={(result, params, notes) => {
                              handleResidualRiskSaved(hazard.id, result, params, notes);
                            }}
                            title={`Residueel Risico: ${
                              hazard.name || `Gevaar ${index + 1}`
                            }`}
                            description="Beoordeel het restrisico na de beheersmaatregelen"
                          />
 
                          {residualResult && residualParams && (
                            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-purple-900">
                                  Residueel Risico
                                </p>
                                <Badge
                                  className={`${
                                    residualResult.level === "very_high"
                                      ? "bg-red-900 text-white"
                                      : residualResult.level === "high"
                                        ? "bg-red-500 text-white"
                                        : residualResult.level === "substantial"
                                          ? "bg-orange-500 text-white"
                                          : residualResult.level === "possible"
                                            ? "bg-yellow-500 text-white"
                                            : "bg-green-500 text-white"
                                  }`}
                                >
                                  {residualResult.level.toUpperCase().replace("_", " ")}
                                </Badge>
                              </div>
                              <p className="text-sm text-purple-700">
                                Score: {formatRiskScore(residualResult.score)} (E=
                                {residualParams.effect} × B={residualParams.exposure} × W=
                                {residualParams.probability})
                              </p>
 
                              {(residualResult.level === "high" ||
                                residualResult.level === "very_high") && (
                                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-red-800">
                                    <strong>Waarschuwing:</strong> Het residuele risico is nog
                                    steeds HOOG. Overweeg aanvullende beheersmaatregelen of herzie
                                    de werkwijze.
                                  </p>
                                </div>
                              )}
 
                              {riskResult &&
                                residualResult &&
                                riskResult.score >
                                  residualResult.score * 2 && (
                                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded flex items-start gap-2">
                                    <svg
                                      className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    <p className="text-xs text-green-800">
                                      <strong>Goed:</strong> Het risico is significant verminderd
                                      door de beheersmaatregelen.
                                    </p>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      ) : (
                        riskResult && (
                          <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg mt-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-purple-900 mb-1">
                                  📋 Residuele Risicobeoordeling Beschikbaar
                                </p>
                                <p className="text-sm text-purple-800">
                                  Voeg eerst beheersmaatregelen toe, daarna kunt u het residuele
                                  risico beoordelen om te valideren dat de maatregelen effectief
                                  zijn.
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
 
      {/* Validatie-overzicht (niet meer gekoppeld aan fases) */}
      {selectedHazards.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-medium">Validatie</h5>

              {/* Check if all hazards have risk assessments */}
              {selectedHazards.some((h) => h && h.id && !hazardRisks[h.id]) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">
                      <strong>Let op:</strong> Niet alle gevaren hebben een
                      risicobeoordeling. Dit is verplicht voor een complete TRA.
                    </span>
                  </div>
                </div>
              )}

              {/* Check if at least one control measure exists per hazard */}
              {selectedHazards.some(
                (h) =>
                  !h ||
                  !Array.isArray(h.controlMeasures) ||
                  h.controlMeasures.filter((m) => !!m).length === 0,
              ) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">
                      <strong>Let op:</strong> Ten minste één beheersmaatregel per
                      gevaar is vereist.
                    </span>
                  </div>
                </div>
              )}

              {/* Check for high-risk hazards without controls */}
              {selectedHazards.some((h) => {
                if (!h || !h.id) return false;
                const r = hazardRisks[h.id];
                const hasControls =
                  Array.isArray(h.controlMeasures) &&
                  h.controlMeasures.filter((m) => !!m).length > 0;
                return (
                  r &&
                  (r.result.level === "high" || r.result.level === "very_high") &&
                  !hasControls
                );
              }) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">
                      <strong>Hoog risico zonder beheersmaatregelen:</strong> Voeg
                      beheersmaatregelen toe of herzie de risico-inschatting.
                    </span>
                  </div>
                </div>
              )}

              {/* Check for high-risk hazards (general) */}
              {Object.values(hazardRisks).some(
                (r) => r.result.level === "high" || r.result.level === "very_high",
              ) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">
                      <strong>Hoog risico gedetecteerd:</strong> Deze TRA vereist
                      mogelijk management goedkeuring of fundamentele wijzigingen in de werkwijze.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

    </div>
  );
}

export default TraHazardWithRisk;
