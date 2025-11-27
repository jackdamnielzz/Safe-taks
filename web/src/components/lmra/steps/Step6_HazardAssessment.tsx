"use client";

import React, { useState, useCallback } from "react";
import { AlertTriangle, Plus, Trash2, Shield, TrendingUp, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  LMRAStep6_HazardAssessment,
  LMRAStep6_Hazard,
  HazardCategory,
  LMRAEffectScore,
  LMRAExposureScore,
  LMRAProbabilityScore,
  LMRARiskLevel,
  LMRA,
  calculateLMRARiskScore,
  getLMRARiskLevel,
  getLMRARiskColor,
} from "@/lib/types/lmra";

type Props = {
  lmra?: Partial<LMRA>;
  onChange: (stepPayload: Partial<LMRAStep6_HazardAssessment>) => void;
};

const EFFECT_SCORES: { value: LMRAEffectScore; label: string; description: string }[] = [
  { value: 1, label: "1 - Verwaarloosbaar", description: "Kleine verwondingen, geen verzuim" },
  { value: 3, label: "3 - Klein", description: "Lichte verwondingen, < 3 dagen verzuim" },
  { value: 7, label: "7 - Ernstig", description: "Ernstige verwondingen, > 3 dagen verzuim" },
  { value: 15, label: "15 - Zeer Ernstig", description: "Blijvend letsel, invaliditeit" },
  { value: 40, label: "40 - Dodelijk", description: "Eén dodelijk slachtoffer" },
  { value: 100, label: "100 - Catastrofaal", description: "Meerdere dodelijke slachtoffers" },
];

const EXPOSURE_SCORES: { value: LMRAExposureScore; label: string; description: string }[] = [
  { value: 0.5, label: "0.5 - Zeer Zelden", description: "Eens per jaar" },
  { value: 1, label: "1 - Zelden", description: "Eens per maand" },
  { value: 2, label: "2 - Af en toe", description: "Eens per week" },
  { value: 3, label: "3 - Regelmatig", description: "Eens per dag" },
  { value: 6, label: "6 - Vaak", description: "Meerdere keren per dag" },
  { value: 10, label: "10 - Voortdurend", description: "Continu" },
];

const PROBABILITY_SCORES: { value: LMRAProbabilityScore; label: string; description: string }[] = [
  { value: 0.1, label: "0.1 - Bijna Onmogelijk", description: "< 0.1%" },
  { value: 0.2, label: "0.2 - Praktisch Onmogelijk", description: "0.1% - 1%" },
  { value: 0.5, label: "0.5 - Denkbaar", description: "1% - 10%" },
  { value: 1, label: "1 - Mogelijk", description: "10% - 30%" },
  { value: 3, label: "3 - Ongebruikelijk", description: "30% - 50%" },
  { value: 6, label: "6 - Waarschijnlijk", description: "50% - 90%" },
  { value: 10, label: "10 - Te Verwachten", description: "> 90%" },
];

