import React, { useCallback, useState } from "react";
import { LMRAStep7_GoNoGo, LMRA, GoNoGoDecision } from "@/lib/types/lmra";
import PhotoGallery from "@/components/lmra/PhotoGallery";
import PhotoCapture from "@/components/lmra/PhotoCapture";

type Props = {
  lmra?: Partial<LMRA>;
  onChange: (stepPayload: Partial<LMRAStep7_GoNoGo>) => void;
  userId?: string;
  userName?: string;
};

export default function Step7_GoNoGo({ lmra, onChange, userId, userName }: Props) {
  const current = lmra?.step7;
  const [decision, setDecision] = useState<GoNoGoDecision>(current?.decision ?? "pending");
  const [reason, setReason] = useState(current?.reason ?? "");
  const [mitigationRequired, setMitigationRequired] = useState(!!current?.mitigationRequired);
  const [mitigationNotes, setMitigationNotes] = useState(current?.mitigationNotes ?? "");
  const [showCamera, setShowCamera] = useState(false);

  const commit = useCallback(
    (newDecision: GoNoGoDecision) => {
      const payload: Partial<LMRAStep7_GoNoGo> = {
        decision: newDecision,
        decidedAt: new Date(),
        decidedBy: undefined, // caller should set decidedBy (user context)
        reason,
        mitigationRequired,
        mitigationNotes,
      };
      setDecision(newDecision);
      onChange(payload);
    },
    [reason, mitigationRequired, mitigationNotes, onChange]
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Neem een Go / No-Go besluit op basis van de uitgevoerde controles. Voeg een korte reden toe en eventuele
        mitigerende acties.
      </p>

      <div className="flex gap-3">
        <button
          className={`btn ${decision === "go" ? "btn-primary" : "btn-outline"}`}
          onClick={() => commit("go")}
          aria-pressed={decision === "go"}
        >
          GO
        </button>
        <button
          className={`btn ${decision === "no_go" ? "btn-danger" : "btn-outline"}`}
          onClick={() => commit("no_go")}
          aria-pressed={decision === "no_go"}
        >
          NO-GO
        </button>
        <button
          className={`btn ${decision === "pending" ? "btn-primary" : "btn-outline"}`}
          onClick={() => {
            setDecision("pending");
            onChange({ decision: "pending" });
          }}
        >
          Pending
        </button>
      </div>

      <label className="block">
        <div className="text-xs text-muted">Reden / toelichting</div>
        <textarea
          className="textarea w-full"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => onChange({ reason })}
        />
      </label>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={mitigationRequired}
            onChange={(e) => {
              setMitigationRequired(e.target.checked);
              onChange({ mitigationRequired: e.target.checked });
            }}
          />
          <span className="text-sm">Mitigerende acties vereist</span>
        </label>
      </div>

      {mitigationRequired && (
        <label className="block">
          <div className="text-xs text-muted">Mitigatie aantekeningen</div>
          <textarea
            className="textarea w-full"
            rows={3}
            value={mitigationNotes}
            onChange={(e) => setMitigationNotes(e.target.value)}
            onBlur={() => onChange({ mitigationNotes })}
          />
        </label>
      )}

      <div className="text-sm text-gray-600">
        Besluit: <strong>{decision}</strong>
      </div>

      {/* Photo Documentation */}
      {lmra?.id && userId && (
        <div className="mt-6 pt-6 border-t">
          <PhotoGallery
            lmraId={lmra.id}
            stepNumber={7}
            onAddPhoto={() => setShowCamera(true)}
            maxPhotos={5}
          />
        </div>
      )}

      {/* Photo Capture Modal */}
      {showCamera && lmra?.id && userId && (
        <PhotoCapture
          lmraId={lmra.id}
          stepNumber={7}
          userId={userId}
          userName={userName}
          onPhotoAdded={() => {
            // Photo added successfully, gallery will auto-refresh
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
          maxPhotos={5}
        />
      )}
    </div>
  );
}
