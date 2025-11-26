"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, CheckCircle, Info, Save } from "lucide-react";
import {
  calculateRisk,
  validateRiskParameters,
  getRiskColor,
  formatRiskScore,
  getEffectLabel,
  getExposureLabel,
  getProbabilityLabel,
  getRiskLevelConfig,
} from "@/lib/risk-calculator";
import type { RiskParameters, RiskResult } from "@/types/risk";

interface RiskCalculatorProps {
  /** Initial risk parameters */
  initialParams?: Partial<RiskParameters>;
  /** Initial notes */
  initialNotes?: string;
  /** Callback when risk is saved */
  onRiskSaved?: (result: RiskResult, params: RiskParameters, notes: string) => void;
  /** Whether to show recommended controls */
  showRecommendations?: boolean;
  /** Whether the calculator is in read-only mode */
  readOnly?: boolean;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
}

export function RiskCalculator({
  initialParams,
  initialNotes = "",
  onRiskSaved,
  showRecommendations = true,
  readOnly = false,
  title = "Risico Beoordeling",
  description = "Bereken het risico volgens de Kinney & Wiruth methode",
}: RiskCalculatorProps) {
  const [params, setParams] = useState<RiskParameters>({
    effect: initialParams?.effect || 0,
    exposure: initialParams?.exposure || 0,
    probability: initialParams?.probability || 0,
  });

  const [notes, setNotes] = useState<string>(initialNotes);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showScaleHelp, setShowScaleHelp] = useState(false);
  const [showReferenceTable, setShowReferenceTable] = useState(false);

  // Calculate risk whenever parameters change (for preview only, not saved)
  useEffect(() => {
    // Only calculate if at least one value is non-zero
    if (params.effect > 0 || params.exposure > 0 || params.probability > 0) {
      const validation = validateRiskParameters(params);

      if (validation.valid) {
        const result = calculateRisk(params);
        setRiskResult(result);
        setValidationErrors([]);
        setHasUnsavedChanges(true);
      } else {
        setValidationErrors(validation.errors);
        setRiskResult(null);
      }
    } else {
      // All zeros - show as empty state
      setRiskResult(null);
      setValidationErrors([]);
    }
  }, [params]);

  const handleParamChange = (param: keyof RiskParameters, value: string) => {
    const numValue = parseFloat(value) || 0;
    setParams((prev) => ({
      ...prev,
      [param]: numValue,
    }));
  };

  const handleSaveClick = () => {
    // Validate that not all values are zero
    if (params.effect === 0 && params.exposure === 0 && params.probability === 0) {
      setValidationErrors(["U kunt geen risicobeoordeling opslaan met alle waarden op 0. Voer een geldige beoordeling in."]);
      return;
    }

    // Validate parameters
    const validation = validateRiskParameters(params);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Show confirmation dialog
    setShowSaveConfirmation(true);
  };

  const handleConfirmSave = () => {
    if (riskResult && onRiskSaved) {
      onRiskSaved(riskResult, params, notes);
      setHasUnsavedChanges(false);
      setShowSaveConfirmation(false);
    }
  };

  const handleCancelSave = () => {
    setShowSaveConfirmation(false);
  };

  const riskColors = riskResult ? getRiskColor(riskResult.level) : null;
  const riskConfig = riskResult ? getRiskLevelConfig(riskResult.level) : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Effect Parameter */}
        <div className="space-y-2">
          <label htmlFor="effect" className="block text-sm font-medium mb-2">
            Effect / Gevolg (E)
            <span className="text-sm text-muted-foreground ml-2">1-100</span>
          </label>
          <input
            id="effect"
            type="number"
            min="0"
            max="100"
            step="1"
            value={params.effect}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleParamChange("effect", e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            disabled={readOnly}
            className="font-mono w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {params.effect > 0 && (
            <p className="text-sm text-muted-foreground">{getEffectLabel(params.effect)}</p>
          )}
          <button
            type="button"
            onClick={() => setShowScaleHelp((prev) => !prev)}
            className="mt-1 text-xs text-blue-700 hover:underline"
          >
            {showScaleHelp ? "Verberg uitleg bij schaal" : "Toon uitleg bij schaal"}
          </button>
          {showScaleHelp && (
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <div>• 1: Licht letsel (EHBO)</div>
              <div>• 15: Matig letsel (medische behandeling)</div>
              <div>• 40: Ernstig letsel (ziekenhuisopname)</div>
              <div>• 100: Zeer ernstig (blijvend/dodelijk)</div>
            </div>
          )}
        </div>

        {/* Exposure Parameter */}
        <div className="space-y-2">
          <label htmlFor="exposure" className="block text-sm font-medium mb-2">
            Blootstelling (B)
            <span className="text-sm text-muted-foreground ml-2">0.5-10</span>
          </label>
          <input
            id="exposure"
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={params.exposure}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleParamChange("exposure", e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            disabled={readOnly}
            className="font-mono w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {params.exposure > 0 && (
            <p className="text-sm text-muted-foreground">{getExposureLabel(params.exposure)}</p>
          )}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>• 0.5: Zelden ({"<"} 1x per jaar)</div>
            <div>• 1: Af en toe (maandelijks)</div>
            <div>• 3: Regelmatig (wekelijks)</div>
            <div>• 6: Frequent (dagelijks)</div>
            <div>• 10: Continu (voortdurend)</div>
          </div>
        </div>

        {/* Probability Parameter */}
        <div className="space-y-2">
          <label htmlFor="probability" className="block text-sm font-medium mb-2">
            Waarschijnlijkheid (W)
            <span className="text-sm text-muted-foreground ml-2">0.1-10</span>
          </label>
          <input
            id="probability"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={params.probability}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleParamChange("probability", e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            disabled={readOnly}
            className="font-mono w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {params.probability > 0 && (
            <p className="text-sm text-muted-foreground">{getProbabilityLabel(params.probability)}</p>
          )}
          {showScaleHelp && (
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <div>• 0.1: Vrijwel onmogelijk</div>
              <div>• 0.5: Zeer onwaarschijnlijk</div>
              <div>• 1: Onwaarschijnlijk</div>
              <div>• 3: Mogelijk</div>
              <div>• 6: Waarschijnlijk</div>
              <div>• 10: Zeer waarschijnlijk</div>
            </div>
          )}
        </div>

        {/* Notes Field */}
        <div className="space-y-2">
          <label htmlFor="notes" className="block text-sm font-medium mb-2">
            Opmerkingen (Optioneel)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setHasUnsavedChanges(true);
            }}
            disabled={readOnly}
            placeholder="Voeg eventuele toelichting of context toe bij deze risicobeoordeling..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
          />
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="border-2 border-red-500 bg-red-50 p-4 rounded-md flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <ul className="list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Risk Result Preview */}
        {riskResult && riskColors && riskConfig && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <div className="block text-sm font-medium mb-2">Risico Score (Voorbeeld)</div>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold font-mono">
                  {formatRiskScore(riskResult.score)}
                </div>
                <div className="flex-1">
                  <Badge className={`${riskColors.bg} ${riskColors.text} text-base px-4 py-2`}>
                    {riskConfig.label}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Formule: E × B × W = {params.effect} × {params.exposure} × {params.probability} ={" "}
                {formatRiskScore(riskResult.score)}
              </p>
            </div>

            {/* Risk Level Description */}
            <div className={`${riskColors.border} border-2 p-4 rounded-md flex gap-3`}>
              {riskResult.requiresAction ? (
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold mb-1">{riskConfig.description}</div>
                <div className="text-sm">{riskConfig.actionRequired}</div>
              </div>
            </div>

            {/* Recommended Controls */}
            {showRecommendations && riskResult.recommendedControls.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Info className="h-4 w-4" />
                  Aanbevolen Beheersmaatregelen
                </div>
                <ul className="space-y-2">
                  {riskResult.recommendedControls.map((control, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                      <span>{control}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Management Approval Warning */}
            {(riskResult.level === "high" || riskResult.level === "very_high") && (
              <div className="border-2 border-red-500 bg-red-50 p-4 rounded-md flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-900">Management Goedkeuring Vereist</div>
                  <div className="text-sm text-red-800 mt-1">
                    Dit risico niveau vereist goedkeuring van het management voordat het werk kan
                    worden uitgevoerd.
                  </div>
                </div>
              </div>
            )}

            {/* Work Not Allowed Warning */}
            {riskResult.level === "very_high" && (
              <div className="border-2 border-red-900 bg-red-50 p-4 rounded-md flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-900 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-900">Werk Niet Toegestaan</div>
                  <div className="text-sm text-red-800 mt-1">
                    Het risico is te hoog. Werk mag niet worden uitgevoerd zonder fundamentele
                    wijzigingen in de werkwijze of omstandigheden.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        {!readOnly && (
          <div className="pt-4 border-t flex flex-col items-center gap-2">
            <Button
              type="button"
              onClick={handleSaveClick}
              disabled={!hasUnsavedChanges || validationErrors.length > 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Risicobeoordeling Opslaan
            </Button>
            {hasUnsavedChanges && validationErrors.length === 0 && (
              <p className="text-sm text-amber-600">
                U heeft niet-opgeslagen wijzigingen
              </p>
            )}
          </div>
        )}

        {/* Save Confirmation Dialog */}
        {showSaveConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Risicobeoordeling Opslaan</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    U staat op het punt een nieuwe risicoscore op te slaan. Deze score wordt permanent vastgelegd in de TRA.
                  </p>
                  {riskResult && (
                    <div className="bg-gray-50 p-3 rounded-md mb-4">
                      <p className="text-sm font-medium mb-1">Nieuwe risicoscore:</p>
                      <p className="text-2xl font-bold font-mono">{formatRiskScore(riskResult.score)}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Niveau: <span className="font-medium">{riskConfig?.label}</span>
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-gray-600">
                    Weet u zeker dat u deze risicobeoordeling wilt opslaan?
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelSave}
                >
                  Annuleren
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmSave}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Ja, Opslaan
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Risk Level Reference (toggle to reduce noise) */}
        <div className="pt-4 border-t">
          <button
            type="button"
            onClick={() => setShowReferenceTable((prev) => !prev)}
            className="mb-2 text-xs text-blue-700 hover:underline"
          >
            {showReferenceTable ? "Verberg risicotabel" : "Toon risicotabel"}
          </button>
          {showReferenceTable && (
            <>
              <div className="mb-3 block text-sm font-medium">Risico Niveau Referentie</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-24 px-2 py-1 bg-green-100 text-green-800 rounded text-center font-medium">
                    {"<"} 20
                  </div>
                  <span>Triviaal - Geen actie vereist</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 px-2 py-1 bg-blue-100 text-blue-800 rounded text-center font-medium">
                    20-70
                  </div>
                  <span>Acceptabel - Monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-center font-medium">
                    70-200
                  </div>
                  <span>Mogelijk - Aandacht vereist</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 px-2 py-1 bg-orange-100 text-orange-800 rounded text-center font-medium">
                    200-400
                  </div>
                  <span>Aanzienlijk - Actie vereist</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 px-2 py-1 bg-red-100 text-red-800 rounded text-center font-medium">
                    400-1000
                  </div>
                  <span>Hoog - Onmiddellijke actie</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 px-2 py-1 bg-red-900 text-white rounded text-center font-medium">
                    {">"} 1000
                  </div>
                  <span>Zeer Hoog - Werk niet toegestaan</span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RiskCalculator;
