/**
 * LMRA Execution Flow Component
 * Complete mobile-optimized LMRA workflow
 * Tasks 5.5-5.8: LMRA Execution, Environmental, Personnel, Equipment
 */

"use client";

import React, { useState, useEffect } from "react";
import { TRA } from "@/lib/types/tra";
import { useLMRAExecution } from "@/hooks/useLMRAExecution";
import { useLocationVerification } from "@/hooks/useLocationVerification";
import { LocationVerification } from "./LocationVerification";
import CameraCapture from "./CameraCapture";
import { BottomSheet } from "./BottomSheet";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import {
  EnvironmentalCheck,
  PersonnelCheck,
  EquipmentCheck,
  CheckStatus,
  LMRAAssessment,
} from "@/lib/types/lmra";

// ============================================================================
// TYPES
// ============================================================================

interface LMRAExecutionFlowProps {
  tra: TRA;
  onComplete: () => void;
  onCancel: () => void;
}

interface ExecutionStep {
  number: number;
  title: string;
  description: string;
  icon: string;
  required: boolean;
}

// ============================================================================
// EXECUTION STEPS
// ============================================================================

const EXECUTION_STEPS: ExecutionStep[] = [
  {
    number: 0,
    title: "TRA Overzicht",
    description: "Bekijk de TRA en werkzaamheden",
    icon: "📋",
    required: true,
  },
  {
    number: 1,
    title: "Locatie Verificatie",
    description: "Verifieer werklocatie met GPS",
    icon: "📍",
    required: true,
  },
  {
    number: 2,
    title: "Weersomstandigheden",
    description: "Controleer weersomstandigheden",
    icon: "🌤️",
    required: true,
  },
  {
    number: 3,
    title: "Omgevingsfactoren",
    description: "Controleer werkomgeving",
    icon: "🏗️",
    required: true,
  },
  {
    number: 4,
    title: "Team Verificatie",
    description: "Controleer teamleden en competenties",
    icon: "👷",
    required: true,
  },
  {
    number: 5,
    title: "Uitrusting",
    description: "Controleer gereedschap en middelen",
    icon: "🔧",
    required: true,
  },
  {
    number: 6,
    title: "Foto Documentatie",
    description: "Maak foto's van werkplek",
    icon: "📷",
    required: false,
  },
  {
    number: 7,
    title: "Eindoordeel",
    description: "Geef eindoordeel veiligheid",
    icon: "✅",
    required: true,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function LMRAExecutionFlow({ tra, onComplete, onCancel }: LMRAExecutionFlowProps) {
  const {
    session,
    currentStep,
    isLoading,
    error,
    weather,
    isOffline,
    startSession,
    updateSession,
    completeSession,
    fetchWeather,
    addEnvironmentalCheck,
    addPersonnelCheck,
    addEquipmentCheck,
    addPhoto,
    nextStep,
    previousStep,
    goToStep,
  } = useLMRAExecution({
    traId: tra.id,
    projectId: tra.projectId,
    onComplete,
    onError: (error) => console.error("LMRA Error:", error),
  });

  const { getCurrentLocation, location: gpsLocation } = useLocationVerification();

  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showCameraSheet, setShowCameraSheet] = useState(false);

  // Step progress calculation
  const progress = ((currentStep + 1) / EXECUTION_STEPS.length) * 100;

  /**
   * Start LMRA session with location verification
   */
  const handleStartSession = async () => {
    setShowLocationSheet(true);
  };

  /**
   * Handle location verified
   */
  const handleLocationVerified = async (locationData: any) => {
    setShowLocationSheet(false);

    // Start session with verified location
    const teamMembers = tra.teamMembers || [];
    await startSession(
      {
        coordinates: locationData.coordinates,
        accuracy: locationData.accuracy,
        verificationStatus: "verified",
      },
      teamMembers
    );

    // Fetch weather conditions
    if (locationData.coordinates) {
      await fetchWeather(locationData.coordinates.latitude, locationData.coordinates.longitude);
    }
  };

  /**
   * Handle environmental check
   */
  const handleEnvironmentalCheck = async (
    checkType: string,
    status: CheckStatus,
    notes?: string
  ) => {
    const check: EnvironmentalCheck = {
      checkType,
      required: true,
      status,
      notes,
      checkedAt: new Date(),
    };

    await addEnvironmentalCheck(check);
  };

  /**
   * Handle personnel check-in
   */
  const handlePersonnelCheckIn = async (
    userId: string,
    displayName: string,
    competenciesVerified: boolean
  ) => {
    const check: PersonnelCheck = {
      userId,
      displayName,
      competenciesVerified,
      competencyStatus: [], // To be filled with actual competency data
      checkedIn: true,
      checkInTime: new Date(),
    };

    await addPersonnelCheck(check);
  };

  /**
   * Handle equipment verification
   */
  const handleEquipmentVerified = async (
    equipmentName: string,
    available: boolean,
    condition: EquipmentCheck["condition"],
    qrCode?: string
  ) => {
    const check: EquipmentCheck = {
      equipmentName,
      required: true,
      available,
      condition,
      qrCode,
    };

    await addEquipmentCheck(check);
  };

  /**
   * Handle final assessment
   */
  const handleCompleteAssessment = async (assessment: LMRAAssessment, comments?: string) => {
    await completeSession(assessment, comments);
  };

  // If no session yet, show start button
  if (!session) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">LMRA Uitvoeren</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{tra.title}</h2>
          <p className="text-gray-600 mb-4">{tra.description}</p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Project:</span>
              <span className="font-medium">{tra.projectRef?.projectName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Risico niveau:</span>
              <span className="font-medium text-orange-600">{tra.overallRiskLevel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Stappen:</span>
              <span className="font-medium">{tra.taskSteps.length}</span>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {isOffline && (
          <Alert variant="warning" className="mb-4">
            Je bent offline. LMRA wordt lokaal opgeslagen en gesynchroniseerd zodra je weer online
            bent.
          </Alert>
        )}

        <Button onClick={handleStartSession} className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" /> : "Start LMRA"}
        </Button>

        <Button onClick={onCancel} variant="secondary" className="w-full mt-3">
          Annuleren
        </Button>

        <BottomSheet
          isOpen={showLocationSheet}
          onClose={() => setShowLocationSheet(false)}
          title="Locatie Verificatie"
        >
          <LocationVerification onLocationVerified={handleLocationVerified} />
        </BottomSheet>
      </div>
    );
  }

  // Render current step
  const currentStepData = EXECUTION_STEPS[currentStep];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with progress */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-gray-900">LMRA Uitvoering</h1>
            <span className="text-sm text-gray-600">
              Stap {currentStep + 1} van {EXECUTION_STEPS.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {isOffline && (
            <div className="mt-2 text-xs text-orange-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                  clipRule="evenodd"
                />
              </svg>
              Offline modus - data wordt gesynchroniseerd bij verbinding
            </div>
          )}
        </div>
      </div>

      {/* Current step content */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-3">{currentStepData.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentStepData.title}</h2>
              <p className="text-gray-600 text-sm">{currentStepData.description}</p>
            </div>
          </div>

          {/* Step-specific content */}
          {currentStep === 0 && <TRAOverview tra={tra} />}
          {currentStep === 1 && <LocationStep location={session.location} />}
          {currentStep === 2 && (
            <WeatherStep weather={weather} onFetch={() => fetchWeather(0, 0)} />
          )}
          {currentStep === 3 && <EnvironmentalStep onCheck={handleEnvironmentalCheck} tra={tra} />}
          {currentStep === 4 && (
            <PersonnelStep onCheckIn={handlePersonnelCheckIn} teamMembers={tra.teamMembers} />
          )}
          {currentStep === 5 && <EquipmentStep onVerify={handleEquipmentVerified} tra={tra} />}
          {currentStep === 6 && (
            <PhotoStep onPhotoAdded={addPhoto} setShowCamera={setShowCameraSheet} />
          )}
          {currentStep === 7 && <FinalAssessmentStep onComplete={handleCompleteAssessment} />}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button onClick={previousStep} variant="secondary" className="flex-1" size="lg">
              Vorige
            </Button>
          )}

          {currentStep < EXECUTION_STEPS.length - 1 ? (
            <Button onClick={nextStep} className="flex-1" size="lg">
              Volgende
            </Button>
          ) : (
            <Button onClick={() => {}} className="flex-1" size="lg" disabled={!session.completedAt}>
              Afronden
            </Button>
          )}
        </div>
      </div>

      {/* Camera bottom sheet */}
      <BottomSheet
        isOpen={showCameraSheet}
        onClose={() => setShowCameraSheet(false)}
        title="Foto Maken"
      >
        <CameraCapture
          orgId={tra.organizationId}
          userId={session?.performedBy || ""}
          context={{ type: "lmra", referenceId: session?.id }}
          onUploaded={(result) => {
            // Handle uploaded photo
            setShowCameraSheet(false);
          }}
          onError={(error) => console.error("Camera error:", error)}
        />
      </BottomSheet>
    </div>
  );
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

function TRAOverview({ tra }: { tra: TRA }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Werkzaamheden:</h3>
        <ul className="space-y-2">
          {tra.taskSteps.map((step, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full text-xs font-bold mr-2 flex-shrink-0">
                {step.stepNumber}
              </span>
              <span className="text-gray-700">{step.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function LocationStep({ location }: { location: any }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
        <span className="text-green-800 font-medium">Locatie geverifieerd</span>
        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      <div className="text-sm text-gray-600">
        <div className="flex justify-between py-2 border-b">
          <span>Nauwkeurigheid:</span>
          <span className="font-medium">{location.accuracy.toFixed(1)}m</span>
        </div>
        <div className="flex justify-between py-2">
          <span>Status:</span>
          <span className="font-medium capitalize">{location.verificationStatus}</span>
        </div>
      </div>
    </div>
  );
}

function WeatherStep({ weather, onFetch }: { weather: any; onFetch: () => void }) {
  if (!weather) {
    return (
      <div className="text-center py-8">
        <Button onClick={onFetch}>Weersomstandigheden Ophalen</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">
            {Math.round(weather.temperature)}°C
          </div>
          <div className="text-sm text-blue-700">Temperatuur</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">{weather.windSpeed} km/h</div>
          <div className="text-sm text-blue-700">Wind</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">{weather.humidity}%</div>
          <div className="text-sm text-blue-700">Luchtvochtigheid</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">{weather.visibility} km</div>
          <div className="text-sm text-blue-700">Zicht</div>
        </div>
      </div>

      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="font-medium text-gray-900 capitalize">{weather.conditions}</div>
        <div className="text-sm text-gray-600">{weather.description}</div>
      </div>
    </div>
  );
}

function EnvironmentalStep({
  onCheck,
  tra,
}: {
  onCheck: (type: string, status: CheckStatus, notes?: string) => void;
  tra: TRA;
}) {
  const [checks, setChecks] = useState<Array<{ type: string; status: CheckStatus }>>([]);

  // Generate environmental checks from TRA hazards
  const environmentalCheckTypes = [
    "Verlichting",
    "Ventilatie",
    "Geluidsniveau",
    "Werkruimte",
    "Toegangswegen",
    "Vluchtroutes",
  ];

  return (
    <div className="space-y-3">
      {environmentalCheckTypes.map((checkType) => (
        <div key={checkType} className="p-4 bg-gray-50 rounded-lg">
          <div className="font-medium text-gray-900 mb-2">{checkType}</div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onCheck(checkType, "pass")}
              className="flex-1"
            >
              ✓ Goed
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onCheck(checkType, "caution")}
              className="flex-1"
            >
              ⚠️ Let op
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onCheck(checkType, "fail")}
              className="flex-1"
            >
              ✗ Slecht
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PersonnelStep({
  onCheckIn,
  teamMembers,
}: {
  onCheckIn: (userId: string, name: string, verified: boolean) => void;
  teamMembers: string[];
}) {
  return (
    <div className="space-y-3">
      <p className="text-gray-600 text-sm mb-4">
        Controleer aanwezigheid en competenties van alle teamleden
      </p>

      {teamMembers.length === 0 ? (
        <Alert variant="warning">Geen teamleden toegewezen aan deze TRA</Alert>
      ) : (
        teamMembers.map((memberId, index) => (
          <div key={memberId} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Teamlid {index + 1}</span>
              <Button size="sm" onClick={() => onCheckIn(memberId, `Teamlid ${index + 1}`, true)}>
                Check In
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function EquipmentStep({
  onVerify,
  tra,
}: {
  onVerify: (name: string, available: boolean, condition: any, qrCode?: string) => void;
  tra: TRA;
}) {
  // Extract equipment from TRA task steps
  const equipment = tra.taskSteps.flatMap((step) => step.equipment || []);

  return (
    <div className="space-y-3">
      <p className="text-gray-600 text-sm mb-4">
        Scan QR codes of controleer gereedschap handmatig
      </p>

      {equipment.length === 0 ? (
        <Alert variant="info">Geen specifieke uitrusting vereist voor deze TRA</Alert>
      ) : (
        equipment.map((item, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium text-gray-900 mb-2">{item}</div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onVerify(item, true, "good")} className="flex-1">
                ✓ Beschikbaar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onVerify(item, false, "damaged")}
                className="flex-1"
              >
                ✗ Niet OK
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function PhotoStep({
  onPhotoAdded,
  setShowCamera,
}: {
  onPhotoAdded: (photo: any) => void;
  setShowCamera: (show: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-gray-600 text-sm">
        Maak foto's van de werkplek, uitrusting en eventuele gevaren
      </p>

      <Button onClick={() => setShowCamera(true)} className="w-full" size="lg">
        📷 Foto Maken
      </Button>

      <div className="text-center text-sm text-gray-500">
        Foto's zijn optioneel maar aanbevolen voor documentatie
      </div>
    </div>
  );
}

function FinalAssessmentStep({
  onComplete,
}: {
  onComplete: (assessment: LMRAAssessment, comments?: string) => void;
}) {
  const [assessment, setAssessment] = useState<LMRAAssessment>("safe_to_proceed");
  const [comments, setComments] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Eindoordeel Veiligheid
        </label>
        <div className="space-y-2">
          <button
            onClick={() => setAssessment("safe_to_proceed")}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              assessment === "safe_to_proceed"
                ? "border-green-500 bg-green-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <div className="font-semibold text-green-900">Veilig om te Starten</div>
                <div className="text-sm text-green-700">Alle checks geslaagd</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setAssessment("proceed_with_caution")}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              assessment === "proceed_with_caution"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <div className="font-semibold text-orange-900">Doorgaan met Voorzichtigheid</div>
                <div className="text-sm text-orange-700">Enkele aandachtspunten</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setAssessment("stop_work")}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              assessment === "stop_work" ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">🛑</span>
              <div>
                <div className="font-semibold text-red-900">Stop Werkzaamheden</div>
                <div className="text-sm text-red-700">Onveilige situatie</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Opmerkingen (optioneel)
        </label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
          rows={4}
          placeholder="Eventuele aanvullende opmerkingen..."
        />
      </div>

      <Button
        onClick={() => onComplete(assessment, comments || undefined)}
        className="w-full"
        size="lg"
      >
        LMRA Voltooien
      </Button>
    </div>
  );
}