export default function Step6_HazardAssessment({ lmra, onChange }: Props) {
  const t = useTranslations("safety.lmra.steps.step6");
  const current = lmra?.step6;

  const HAZARD_CATEGORIES: { value: HazardCategory; label: string }[] = [
    { value: "electrical", label: t("categories.electrical") },
    { value: "mechanical", label: t("categories.mechanical") },
    { value: "chemical", label: t("categories.chemical") },
    { value: "biological", label: t("categories.biological") },
    { value: "physical", label: t("categories.physical") },
    { value: "ergonomic", label: t("categories.ergonomic") },
    { value: "psychosocial", label: t("categories.psychosocial") },
    { value: "fire_explosion", label: t("categories.fire_explosion") },
    { value: "environmental", label: t("categories.environmental") },
    { value: "other", label: t("categories.other") },
  ];
  const [hazards, setHazards] = useState<LMRAStep6_Hazard[]>(current?.hazards || []);
  const [notes, setNotes] = useState(current?.notes || "");

  const updateStep = useCallback(
    (updatedHazards: LMRAStep6_Hazard[], stepNotes: string) => {
      onChange({
        hazards: updatedHazards,
        identifiedAt: new Date(),
        notes: stepNotes || undefined,
      });
    },
    [onChange]
  );

  const calculateRisk = (
    effect: LMRAEffectScore,
    exposure: LMRAExposureScore,
    probability: LMRAProbabilityScore
  ): { score: number; level: LMRARiskLevel } => {
    const score = calculateLMRARiskScore(effect, exposure, probability);
    const level = getLMRARiskLevel(score);
    return { score, level };
  };

  const handleAddHazard = () => {
    const newHazard: LMRAStep6_Hazard = {
      id: `hazard-${Date.now()}`,
      description: "",
      category: "other",
      effectScore: 1,
      exposureScore: 0.5,
      probabilityScore: 0.1,
      riskScore: 0.05,
      riskLevel: "trivial",
      controlMeasures: [],
      createdAt: new Date(),
    };
    const updated = [...hazards, newHazard];
    setHazards(updated);
    updateStep(updated, notes);
  };

  const handleRemoveHazard = (index: number) => {
    const updated = hazards.filter((_, i) => i !== index);
    setHazards(updated);
    updateStep(updated, notes);
  };

  const handleUpdateHazard = (index: number, field: keyof LMRAStep6_Hazard, value: any) => {
    const updated = hazards.map((hazard, i) => {
      if (i === index) {
        const updatedHazard = { ...hazard, [field]: value };

        // Recalculate risk if scores changed
        if (field === "effectScore" || field === "exposureScore" || field === "probabilityScore") {
          const risk = calculateRisk(
            updatedHazard.effectScore,
            updatedHazard.exposureScore,
            updatedHazard.probabilityScore
          );
          updatedHazard.riskScore = risk.score;
          updatedHazard.riskLevel = risk.level;
        }

        return updatedHazard;
      }
      return hazard;
    });
    setHazards(updated);
    updateStep(updated, notes);
  };

  const handleAddControlMeasure = (hazardIndex: number) => {
    const updated = hazards.map((hazard, i) => {
      if (i === hazardIndex) {
        const newMeasure = {
          id: `measure-${Date.now()}`,
          description: "",
          responsible: "",
          status: "planned" as const,
        };
        return {
          ...hazard,
          controlMeasures: [...(hazard.controlMeasures || []), newMeasure],
        };
      }
      return hazard;
    });
    setHazards(updated);
    updateStep(updated, notes);
  };

  const handleUpdateControlMeasure = (
    hazardIndex: number,
    measureIndex: number,
    field: string,
    value: any
  ) => {
    const updated = hazards.map((hazard, i) => {
      if (i === hazardIndex) {
        const measures = (hazard.controlMeasures || []).map((measure, mi) => {
          if (mi === measureIndex) {
            return { ...measure, [field]: value };
          }
          return measure;
        });
        return { ...hazard, controlMeasures: measures };
      }
      return hazard;
    });
    setHazards(updated);
    updateStep(updated, notes);
  };

  const handleRemoveControlMeasure = (hazardIndex: number, measureIndex: number) => {
    const updated = hazards.map((hazard, i) => {
      if (i === hazardIndex) {
        const measures = (hazard.controlMeasures || []).filter((_, mi) => mi !== measureIndex);
        return { ...hazard, controlMeasures: measures };
      }
      return hazard;
    });
    setHazards(updated);
    updateStep(updated, notes);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    updateStep(hazards, value);
  };

  const highRiskHazards = hazards.filter(
    (h) => h.riskLevel === "high" || h.riskLevel === "very_high"
  );

  const getRiskLevelLabel = (level: LMRARiskLevel): string => {
    const labels: Record<LMRARiskLevel, string> = {
      trivial: t("riskLevels.trivial"),
      acceptable: t("riskLevels.acceptable"),
      possible: t("riskLevels.possible"),
      substantial: t("riskLevels.substantial"),
      high: t("riskLevels.high"),
      very_high: t("riskLevels.very_high"),
    };
    return labels[level];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("title")}</h3>
        <p className="text-sm text-gray-600">{t("description")}</p>
      </div>

      {/* Risk Summary */}
      {hazards.length > 0 && (
        <div
          className={`rounded-lg border-2 p-4 ${
            highRiskHazards.length > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
          }`}
        >
          <div className="flex items-start gap-3">
            {highRiskHazards.length > 0 ? (
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Shield className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4
                className={`font-medium mb-1 ${
                  highRiskHazards.length > 0 ? "text-red-900" : "text-green-900"
                }`}
              >
                {highRiskHazards.length > 0
                  ? t("riskSummary.highRiskHazards", {
                      count: highRiskHazards.length,
                      plural: highRiskHazards.length !== 1 ? "en" : "",
                    })
                  : t("riskSummary.noHighRisk")}
              </h4>
              <p
                className={`text-sm ${
                  highRiskHazards.length > 0 ? "text-red-700" : "text-green-700"
                }`}
              >
                {t("riskSummary.hazardsIdentified", { count: hazards.length })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hazards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">{t("identifiedHazards")}</h4>
          <button
            onClick={handleAddHazard}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4" />
            {t("addHazardButton")}
          </button>
        </div>

        {hazards.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-4">{t("noHazardsYet")}</p>
            <button
              onClick={handleAddHazard}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              {t("addFirstHazard")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {hazards.map((hazard, index) => (
              <div
                key={hazard.id}
                className="rounded-lg border-2 bg-white p-4 space-y-4"
                style={{ borderColor: getLMRARiskColor(hazard.riskLevel) }}
              >
                {/* Hazard Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-full p-2"
                      style={{ backgroundColor: `${getLMRARiskColor(hazard.riskLevel)}20` }}
                    >
                      <AlertTriangle
                        className="h-5 w-5"
                        style={{ color: getLMRARiskColor(hazard.riskLevel) }}
                      />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {t("hazardNumber", { number: index + 1 })}
                      </h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: `${getLMRARiskColor(hazard.riskLevel)}20`,
                            color: getLMRARiskColor(hazard.riskLevel),
                          }}
                        >
                          {getRiskLevelLabel(hazard.riskLevel)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {t("fields.riskScore")}: {hazard.riskScore.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveHazard(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Hazard Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("fields.description")} *
                    </label>
                    <textarea
                      value={hazard.description}
                      onChange={(e) => handleUpdateHazard(index, "description", e.target.value)}
                      rows={2}
                      placeholder={t("fields.descriptionPlaceholder")}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("fields.category")}
                    </label>
                    <select
                      value={hazard.category}
                      onChange={(e) =>
                        handleUpdateHazard(index, "category", e.target.value as HazardCategory)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                    >
                      {HAZARD_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Risk Scores */}
                <div className="border-t pt-4">
                  <h6 className="text-sm font-medium text-gray-900 mb-3">
                    {t("riskAssessment.title")}
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("riskAssessment.effect")}
                      </label>
                      <select
                        value={hazard.effectScore}
                        onChange={(e) =>
                          handleUpdateHazard(
                            index,
                            "effectScore",
                            Number(e.target.value) as LMRAEffectScore
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                      >
                        {EFFECT_SCORES.map((score) => (
                          <option key={score.value} value={score.value} title={score.description}>
                            {score.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("riskAssessment.exposure")}
                      </label>
                      <select
                        value={hazard.exposureScore}
                        onChange={(e) =>
                          handleUpdateHazard(
                            index,
                            "exposureScore",
                            Number(e.target.value) as LMRAExposureScore
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                      >
                        {EXPOSURE_SCORES.map((score) => (
                          <option key={score.value} value={score.value} title={score.description}>
                            {score.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("riskAssessment.probability")}
                      </label>
                      <select
                        value={hazard.probabilityScore}
                        onChange={(e) =>
                          handleUpdateHazard(
                            index,
                            "probabilityScore",
                            Number(e.target.value) as LMRAProbabilityScore
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                      >
                        {PROBABILITY_SCORES.map((score) => (
                          <option key={score.value} value={score.value} title={score.description}>
                            {score.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {t("riskAssessment.formula")}
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: getLMRARiskColor(hazard.riskLevel) }}
                      >
                        {hazard.riskScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Control Measures */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h6 className="text-sm font-medium text-gray-900">
                      {t("controlMeasures.title")}
                    </h6>
                    <button
                      onClick={() => handleAddControlMeasure(index)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="h-3 w-3" />
                      {t("controlMeasures.add")}
                    </button>
                  </div>

                  {hazard.controlMeasures && hazard.controlMeasures.length > 0 ? (
                    <div className="space-y-2">
                      {hazard.controlMeasures.map((measure, measureIndex) => (
                        <div key={measure.id} className="flex gap-2 items-start">
                          <input
                            type="text"
                            value={measure.description}
                            onChange={(e) =>
                              handleUpdateControlMeasure(
                                index,
                                measureIndex,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder={t("controlMeasures.placeholder")}
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                          />
                          <button
                            onClick={() => handleRemoveControlMeasure(index, measureIndex)}
                            className="text-red-600 hover:text-red-800 p-1.5"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">{t("controlMeasures.none")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* General Notes */}
      <div>
        <label htmlFor="stepNotes" className="block text-sm font-medium text-gray-700 mb-2">
          {t("generalNotes")}
        </label>
        <textarea
          id="stepNotes"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          rows={3}
          placeholder={t("generalNotesPlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        />
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
        <h4 className="font-medium text-blue-900 mb-2 text-sm flex items-center gap-2">
          <Info className="h-4 w-4" />
          {t("infoBox.title")}
        </h4>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>{t("infoBox.formula")}</strong>
          </p>
          <ul className="space-y-1 ml-4">
            <li>
              • <strong>0-20:</strong> {t("infoBox.trivial")}
            </li>
            <li>
              • <strong>20-70:</strong> {t("infoBox.acceptable")}
            </li>
            <li>
              • <strong>70-200:</strong> {t("infoBox.possible")}
            </li>
            <li>
              • <strong>200-400:</strong> {t("infoBox.substantial")}
            </li>
            <li>
              • <strong>400-1000:</strong> {t("infoBox.high")}
            </li>
            <li>
              • <strong>&gt;1000:</strong> {t("infoBox.veryHigh")}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
