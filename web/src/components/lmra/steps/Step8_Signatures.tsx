"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PenTool, CheckCircle, User, Trash2, Edit } from "lucide-react";
import { LMRAStep8_Signatures, LMRAStep8_Signature, SignatureType, LMRA } from "@/lib/types/lmra";
import SignaturePad from "../SignaturePad";

type Props = {
  lmra?: Partial<LMRA>;
  onChange: (stepPayload: Partial<LMRAStep8_Signatures>) => void;
  currentUserId?: string;
  currentUserName?: string;
};

export default function Step8_Signatures({
  lmra,
  onChange,
  currentUserId = "current-user",
  currentUserName = "Huidige Gebruiker",
}: Props) {
  const t = useTranslations("safety.lmra.steps.step8");

  const SIGNATURE_ROLES = [
    { value: "field_worker", label: t("roles.field_worker") },
    { value: "supervisor", label: t("roles.supervisor") },
    { value: "safety_manager", label: t("roles.safety_manager") },
    { value: "other", label: t("roles.other") },
  ];
  const current = lmra?.step8;
  const [signatures, setSignatures] = useState<LMRAStep8_Signature[]>(current?.signatures || []);
  const [notes, setNotes] = useState(current?.notes || "");
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [editingSignature, setEditingSignature] = useState<{
    index: number;
    name: string;
    role: string;
  } | null>(null);

  const updateStep = useCallback(
    (updatedSignatures: LMRAStep8_Signature[], stepNotes: string) => {
      const allSigned = updatedSignatures.length > 0;

      onChange({
        signatures: updatedSignatures,
        completedAt: allSigned ? new Date() : undefined,
        notes: stepNotes || undefined,
      });
    },
    [onChange]
  );

  const handleAddSignature = () => {
    setEditingSignature({
      index: -1,
      name: currentUserName,
      role: "field_worker",
    });
    setShowSignaturePad(true);
  };

  const handleEditSignature = (index: number) => {
    const sig = signatures[index];
    setEditingSignature({
      index,
      name: sig.signerName || "",
      role: sig.role || "field_worker",
    });
    setShowSignaturePad(true);
  };

  const handleSaveSignature = (signatureData: string) => {
    if (!editingSignature) return;

    const newSignature: LMRAStep8_Signature = {
      signerId: currentUserId,
      signerName: editingSignature.name,
      signatureType: "image",
      signatureData,
      signedAt: new Date(),
      role: editingSignature.role,
    };

    let updated: LMRAStep8_Signature[];
    if (editingSignature.index === -1) {
      // Add new signature
      updated = [...signatures, newSignature];
    } else {
      // Replace existing signature
      updated = signatures.map((sig, i) => (i === editingSignature.index ? newSignature : sig));
    }

    setSignatures(updated);
    updateStep(updated, notes);
    setShowSignaturePad(false);
    setEditingSignature(null);
  };

  const handleCancelSignature = () => {
    setShowSignaturePad(false);
    setEditingSignature(null);
  };

  const handleRemoveSignature = (index: number) => {
    const updated = signatures.filter((_, i) => i !== index);
    setSignatures(updated);
    updateStep(updated, notes);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    updateStep(signatures, value);
  };

  const hasSignatures = signatures.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("digitalSignatures")}</h3>
        <p className="text-sm text-gray-600">{t("description")}</p>
      </div>

      {/* Signature Status */}
      {hasSignatures && (
        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-900 mb-1">
                {t("signaturesCollected", {
                  count: signatures.length,
                  plural: signatures.length !== 1 ? "en" : "",
                })}
              </h4>
              <p className="text-sm text-green-700">{t("signaturesCollectedDescription")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Signatures List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">{t("signatures")}</h4>
          <button
            onClick={handleAddSignature}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PenTool className="h-4 w-4" />
            {t("addSignatureButton")}
          </button>
        </div>

        {signatures.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <PenTool className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-4">{t("noSignaturesYet")}</p>
            <button
              onClick={handleAddSignature}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <PenTool className="h-4 w-4" />
              {t("addFirstSignature")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {signatures.map((signature, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start gap-4">
                  {/* Signature Image */}
                  <div className="flex-shrink-0">
                    {signature.signatureType === "image" && signature.signatureData ? (
                      <div className="w-32 h-16 border border-gray-300 rounded bg-white flex items-center justify-center overflow-hidden">
                        <img
                          src={signature.signatureData}
                          alt={`Handtekening van ${signature.signerName}`}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-16 border border-gray-300 rounded bg-gray-50 flex items-center justify-center">
                        <PenTool className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Signature Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <h5 className="font-medium text-gray-900">
                            {signature.signerName || "Onbekend"}
                          </h5>
                        </div>
                        {signature.role && (
                          <p className="text-sm text-gray-600 mt-1">
                            {t("role")}{" "}
                            {SIGNATURE_ROLES.find((r) => r.value === signature.role)?.label ||
                              signature.role}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {t("signedOn")}{" "}
                          {signature.signedAt instanceof Date
                            ? signature.signedAt.toLocaleString("nl-NL")
                            : new Date((signature.signedAt as any).toMillis()).toLocaleString(
                                "nl-NL"
                              )}
                        </p>
                        {signature.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{signature.notes}"</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSignature(index)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title={t("actions.edit")}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveSignature(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title={t("actions.remove")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* General Notes */}
      <div>
        <label htmlFor="stepNotes" className="block text-sm font-medium text-gray-700 mb-2">
          {t("notes.label")}
        </label>
        <textarea
          id="stepNotes"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          rows={3}
          placeholder={t("notes.placeholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        />
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
        <h4 className="font-medium text-blue-900 mb-2 text-sm">{t("infoBox.title")}</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• {t("infoBox.item1")}</li>
          <li>• {t("infoBox.item2")}</li>
          <li>• {t("infoBox.item3")}</li>
          <li>• {t("infoBox.item4")}</li>
        </ul>
      </div>

      {/* Completion Status */}
      {hasSignatures && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-900 mb-1">{t("completion.title")}</h4>
              <p className="text-sm text-green-700">{t("completion.message")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad Modal */}
      {showSignaturePad && editingSignature && (
        <SignaturePad
          onSave={handleSaveSignature}
          onCancel={handleCancelSignature}
          signerName={editingSignature.name}
          role={
            SIGNATURE_ROLES.find((r) => r.value === editingSignature.role)?.label ||
            editingSignature.role
          }
        />
      )}
    </div>
  );
}
