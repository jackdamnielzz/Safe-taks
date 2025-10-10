"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Calculator, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface ROIData {
  currentTRACost: number;
  currentLMRAcost: number;
  trasPerMonth: number;
  lmrasPerMonth: number;
  teamSize: number;
  incidentCost: number;
  incidentsPerYear: number;
  currentAdminHours: number;
}

interface ROIResults {
  monthlySavings: number;
  yearlySavings: number;
  timeSavings: number;
  incidentReduction: number;
  paybackPeriod: number;
  roiPercentage: number;
}

/**
 * ROI Calculator component for SafeWork Pro value demonstration
 */
export function ROICalculator() {
  const { t } = useTranslation();

  const [inputs, setInputs] = useState<ROIData>({
    currentTRACost: 75,
    currentLMRAcost: 25,
    trasPerMonth: 20,
    lmrasPerMonth: 100,
    teamSize: 15,
    incidentCost: 5000,
    incidentsPerYear: 3,
    currentAdminHours: 40,
  });

  const [results, setResults] = useState<ROIResults | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleInputChange = (field: keyof ROIData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const calculateROI = () => {
    // Cost calculations
    const monthlyTRACosts = inputs.currentTRACost * inputs.trasPerMonth;
    const monthlyLMRAcosts = inputs.currentLMRAcost * inputs.lmrasPerMonth;
    const currentMonthlyCosts = monthlyTRACosts + monthlyLMRAcosts;

    // SafeWork Pro costs (Professional plan for medium business)
    const safeWorkProMonthlyCost = 149;

    // Time savings (80% reduction in admin time)
    const timeSavingsPerMonth = inputs.currentAdminHours * 0.8;

    // Incident reduction (60% based on industry data)
    const incidentReduction = Math.round(inputs.incidentsPerYear * 0.6);
    const incidentCostSavings = incidentReduction * inputs.incidentCost;

    // Calculate results
    const monthlySavings = currentMonthlyCosts - safeWorkProMonthlyCost;
    const yearlySavings = monthlySavings * 12 + incidentCostSavings;
    const paybackPeriod = monthlySavings > 0 ? safeWorkProMonthlyCost / monthlySavings : 999;

    setResults({
      monthlySavings,
      yearlySavings,
      timeSavings: timeSavingsPerMonth,
      incidentReduction,
      paybackPeriod,
      roiPercentage:
        safeWorkProMonthlyCost > 0 ? (yearlySavings / (safeWorkProMonthlyCost * 12)) * 100 : 0,
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Calculator className="h-6 w-6 text-blue-600" />
          <CardTitle className="text-2xl">ROI Calculator</CardTitle>
        </div>
        <CardDescription>
          Bereken de potentiële besparingen van SafeWork Pro voor uw organisatie
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Costs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Huidige Kosten</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gemiddelde TRA kosten (€)
              </label>
              <input
                type="number"
                value={inputs.currentTRACost}
                onChange={(e) => handleInputChange("currentTRACost", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="75"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gemiddelde LMRA kosten (€)
              </label>
              <input
                type="number"
                value={inputs.currentLMRAcost}
                onChange={(e) => handleInputChange("currentLMRAcost", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TRA's per maand
              </label>
              <input
                type="number"
                value={inputs.trasPerMonth}
                onChange={(e) => handleInputChange("trasPerMonth", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LMRA's per maand
              </label>
              <input
                type="number"
                value={inputs.lmrasPerMonth}
                onChange={(e) => handleInputChange("lmrasPerMonth", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100"
              />
            </div>
          </div>

          {/* Business Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Bedrijf Metrics</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team grootte</label>
              <input
                type="number"
                value={inputs.teamSize}
                onChange={(e) => handleInputChange("teamSize", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Veiligheidsincidenten per jaar
              </label>
              <input
                type="number"
                value={inputs.incidentsPerYear}
                onChange={(e) => handleInputChange("incidentsPerYear", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gemiddelde kosten per incident (€)
              </label>
              <input
                type="number"
                value={inputs.incidentCost}
                onChange={(e) => handleInputChange("incidentCost", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Administratieve uren per maand
              </label>
              <input
                type="number"
                value={inputs.currentAdminHours}
                onChange={(e) => handleInputChange("currentAdminHours", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="40"
              />
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <div className="text-center">
          <Button onClick={calculateROI} size="lg" className="gap-2">
            <Calculator className="h-4 w-4" />
            Bereken ROI
          </Button>
        </div>

        {/* Results Section */}
        {results && (
          <div className="mt-8 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Maandelijkse Besparing
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    €{Math.round(results.monthlySavings).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Tijdsbesparing (uren/maand)
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {Math.round(results.timeSavings)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Incident Reductie</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {results.incidentReduction}/jaar
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gedetailleerde ROI Analyse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jaarlijkse besparing:</span>
                      <span className="font-semibold text-green-600">
                        €{Math.round(results.yearlySavings).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">ROI percentage:</span>
                      <span className="font-semibold text-blue-600">
                        {Math.round(results.roiPercentage)}%
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Terugverdientijd:</span>
                      <span className="font-semibold text-purple-600">
                        {Math.round(results.paybackPeriod * 10) / 10} maanden
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Besparingsbronnen:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 90% reductie administratieve tijd</li>
                        <li>• 60% minder veiligheidsincidenten</li>
                        <li>• 100% compliance traceability</li>
                        <li>• Real-time risico monitoring</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Let op:</strong> Deze berekening is gebaseerd op gemiddelde resultaten
                    van SafeWork Pro klanten. Individuele resultaten kunnen variëren afhankelijk van
                    uw specifieke situatie en gebruik.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setShowDetails(!showDetails)}
                variant="outline"
                className="gap-2"
              >
                {showDetails ? "Verberg" : "Toon"} Details
              </Button>

              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                <TrendingUp className="h-4 w-4" />
                Plan een Demo
              </Button>
            </div>

            {/* Detailed Breakdown */}
            {showDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gedetailleerde Kostenvergelijking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">
                          Huidige Kosten (per maand)
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>TRA kosten:</span>
                            <span>€{Math.round(inputs.currentTRACost * inputs.trasPerMonth)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>LMRA kosten:</span>
                            <span>
                              €{Math.round(inputs.currentLMRAcost * inputs.lmrasPerMonth)}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-2">
                            <span>Totaal huidige kosten:</span>
                            <span>
                              €
                              {Math.round(
                                inputs.currentTRACost * inputs.trasPerMonth +
                                  inputs.currentLMRAcost * inputs.lmrasPerMonth
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-green-600 mb-2">
                          SafeWork Pro Kosten (per maand)
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Professional abonnement:</span>
                            <span>€149</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-2">
                            <span>Maandelijkse besparing:</span>
                            <span className="text-green-600">
                              €{Math.round(results.monthlySavings)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">
                        Aanvullende Besparingen (jaarlijks)
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>
                            Incident reductie ({results.incidentReduction} × €
                            {inputs.incidentCost.toLocaleString()}):
                          </span>
                          <span className="text-green-600 font-semibold">
                            €{(results.incidentReduction * inputs.incidentCost).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg border-t pt-2">
                          <span>Totale jaarlijkse besparing:</span>
                          <span className="text-green-600">
                            €{Math.round(results.yearlySavings).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
