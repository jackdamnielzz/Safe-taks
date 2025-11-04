import React, { useCallback, useMemo, useState } from "react";
import {
  LMRAStep6_Hazard,
  LMRAStep6_HazardAssessment,
  LMRA,
  calculateLMRARiskScore,
  getLMRARiskLevel,
} from "@/lib/types/lmra";
import PhotoGallery from "@/components/lmra/PhotoGallery";
import PhotoCapture from "@/components/lmra/PhotoCapture";

type Props = {
  lmra?: Partial<LMRA>;
  onChange: (stepPayload: Partial<LMRAStep6_HazardAssessment>) => void;
  userId?: string;
  userName?: string;
};

/**
 * Step6_HazardAssessment
 *
 * - List hazards
 * - Add / remove hazards
 * - Edit Kinney-style scores and compute risk score + level
 */
export default function Step6_HazardAssessment({ lmra, onChange, userId, userName }: Props) {
  const current = lmra?.step6;
  const hazards = current?.hazards ?? [];
  const [showCamera, setShowCamera] = useState(false);

  const updateHazards = useCallback(
    (next: LMRAStep6_Hazard[]) => {
      onChange({ hazards: next });
    },
    [onChange]
  );

  const handleAddHazard = useCallback(() => {
    const next: LMRAStep6_Hazard[] = [
      ...(hazards ?? []),
      {
        id: `tmp-${Date.now()}`,
        description: "Nieuwe hazard",
        category: "other",
        effectScore: 1,
        exposureScore: 1,
        probabilityScore: 1 as any,
        riskScore: calculateLMRARiskScore(1 as any, 1 as any, 1 as any),
        riskLevel: getLMRARiskLevel(calculateLMRARiskScore(1 as any, 1 as any, 1 as any)),
      },
    ];
    updateHazards(next);
  }, [hazards, updateHazards]);

  const handleRemove = useCallback(
    (id: string) => {
      const next = (hazards ?? []).filter((h) => h.id !== id);
      updateHazards(next);
    },
    [hazards, updateHazards]
  );

  const handleChangeScores = useCallback(
    (id: string, fields: Partial<LMRAStep6_Hazard>) => {
      const next = (hazards ?? []).map((h) => {
        if (h.id !== id) return h;
        const updated = { ...h, ...fields } as LMRAStep6_Hazard;
        // recompute risk
        const effect = (updated.effectScore ?? 1) as any;
        const exposure = (updated.exposureScore ?? 1) as any;
        const probability = (updated.probabilityScore ?? 1) as any;
        updated.riskScore = calculateLMRARiskScore(effect, exposure, probability);
        updated.riskLevel = getLMRARiskLevel(updated.riskScore);
        return updated;
      });
      updateHazards(next);
    },
    [hazards, updateHazards]
  );

  const totalHazards = hazards.length;
  const highestRisk = useMemo(() => {
    if (!hazards || hazards.length === 0) return 0;
    return Math.max(...hazards.map((h) => h.riskScore || 0));
  }, [hazards]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Identificeer en evalueer risico's. Gebruik de Kinney-stijl scores om risico's te berekenen.
      </p>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Totaal hazards: {totalHazards}</div>
        <div className="text-sm text-gray-600">Hoogste risico score: {highestRisk}</div>
      </div>

      <div className="space-y-3">
        {(hazards ?? []).map((h) => (
          <div key={h.id} className="p-3 border rounded grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted">Beschrijving</label>
              <input
                className="input w-full"
                value={h.description}
                onChange={(e) => handleChangeScores(h.id, { description: e.target.value })}
              />
              <div className="text-xs text-muted mt-1">Categorie: {h.category}</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-muted">Effect (E)</label>
                <select
                  className="input"
                  value={h.effectScore}
                  onChange={(e) => handleChangeScores(h.id, { effectScore: Number(e.target.value) as any })}
                >
                  <option value={1}>1</option>
                  <option value={3}>3</option>
                  <option value={7}>7</option>
                  <option value={15}>15</option>
                  <option value={40}>40</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted">Exposure (B)</label>
                <select
                  className="input"
                  value={h.exposureScore as any}
                  onChange={(e) =>
                    handleChangeScores(h.id, { exposureScore: Number(e.target.value) as any })
                  }
                >
                  <option value={0.5}>0.5</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={6}>6</option>
                  <option value={10}>10</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted">Probability (W)</label>
                <select
                  className="input"
                  value={h.probabilityScore as any}
                  onChange={(e) =>
                    handleChangeScores(h.id, { probabilityScore: Number(e.target.value) as any })
                  }
                >
                  <option value={0.1}>0.1</option>
                  <option value={0.2}>0.2</option>
                  <option value={0.5}>0.5</option>
                  <option value={1}>1</option>
                  <option value={3}>3</option>
                  <option value={6}>6</option>
                  <option value={10}>10</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-sm">
                Score: <strong>{h.riskScore ?? "—"}</strong>
              </div>
              <div className="text-sm">Level: <strong>{h.riskLevel ?? "—"}</strong></div>

              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={() => handleChangeScores(h.id, { notes: "Gereviewd" })}>
                  Markeer
                </button>
                <button className="btn btn-danger" onClick={() => handleRemove(h.id)}>
                  Verwijder
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="btn btn-secondary" onClick={handleAddHazard}>
          Voeg hazard toe
        </button>
      </div>

      {/* Photo Documentation */}
      {lmra?.id && userId && (
        <div className="mt-6 pt-6 border-t">
          <PhotoGallery
            lmraId={lmra.id}
            stepNumber={6}
            onAddPhoto={() => setShowCamera(true)}
            maxPhotos={10}
          />
        </div>
      )}

      {/* Photo Capture Modal */}
      {showCamera && lmra?.id && userId && (
        <PhotoCapture
          lmraId={lmra.id}
          stepNumber={6}
          userId={userId}
          userName={userName}
          onPhotoAdded={() => {
            // Photo added successfully, gallery will auto-refresh
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
          maxPhotos={10}
        />
      )}
    </div>
  );
}
