/**
 * QR Code Scanner Component
 * For equipment verification in LMRA execution
 * Task 5.8: Equipment Verification with QR Code Scanning
 */

"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";

// ============================================================================
// TYPES
// ============================================================================

interface QRScannerProps {
  onScanSuccess: (qrCode: string, equipmentData?: EquipmentData) => void;
  onScanError?: (error: Error) => void;
  onClose?: () => void;
}

interface EquipmentData {
  id: string;
  name: string;
  category: string;
  lastInspection?: Date;
  inspectionDue?: Date;
  status: "valid" | "expiring_soon" | "expired";
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function QRScanner({ onScanSuccess, onScanError, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Start camera and scanning
   */
  const startScanning = async () => {
    try {
      setError(null);

      // Request camera permission
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setIsScanning(true);

      // Start periodic scanning
      startPeriodicScan();
    } catch (err) {
      const error = err as Error;
      setError("Camera toegang geweigerd of niet beschikbaar");
      onScanError?.(error);
    }
  };

  /**
   * Stop camera and scanning
   */
  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    setIsScanning(false);
  };

  /**
   * Scan QR code from video frame
   * Note: This is a simplified implementation. In production, use a library like:
   * - @zxing/library (ZXing for JavaScript)
   * - html5-qrcode
   * - jsqr
   */
  const scanFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR code detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    try {
      // In production, use a QR code library here
      // For now, this is a placeholder that would integrate with jsQR or similar
      // const code = jsQR(imageData.data, imageData.width, imageData.height);
      // Placeholder: Manual entry fallback is shown below
    } catch (err) {
      console.error("QR scan error:", err);
    }
  };

  /**
   * Start periodic frame scanning
   */
  const startPeriodicScan = () => {
    if (scanIntervalRef.current) return;

    scanIntervalRef.current = setInterval(() => {
      scanFrame();
    }, 500); // Scan every 500ms
  };

  /**
   * Handle manual QR code entry
   */
  const handleManualEntry = (qrCode: string) => {
    if (!qrCode.trim()) return;

    // Mock equipment data lookup
    // In production, this would query the equipment database
    const equipmentData: EquipmentData = {
      id: qrCode,
      name: `Equipment ${qrCode}`,
      category: "general",
      status: "valid",
    };

    onScanSuccess(qrCode, equipmentData);
    stopScanning();
    onClose?.();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="qr-scanner p-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">QR Code Scanner</h3>
        <p className="text-sm text-gray-600">
          Scan de QR code op de uitrusting of voer handmatig in
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Camera view */}
      {!isScanning ? (
        <div className="space-y-4">
          <Button onClick={startScanning} className="w-full" size="lg">
            📷 Start Camera
          </Button>

          {/* Manual entry fallback */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">of</span>
            </div>
          </div>

          <ManualQREntry onSubmit={handleManualEntry} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Video preview */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-4 border-green-500 rounded-lg w-64 h-64 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500" />
              </div>
            </div>

            {/* Scanning indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm">
                Scanning...
              </div>
            </div>
          </div>

          {/* Hidden canvas for frame processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Controls */}
          <div className="flex gap-3">
            <Button onClick={stopScanning} variant="secondary" className="flex-1">
              Stop
            </Button>
            <Button
              onClick={() => {
                stopScanning();
                onClose?.();
              }}
              variant="secondary"
              className="flex-1"
            >
              Annuleren
            </Button>
          </div>

          {/* Manual entry while scanning */}
          <div className="pt-4 border-t border-gray-200">
            <ManualQREntry onSubmit={handleManualEntry} />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MANUAL QR ENTRY COMPONENT
// ============================================================================

function ManualQREntry({ onSubmit }: { onSubmit: (qrCode: string) => void }) {
  const [qrCode, setQrCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrCode.trim()) {
      onSubmit(qrCode.trim());
      setQrCode("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          QR Code Handmatig Invoeren
        </label>
        <input
          type="text"
          value={qrCode}
          onChange={(e) => setQrCode(e.target.value)}
          placeholder="EQ-12345"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>
      <Button type="submit" disabled={!qrCode.trim()} className="w-full">
        Uitrusting Toevoegen
      </Button>
    </form>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch equipment data by QR code
 * In production, this would query the equipment database
 */
export async function fetchEquipmentByQR(
  qrCode: string,
  orgId: string
): Promise<EquipmentData | null> {
  try {
    const response = await fetch(`/api/equipment/${qrCode}?orgId=${orgId}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.equipment;
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return null;
  }
}

/**
 * Validate equipment inspection status
 */
export function validateEquipmentStatus(equipment: EquipmentData): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (equipment.status === "expired") {
    warnings.push("Inspectie verlopen");
  } else if (equipment.status === "expiring_soon") {
    warnings.push("Inspectie verloopt binnenkort");
  }

  if (equipment.inspectionDue) {
    const daysUntilDue = Math.floor(
      (equipment.inspectionDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDue < 0) {
      warnings.push(`Inspectie ${Math.abs(daysUntilDue)} dagen over tijd`);
    } else if (daysUntilDue <= 7) {
      warnings.push(`Inspectie over ${daysUntilDue} dagen`);
    }
  }

  return {
    valid: equipment.status === "valid" && warnings.length === 0,
    warnings,
  };
}
