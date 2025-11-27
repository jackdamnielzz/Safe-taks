"use client";

import React, { useState, useCallback } from "react";
import { Wrench, Plus, Trash2, CheckCircle, AlertCircle, QrCode, X, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import QRScanner, {
  fetchEquipmentByQR,
  validateEquipmentStatus,
} from "@/components/mobile/QRScanner";
import {
  LMRAStep5_EquipmentVerification,
  EquipmentCheck,
  EquipmentStatus,
  LMRA,
} from "@/lib/types/lmra";
import { MaterialsList } from "@/components/tra/MaterialsList";

type Props = {
  lmra?: Partial<LMRA>;
  onChange: (stepPayload: Partial<LMRAStep5_EquipmentVerification>) => void;
};

export default function Step5_EquipmentVerification({ lmra, onChange }: Props) {
  const t = useTranslations("safety.lmra.steps.step5");
  const current = lmra?.step5;
  const [equipmentList, setEquipmentList] = useState<EquipmentCheck[]>(
    current?.equipmentList || []
  );
  const [notes, setNotes] = useState(current?.notes || "");
  const [qrScannerIndex, setQrScannerIndex] = useState<number | null>(null);

  const EQUIPMENT_STATUSES: { value: EquipmentStatus; label: string; color: string }[] = [
    { value: "available", label: t("statuses.available"), color: "green" },
    { value: "unavailable", label: t("statuses.unavailable"), color: "red" },
    { value: "damaged", label: t("statuses.damaged"), color: "orange" },
    { value: "maintenance", label: t("statuses.maintenance"), color: "yellow" },
  ];

  const updateStep = useCallback(
    (equipment: EquipmentCheck[], stepNotes: string) => {
      const allAvailable = equipment.every((e) => e.status === "available");

      onChange({
        equipmentList: equipment,
        allEquipmentAvailable: allAvailable,
        notes: stepNotes || undefined,
      });
    },
    [onChange]
  );

  const handleAddEquipment = () => {
    const newEquipment: EquipmentCheck = {
      equipmentId: `temp-${Date.now()}`,
      name: "",
      status: "available",
      serialNumber: "",
      inspectedAt: new Date(),
      notes: "",
    };
    const updated = [...equipmentList, newEquipment];
    setEquipmentList(updated);
    updateStep(updated, notes);
  };

  const handleRemoveEquipment = (index: number) => {
    const updated = equipmentList.filter((_, i) => i !== index);
    setEquipmentList(updated);
    updateStep(updated, notes);
  };

  const handleUpdateEquipment = (index: number, field: keyof EquipmentCheck, value: any) => {
    const updated = equipmentList.map((equipment, i) => {
      if (i === index) {
        return { ...equipment, [field]: value };
      }
      return equipment;
    });
    setEquipmentList(updated);
    updateStep(updated, notes);
  };

  const handleScanQRClick = (index: number) => {
    setQrScannerIndex(index);
  };

  const handleQRScanSuccess = async (qrCode: string) => {
    if (qrScannerIndex === null) return;

    // Attach scanned QR/serial to the selected equipment item
    const updated = equipmentList.map((item, i) =>
      i === qrScannerIndex
        ? {
            ...item,
            serialNumber: qrCode,
          }
        : item
    );

    setEquipmentList(updated);
    updateStep(updated, notes);
    setQrScannerIndex(null);
  };

  const handleQRScanError = (error: Error) => {
    console.error("QR scan error in Step5_EquipmentVerification:", error);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    updateStep(equipmentList, value);
  };

  const allAvailable = equipmentList.every((e) => e.status === "available");
  const hasUnavailable = equipmentList.some(
    (e) => e.status === "unavailable" || e.status === "damaged"
  );

  const getStatusColor = (status: EquipmentStatus) => {
    const config = EQUIPMENT_STATUSES.find((s) => s.value === status);
    return config?.color || "gray";
  };

  const getStatusLabel = (status: EquipmentStatus) => {
    const config = EQUIPMENT_STATUSES.find((s) => s.value === status);
    return config?.label || status;
  };

  return (
    <>
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("title")}</h3>
        <p className="text-sm text-gray-600">{t("description")}</p>
      </div>

      {/* Equipment Status */}
      {equipmentList.length > 0 && (
        <div
          className={`rounded-lg border-2 p-4 ${
            allAvailable
              ? "border-green-200 bg-green-50"
              : hasUnavailable
                ? "border-red-200 bg-red-50"
                : "border-yellow-200 bg-yellow-50"
          }`}
        >
          <div className="flex items-start gap-3">
            {allAvailable ? (
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle
                className={`h-6 w-6 flex-shrink-0 mt-0.5 ${
                  hasUnavailable ? "text-red-600" : "text-yellow-600"
                }`}
              />
            )}
            <div className="flex-1">
              <h4
                className={`font-medium mb-1 ${
                  allAvailable
                    ? "text-green-900"
                    : hasUnavailable
                      ? "text-red-900"
                      : "text-yellow-900"
                }`}
              >
                {allAvailable
                  ? t("equipmentStatus.allAvailable")
                  : hasUnavailable
                    ? t("equipmentStatus.notAllAvailable")
                    : t("equipmentStatus.someInMaintenance")}
              </h4>
              <p
                className={`text-sm ${
                  allAvailable
                    ? "text-green-700"
                    : hasUnavailable
                      ? "text-red-700"
                      : "text-yellow-700"
                }`}
              >
                {t("equipmentStatus.itemsRegistered", { count: equipmentList.length })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TRA Materials Reference */}
      {current?.referencedTraMaterials && current.referencedTraMaterials.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3 mb-3">
            <Package className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">
                {t("traMaterials.title")}
              </h4>
              <p className="text-sm text-blue-700">
                {t("traMaterials.description")}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <MaterialsList
              materials={current.referencedTraMaterials}
              onChange={() => {}}
              readOnly={true}
            />
          </div>
        </div>
      )}

      {/* Equipment List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">{t("equipmentList")}</h4>
          <button
            onClick={handleAddEquipment}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4" />
            {t("addEquipmentButton")}
          </button>
        </div>

        {equipmentList.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-4">{t("noEquipmentYet")}</p>
            <button
              onClick={handleAddEquipment}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              {t("addFirstEquipment")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {equipmentList.map((equipment, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        getStatusColor(equipment.status) === "green"
                          ? "bg-green-100"
                          : getStatusColor(equipment.status) === "red"
                            ? "bg-red-100"
                            : getStatusColor(equipment.status) === "orange"
                              ? "bg-orange-100"
                              : "bg-yellow-100"
                      }`}
                    >
                      <Wrench
                        className={`h-5 w-5 ${
                          getStatusColor(equipment.status) === "green"
                            ? "text-green-600"
                            : getStatusColor(equipment.status) === "red"
                              ? "text-red-600"
                              : getStatusColor(equipment.status) === "orange"
                                ? "text-orange-600"
                                : "text-yellow-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {t("equipmentNumber", { number: index + 1 })}
                      </h5>
                      <span
                        className={`text-xs font-medium ${
                          getStatusColor(equipment.status) === "green"
                            ? "text-green-600"
                            : getStatusColor(equipment.status) === "red"
                              ? "text-red-600"
                              : getStatusColor(equipment.status) === "orange"
                                ? "text-orange-600"
                                : "text-yellow-600"
                        }`}
                      >
                        {getStatusLabel(equipment.status)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveEquipment(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("fields.name")} *
                    </label>
                    <input
                      type="text"
                      value={equipment.name || ""}
                      onChange={(e) => handleUpdateEquipment(index, "name", e.target.value)}
                      placeholder={t("fields.namePlaceholder")}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("fields.status")} *
                    </label>
                    <select
                      value={equipment.status}
                      onChange={(e) =>
                        handleUpdateEquipment(index, "status", e.target.value as EquipmentStatus)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                    >
                      {EQUIPMENT_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("fields.serialNumber")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={equipment.serialNumber || ""}
                      onChange={(e) => handleUpdateEquipment(index, "serialNumber", e.target.value)}
                      placeholder={t("fields.serialNumberPlaceholder")}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <button
                      onClick={() => handleScanQRClick(index)}
                      className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title={t("qrScanner.scanTitle")}
                    >
                      <QrCode className="h-4 w-4" />
                      <span className="hidden sm:inline">{t("qrScanner.scanButton")}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("fields.notes")}
                  </label>
                  <textarea
                    value={equipment.notes || ""}
                    onChange={(e) => handleUpdateEquipment(index, "notes", e.target.value)}
                    rows={2}
                    placeholder={t("fields.notesPlaceholder")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                  />
                </div>

                {equipment.inspectedAt && (
                  <div className="text-xs text-gray-500">
                    {t("fields.inspectedAt")}:{" "}
                    {equipment.inspectedAt instanceof Date
                      ? equipment.inspectedAt.toLocaleString("nl-NL")
                      : new Date((equipment.inspectedAt as any).toMillis()).toLocaleString("nl-NL")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* General Notes */}
      <div>
        <label htmlFor="stepNotes" className="block text-sm font-medium text-gray-700 mb-2">
          {t("generalNotes")}
        </label>
        <textarea
          id="stepNotes"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          rows={3}
          placeholder={t("generalNotesPlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        />
      </div>

      {/* Warning for unavailable equipment */}
      {hasUnavailable && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900 mb-1">{t("warning.title")}</h4>
              <p className="text-sm text-red-700">{t("warning.message")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
        <h4 className="font-medium text-blue-900 mb-2 text-sm">{t("infoBox.title")}</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>
            • <strong>{t("statuses.available")}:</strong> {t("infoBox.available")}
          </li>
          <li>
            • <strong>{t("statuses.unavailable")}:</strong> {t("infoBox.unavailable")}
          </li>
          <li>
            • <strong>{t("statuses.damaged")}:</strong> {t("infoBox.damaged")}
          </li>
          <li>
            • <strong>{t("statuses.maintenance")}:</strong> {t("infoBox.maintenance")}
          </li>
        </ul>
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-blue-700">
            <strong>Tip:</strong> {t("infoBox.tip")}
          </p>
        </div>
      </div>
    </div>

    {/* QR Scanner Modal (lightweight POC) */}
    {qrScannerIndex !== null && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">
              {t("qrScanner.modalTitle")}
            </h4>
            <button
              onClick={() => setQrScannerIndex(null)}
              className="text-gray-500 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            {t("qrScanner.modalDescription")}
          </p>
          <QRScanner
            onScanSuccess={handleQRScanSuccess}
            onScanError={handleQRScanError}
            onClose={() => setQrScannerIndex(null)}
          />
        </div>
      </div>
    )}
    </>
  );
}
