"use client";

import React, { useCallback, useState } from "react";
import { LMRAStep8_Signature, LMRAStep8_Signatures, LMRA, SignatureType } from "@/lib/types/lmra";
import SignaturePad from "../SignaturePad";

type Props = {
  lmra?: Partial<LMRA>;
  onChange: (stepPayload: Partial<LMRAStep8_Signatures>) => void;
};

interface SignatureDialogState {
  isOpen: boolean;
  type: SignatureType;
  signerName: string;
  role: string;
}

export default function Step8_Signatures({ lmra, onChange }: Props) {
  const current = lmra?.step8;
  const [signatures, setSignatures] = useState<LMRAStep8_Signature[]>(current?.signatures ?? []);
  const [dialogState, setDialogState] = useState<SignatureDialogState>({
    isOpen: false,
    type: "image",
    signerName: "",
    role: "field_worker",
  });

  const openSignatureDialog = useCallback((type: SignatureType, role: string = "field_worker") => {
    setDialogState({
      isOpen: true,
      type,
      signerName: "",
      role,
    });
  }, []);

  const closeSignatureDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleSignatureSave = useCallback(
    (signatureData: string) => {
      const sig: LMRAStep8_Signature = {
        signerId: `sig-${Date.now()}`,
        signerName: dialogState.signerName || "Handtekenaar",
        signatureType: dialogState.type,
        signatureData,
        signedAt: new Date(),
        role: dialogState.role,
      };
      
      const next = [...signatures, sig];
      setSignatures(next);
      onChange({ 
        signatures: next, 
        completedAt: new Date() 
      });
      
      closeSignatureDialog();
    },
    [signatures, dialogState, onChange, closeSignatureDialog]
  );

  const removeSignature = useCallback(
    (signerId: string) => {
      const next = signatures.filter((s) => s.signerId !== signerId);
      setSignatures(next);
      onChange({ signatures: next });
    },
    [signatures, onChange]
  );

  const getRoleLabel = (role: string): string => {
    const roleMap: Record<string, string> = {
      field_worker: "Veldwerker",
      supervisor: "Toezichthouder",
      safety_officer: "Veiligheidscoördinator",
      project_manager: "Projectmanager",
    };
    return roleMap[role] || role;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Digitale Handtekeningen</h3>
        <p className="text-sm text-gray-600">
          Verzamel digitale handtekeningen van alle betrokkenen om de LMRA te voltooien.
        </p>
      </div>

      {/* Existing Signatures */}
      {signatures.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Verzamelde Handtekeningen ({signatures.length})
          </h4>
          
          {signatures.map((sig) => (
            <div
              key={sig.signerId}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">{sig.signerName}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {getRoleLabel(sig.role || "field_worker")}
                    </span>
                  </div>
                  
                  {sig.signatureType === "image" && sig.signatureData && (
                    <div className="mt-2 border border-gray-200 rounded p-2 bg-gray-50 inline-block">
                      <img
                        src={sig.signatureData}
                        alt={`Handtekening van ${sig.signerName}`}
                        className="h-16 w-auto"
                      />
                    </div>
                  )}
                  
                  {sig.signatureType === "typed" && (
                    <div className="mt-2 text-sm text-gray-600 italic">
                      "{sig.signatureData}"
                    </div>
                  )}
                  
                  {sig.signatureType === "consent_checkbox" && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Akkoord gegeven</span>
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Ondertekend op: {sig.signedAt instanceof Date 
                      ? sig.signedAt.toLocaleString("nl-NL")
                      : new Date(sig.signedAt.toMillis()).toLocaleString("nl-NL")}
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeSignature(sig.signerId)}
                  className="flex-shrink-0 text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Verwijder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Signature Buttons */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Handtekening Toevoegen</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Field Worker Signature */}
          <button
            type="button"
            onClick={() => openSignatureDialog("image", "field_worker")}
            className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">Veldwerker</div>
              <div className="text-sm text-gray-600">Teken handtekening</div>
            </div>
          </button>

          {/* Supervisor Signature */}
          <button
            type="button"
            onClick={() => openSignatureDialog("image", "supervisor")}
            className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">Toezichthouder</div>
              <div className="text-sm text-gray-600">Teken handtekening</div>
            </div>
          </button>

          {/* Safety Officer Signature */}
          <button
            type="button"
            onClick={() => openSignatureDialog("image", "safety_officer")}
            className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">Veiligheidscoördinator</div>
              <div className="text-sm text-gray-600">Teken handtekening</div>
            </div>
          </button>

          {/* Project Manager Signature */}
          <button
            type="button"
            onClick={() => openSignatureDialog("image", "project_manager")}
            className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">Projectmanager</div>
              <div className="text-sm text-gray-600">Teken handtekening</div>
            </div>
          </button>
        </div>
      </div>

      {/* Validation Message */}
      {signatures.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Handtekening vereist</p>
              <p className="mt-1">
                Minimaal één handtekening is vereist om de LMRA te voltooien.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad Dialog */}
      {dialogState.isOpen && (
        <SignaturePad
          onSave={handleSignatureSave}
          onCancel={closeSignatureDialog}
          signerName={dialogState.signerName}
          role={getRoleLabel(dialogState.role)}
        />
      )}
    </div>
  );
}
