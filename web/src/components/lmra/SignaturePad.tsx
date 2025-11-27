"use client";

import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onCancel: () => void;
  signerName?: string;
  role?: string;
}

/**
 * SignaturePad Component
 *
 * Canvas-based signature capture with touch and mouse support
 * Exports signature as base64 PNG image
 *
 * Features:
 * - Touch and mouse drawing support
 * - Clear/reset functionality
 * - Responsive canvas sizing
 * - Validation (ensures signature not empty)
 * - Mobile-optimized
 */
export default function SignaturePad({
  onSave,
  onCancel,
  signerName = "",
  role = "",
}: SignaturePadProps) {
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 200 });

  // Update canvas size on window resize
  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById("signature-container");
      if (container) {
        const width = Math.min(container.clientWidth - 32, 600);
        const height = Math.min(width * 0.4, 250);
        setCanvasSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleSave = () => {
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      // Get signature as base64 PNG
      const signatureData = sigPadRef.current.toDataURL("image/png");
      onSave(signatureData);
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        id="signature-container"
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Digitale Handtekening</h3>
          {signerName && (
            <p className="text-sm text-gray-600 mt-1">
              Ondertekenaar: <span className="font-medium">{signerName}</span>
            </p>
          )}
          {role && (
            <p className="text-sm text-gray-600">
              Rol: <span className="font-medium">{role}</span>
            </p>
          )}
        </div>

        {/* Canvas Area */}
        <div className="p-4">
          <div className="border-2 border-gray-300 rounded-lg bg-white relative">
            <SignatureCanvas
              ref={sigPadRef}
              canvasProps={{
                width: canvasSize.width,
                height: canvasSize.height,
                className: "signature-canvas",
                style: { touchAction: "none" },
              }}
              backgroundColor="rgb(255, 255, 255)"
              penColor="rgb(0, 0, 0)"
              minWidth={0.5}
              maxWidth={2.5}
              velocityFilterWeight={0.7}
              onBegin={handleBegin}
            />

            {/* Signature line */}
            <div className="absolute bottom-4 left-8 right-8 border-b-2 border-gray-300 pointer-events-none" />

            {/* Placeholder text */}
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-400 text-sm">Teken uw handtekening hier</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <p>• Teken uw handtekening met uw vinger (mobiel) of muis (desktop)</p>
            <p>• Gebruik de "Wissen" knop om opnieuw te beginnen</p>
            <p>• Klik op "Opslaan" wanneer u tevreden bent met uw handtekening</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Annuleren
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={isEmpty}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Wissen
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isEmpty}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}
