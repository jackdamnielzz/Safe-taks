"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AlertTriangle, Info } from "lucide-react";
import type { WorkplaceConditions, Hazard } from "@/lib/types/tra";
import { suggestHazardsFromConditions } from "@/lib/utils/material-hazard-mapping";

interface WorkplaceConditionsFormProps {
  conditions?: WorkplaceConditions;
  onChange: (conditions: WorkplaceConditions) => void;
  readOnly?: boolean;
  onSuggestHazards?: (hazards: Hazard[]) => void;
}

export function WorkplaceConditionsForm({
  conditions,
  onChange,
  readOnly = false,
  onSuggestHazards,
}: WorkplaceConditionsFormProps) {
  const t = useTranslations("tra.contextFields");
  const [suggestions, setSuggestions] = useState<Hazard[]>([]);

  const defaultConditions: WorkplaceConditions = useMemo(() => ({
    lighting: "adequate",
    ventilation: "good",
    temperature: "comfortable",
    noise: "quiet",
    spaceConstraint: "open",
    groundCondition: "stable",
    weatherExposure: "indoor",
    notes: "",
  }), []);

  const currentConditions = conditions || defaultConditions;

  const handleFieldChange = (field: keyof WorkplaceConditions, value: string) => {
    onChange({
      ...currentConditions,
      [field]: value,
    });
  };

  // Check for extreme conditions
  const hasExtremeConditions =
    currentConditions.lighting === "dark" ||
    currentConditions.temperature === "extreme" ||
    currentConditions.noise === "extreme" ||
    currentConditions.groundCondition === "unstable" ||
    currentConditions.weatherExposure === "extreme";

  const extremeConditions: string[] = [];
  if (currentConditions.lighting === "dark") extremeConditions.push("Donkere verlichting");
  if (currentConditions.temperature === "extreme") extremeConditions.push("Extreme temperatuur");
  if (currentConditions.noise === "extreme") extremeConditions.push("Extreem geluid");
  if (currentConditions.groundCondition === "unstable") extremeConditions.push("Onstabiele ondergrond");
  if (currentConditions.weatherExposure === "extreme") extremeConditions.push("Extreme weersomstandigheden");

  // Update hazard suggestions when conditions change
  useEffect(() => {
    if (conditions) {
      const newSuggestions = suggestHazardsFromConditions(conditions);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [conditions]);

  // Count suggestions by condition type
  const suggestionsByCondition = useMemo(() => {
    const counts: Record<string, number> = {};
    suggestions.forEach((hazard) => {
      const desc = hazard.description.toLowerCase();
      if (desc.includes('verlichting') || desc.includes('licht')) counts['lighting'] = (counts['lighting'] || 0) + 1;
      if (desc.includes('ventilatie') || desc.includes('lucht')) counts['ventilation'] = (counts['ventilation'] || 0) + 1;
      if (desc.includes('temperatuur') || desc.includes('hitte') || desc.includes('kou')) counts['temperature'] = (counts['temperature'] || 0) + 1;
      if (desc.includes('geluid') || desc.includes('gehoor')) counts['noise'] = (counts['noise'] || 0) + 1;
      if (desc.includes('ruimte') || desc.includes('besloten')) counts['space'] = (counts['space'] || 0) + 1;
      if (desc.includes('ondergrond') || desc.includes('val') || desc.includes('struikel')) counts['ground'] = (counts['ground'] || 0) + 1;
      if (desc.includes('weer') || desc.includes('wind') || desc.includes('regen')) counts['weather'] = (counts['weather'] || 0) + 1;
    });
    return counts;
  }, [suggestions]);

  const handleViewSuggestions = () => {
    if (onSuggestHazards && suggestions.length > 0) {
      onSuggestHazards(suggestions);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("workplaceConditions")}</h3>
      </div>

      {/* Extreme Conditions Warning */}
      {hasExtremeConditions && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-900 mb-1">
                  Waarschuwing: Extreme werkomstandigheden
                </p>
                <p className="text-sm text-orange-800">
                  De volgende extreme omstandigheden zijn gedetecteerd: {extremeConditions.join(", ")}.
                  Zorg voor adequate beheersmaatregelen en overweeg de risicobeoordeling.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Hazard Suggestions Info */}
      {suggestions.length > 0 && !readOnly && onSuggestHazards && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  {suggestions.length} {suggestions.length === 1 ? 'gevaarsuggestie' : 'gevaarsuggesties'} beschikbaar
                </p>
                <p className="text-sm text-blue-800 mb-2">
                  {t("basedOnConditions")}
                </p>
                <button
                  type="button"
                  onClick={handleViewSuggestions}
                  className="text-sm font-medium text-blue-700 hover:text-blue-900 underline"
                >
                  Bekijk gerelateerde gevaren →
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Conditions Form */}
      <Card className="border">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lighting */}
            <div>
              <label htmlFor="condition-lighting" className="block text-sm font-medium mb-2">
                {t("lighting")}
                {currentConditions.lighting === "dark" && (
                  <Badge className="ml-2 bg-orange-500 text-white text-xs">Extreem</Badge>
                )}
                {suggestionsByCondition['lighting'] > 0 && (
                  <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                    {suggestionsByCondition['lighting']} {suggestionsByCondition['lighting'] === 1 ? 'gevaar' : 'gevaren'}
                  </Badge>
                )}
              </label>
              <select
                id="condition-lighting"
                value={currentConditions.lighting}
                onChange={(e) =>
                  handleFieldChange("lighting", e.target.value as WorkplaceConditions["lighting"])
                }
                disabled={readOnly}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="adequate">{t("lightingOptions.adequate")}</option>
                <option value="poor">{t("lightingOptions.poor")}</option>
                <option value="dark">{t("lightingOptions.dark")}</option>
                <option value="bright">{t("lightingOptions.bright")}</option>
              </select>
            </div>

            {/* Ventilation */}
            <div>
              <label htmlFor="condition-ventilation" className="block text-sm font-medium mb-2">{t("ventilation")}</label>
              <select
                id="condition-ventilation"
                value={currentConditions.ventilation}
                onChange={(e) =>
                  handleFieldChange("ventilation", e.target.value as WorkplaceConditions["ventilation"])
                }
                disabled={readOnly}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="good">{t("ventilationOptions.good")}</option>
                <option value="moderate">{t("ventilationOptions.moderate")}</option>
                <option value="poor">{t("ventilationOptions.poor")}</option>
                <option value="none">{t("ventilationOptions.none")}</option>
              </select>
            </div>

            {/* Temperature */}
            <div>
              <label htmlFor="condition-temperature" className="block text-sm font-medium mb-2">
                {t("temperature")}
                {currentConditions.temperature === "extreme" && (
                  <Badge className="ml-2 bg-orange-500 text-white text-xs">Extreem</Badge>
                )}
                {suggestionsByCondition['temperature'] > 0 && (
                  <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                    {suggestionsByCondition['temperature']} {suggestionsByCondition['temperature'] === 1 ? 'gevaar' : 'gevaren'}
                  </Badge>
                )}
              </label>
              <select
                id="condition-temperature"
                value={currentConditions.temperature}
                onChange={(e) =>
                  handleFieldChange("temperature", e.target.value as WorkplaceConditions["temperature"])
                }
                disabled={readOnly}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="comfortable">{t("temperatureOptions.comfortable")}</option>
                <option value="hot">{t("temperatureOptions.hot")}</option>
                <option value="cold">{t("temperatureOptions.cold")}</option>
                <option value="extreme">{t("temperatureOptions.extreme")}</option>
              </select>
            </div>

            {/* Noise */}
            <div>
              <label htmlFor="condition-noise" className="block text-sm font-medium mb-2">
                {t("noise")}
                {currentConditions.noise === "extreme" && (
                  <Badge className="ml-2 bg-orange-500 text-white text-xs">Extreem</Badge>
                )}
                {suggestionsByCondition['noise'] > 0 && (
                  <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                    {suggestionsByCondition['noise']} {suggestionsByCondition['noise'] === 1 ? 'gevaar' : 'gevaren'}
                  </Badge>
                )}
              </label>
              <select
                id="condition-noise"
                value={currentConditions.noise}
                onChange={(e) =>
                  handleFieldChange("noise", e.target.value as WorkplaceConditions["noise"])
                }
                disabled={readOnly}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="quiet">{t("noiseOptions.quiet")}</option>
                <option value="moderate">{t("noiseOptions.moderate")}</option>
                <option value="loud">{t("noiseOptions.loud")}</option>
                <option value="extreme">{t("noiseOptions.extreme")}</option>
              </select>
            </div>

            {/* Space Constraint */}
            <div>
              <label htmlFor="condition-space" className="block text-sm font-medium mb-2">{t("spaceConstraint")}</label>
              <select
                id="condition-space"
                value={currentConditions.spaceConstraint}
                onChange={(e) =>
                  handleFieldChange("spaceConstraint", e.target.value as WorkplaceConditions["spaceConstraint"])
                }
                disabled={readOnly}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="open">{t("spaceOptions.open")}</option>
                <option value="confined">{t("spaceOptions.confined")}</option>
                <option value="cramped">{t("spaceOptions.cramped")}</option>
                <option value="restricted">{t("spaceOptions.restricted")}</option>
              </select>
            </div>

            {/* Ground Condition */}
            <div>
              <label htmlFor="condition-ground" className="block text-sm font-medium mb-2">
                {t("groundCondition")}
                {currentConditions.groundCondition === "unstable" && (
                  <Badge className="ml-2 bg-orange-500 text-white text-xs">Extreem</Badge>
                )}
                {suggestionsByCondition['ground'] > 0 && (
                  <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                    {suggestionsByCondition['ground']} {suggestionsByCondition['ground'] === 1 ? 'gevaar' : 'gevaren'}
                  </Badge>
                )}
              </label>
              <select
                id="condition-ground"
                value={currentConditions.groundCondition}
                onChange={(e) =>
                  handleFieldChange("groundCondition", e.target.value as WorkplaceConditions["groundCondition"])
                }
                disabled={readOnly}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="stable">{t("groundOptions.stable")}</option>
                <option value="uneven">{t("groundOptions.uneven")}</option>
                <option value="slippery">{t("groundOptions.slippery")}</option>
                <option value="unstable">{t("groundOptions.unstable")}</option>
              </select>
            </div>

            {/* Weather Exposure */}
            <div>
              <label htmlFor="condition-weather" className="block text-sm font-medium mb-2">
                {t("weatherExposure")}
                {currentConditions.weatherExposure === "extreme" && (
                  <Badge className="ml-2 bg-orange-500 text-white text-xs">Extreem</Badge>
                )}
                {suggestionsByCondition['weather'] > 0 && (
                  <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                    {suggestionsByCondition['weather']} {suggestionsByCondition['weather'] === 1 ? 'gevaar' : 'gevaren'}
                  </Badge>
                )}
              </label>
              <select
                id="condition-weather"
                value={currentConditions.weatherExposure}
                onChange={(e) =>
                  handleFieldChange("weatherExposure", e.target.value as WorkplaceConditions["weatherExposure"])
                }
                disabled={readOnly}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="indoor">{t("weatherOptions.indoor")}</option>
                <option value="sheltered">{t("weatherOptions.sheltered")}</option>
                <option value="exposed">{t("weatherOptions.exposed")}</option>
                <option value="extreme">{t("weatherOptions.extreme")}</option>
              </select>
            </div>

            {/* Notes - Full Width */}
            <div className="md:col-span-2">
              <label htmlFor="condition-notes" className="block text-sm font-medium mb-2">{t("notes")}</label>
              <textarea
                id="condition-notes"
                value={currentConditions.notes || ""}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows={3}
                placeholder="Eventuele opmerkingen over de werkomstandigheden..."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Conditions Preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Geselecteerde Omstandigheden</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-slate-600">Verlichting:</span>
            <p className="font-medium">{t(`lightingOptions.${currentConditions.lighting}`)}</p>
          </div>
          <div>
            <span className="text-slate-600">Ventilatie:</span>
            <p className="font-medium">{t(`ventilationOptions.${currentConditions.ventilation}`)}</p>
          </div>
          <div>
            <span className="text-slate-600">Temperatuur:</span>
            <p className="font-medium">{t(`temperatureOptions.${currentConditions.temperature}`)}</p>
          </div>
          <div>
            <span className="text-slate-600">Geluid:</span>
            <p className="font-medium">{t(`noiseOptions.${currentConditions.noise}`)}</p>
          </div>
          <div>
            <span className="text-slate-600">Ruimte:</span>
            <p className="font-medium">{t(`spaceOptions.${currentConditions.spaceConstraint}`)}</p>
          </div>
          <div>
            <span className="text-slate-600">Ondergrond:</span>
            <p className="font-medium">{t(`groundOptions.${currentConditions.groundCondition}`)}</p>
          </div>
          <div>
            <span className="text-slate-600">Weer:</span>
            <p className="font-medium">{t(`weatherOptions.${currentConditions.weatherExposure}`)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkplaceConditionsForm;