import React, { useCallback, useState } from "react";
import { LMRAStep5_EquipmentVerification, EquipmentCheck, LMRA, EquipmentStatus } from "@/lib/types/lmra";
import PhotoGallery from "@/components/lmra/PhotoGallery";
import PhotoCapture from "@/components/lmra/PhotoCapture";

type Props = {
  lmra?: Partial<LMRA>;
  onChange: (stepPayload: Partial<LMRAStep5_EquipmentVerification>) => void;
  userId?: string;
  userName?: string;
};

export default function Step5_EquipmentVerification({ lmra, onChange, userId, userName }: Props) {
  const current = lmra?.step5;
  const [showCamera, setShowCamera] = useState(false);

  const handleToggleStatus = useCallback(
    (index: number, status: EquipmentStatus) => {
      const list = [...(current?.equipmentList ?? [])];
      if (!list[index]) return;
      list[index] = { ...list[index], status };
      const allAvailable = list.every((e) => e.status === "available");
      onChange({ equipmentList: list, allEquipmentAvailable: allAvailable });
    },
    [current, onChange]
  );

  const handleAdd = useCallback(() => {
    const list = [...(current?.equipmentList ?? [])];
    list.push({
      equipmentId: `tmp-${Date.now()}`,
      name: "Nieuw materiaal",
      status: "available",
    } as EquipmentCheck);
    const allAvailable = list.every((e) => e.status === "available");
    onChange({ equipmentList: list, allEquipmentAvailable: allAvailable });
  }, [current, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      const list = [...(current?.equipmentList ?? [])];
      list.splice(index, 1);
      const allAvailable = list.every((e) => e.status === "available");
      onChange({ equipmentList: list, allEquipmentAvailable: allAvailable });
    },
    [current, onChange]
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Controleer of alle benodigde apparatuur aanwezig en in goede staat is.</p>

      <div className="space-y-2">
        {(current?.equipmentList ?? []).map((eq, idx) => (
          <div key={eq.equipmentId ?? idx} className="p-3 border rounded flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">{eq.name ?? eq.equipmentId}</div>
              {eq.serialNumber && <div className="text-xs text-muted">SN: {eq.serialNumber}</div>}
              {eq.notes && <div className="text-xs text-muted">Opmerking: {eq.notes}</div>}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={eq.status}
                onChange={(e) => handleToggleStatus(idx, e.target.value as EquipmentStatus)}
                className="input"
              >
                <option value="available">Beschikbaar</option>
                <option value="unavailable">Niet beschikbaar</option>
                <option value="damaged">Beschadigd</option>
                <option value="maintenance">Onderhoud</option>
              </select>

              <button className="btn btn-outline" onClick={() => handleRemove(idx)}>
                Verwijder
              </button>
            </div>
          </div>
        ))}

        {(!current?.equipmentList || current.equipmentList.length === 0) && (
          <div className="text-sm text-muted">Nog geen apparatuur geregistreerd.</div>
        )}
      </div>

      <div className="flex gap-2">
        <button className="btn btn-secondary" onClick={handleAdd}>
          Voeg apparatuur toe
        </button>

        <div className="text-sm text-gray-600">All equipment OK: {current?.allEquipmentAvailable ? "Ja" : "Nee"}</div>
      </div>

      {/* Photo Documentation */}
      {lmra?.id && userId && (
        <div className="mt-6 pt-6 border-t">
          <PhotoGallery
            lmraId={lmra.id}
            stepNumber={5}
            onAddPhoto={() => setShowCamera(true)}
            maxPhotos={10}
          />
        </div>
      )}

      {/* Photo Capture Modal */}
      {showCamera && lmra?.id && userId && (
        <PhotoCapture
          lmraId={lmra.id}
          stepNumber={5}
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
