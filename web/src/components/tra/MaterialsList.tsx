"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AlertTriangle, Plus, Trash2, Edit2, Save, X, Lightbulb } from "lucide-react";
import type { Material, Hazard, MaterialMSDSFile } from "@/lib/types/tra";
import { validateMaterial } from "@/lib/validators/tra-context-fields";
import { suggestHazardsFromMaterials } from "@/lib/utils/material-hazard-mapping";

interface MaterialsListProps {
  materials: Material[];
  onChange: (materials: Material[]) => void;
  readOnly?: boolean;
  onSuggestHazards?: (hazards: Hazard[]) => void;
}

export function MaterialsList({ materials, onChange, readOnly = false, onSuggestHazards }: MaterialsListProps) {
  const t = useTranslations("tra.contextFields");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Hazard[]>([]);
  const [formData, setFormData] = useState<Omit<Material, "id">>({
    name: "",
    quantity: "",
    unit: "",
    hazardous: false,
    msdsRequired: false,
    storageRequirements: "",
    msdsFiles: [],
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: "",
      quantity: "",
      unit: "",
      hazardous: false,
      msdsRequired: false,
      storageRequirements: "",
      msdsFiles: [],
    });
    setValidationError(null);
  };

  const handleStartEdit = (material: Material) => {
    setEditingId(material.id);
    setIsAdding(false);
    setFormData({
      name: material.name,
      quantity: material.quantity,
      unit: material.unit,
      hazardous: material.hazardous,
      msdsRequired: material.msdsRequired,
      storageRequirements: material.storageRequirements || "",
      msdsFiles: material.msdsFiles || [],
    });
    setValidationError(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setValidationError(null);
  };

  const handleSave = () => {
    // Validate
    const materialToValidate: Material = {
      id: editingId || "temp",
      ...formData,
    };
    const validation = validateMaterial(materialToValidate);

    if (!validation.valid) {
      setValidationError(validation.error || "Validatie mislukt");
      return;
    }

    if (editingId) {
      // Update existing
      const updated = materials.map((m) =>
        m.id === editingId ? { ...materialToValidate, id: editingId } : m
      );
      onChange(updated);
    } else {
      // Add new
      const newMaterial: Material = {
        id: `material-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...formData,
      };
      onChange([...materials, newMaterial]);
    }

    handleCancel();
  };

  const handleDelete = (id: string) => {
    const updated = materials.filter((m) => m.id !== id);
    onChange(updated);
  };

  const handleFieldChange = (field: keyof Omit<Material, "id">, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationError(null);
  };

  const handleSuggestHazards = () => {
    const suggestedHazards = suggestHazardsFromMaterials(materials);
    setSuggestions(suggestedHazards);
    setShowSuggestions(true);
  };

  const handleMsdsUpload = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles: MaterialMSDSFile[] = Array.from(fileList).map((file) => ({
      id: `msds-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || "application/octet-stream",
      storagePath: "", // wordt later ingevuld na echte upload naar storage
      uploadedAt: new Date(),
      uploadedByUserId: "local", // placeholder; backend kan dit later overschrijven
    }));

    setFormData((prev) => ({
      ...prev,
      msdsFiles: [...(prev.msdsFiles || []), ...newFiles],
    }));
  };

  const handleRemoveMsdsFile = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      msdsFiles: (prev.msdsFiles || []).filter((file) => file.id !== id),
    }));
  };

  const handleAddSuggestion = (hazard: Hazard) => {
    if (onSuggestHazards) {
      onSuggestHazards([hazard]);
    }
  };

  const handleAddAllSuggestions = () => {
    if (onSuggestHazards && suggestions.length > 0) {
      onSuggestHazards(suggestions);
      setShowSuggestions(false);
    }
  };

  return (
    <>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("materials")}</h3>
        <div className="flex items-center gap-2">
          {!readOnly && materials.length > 0 && onSuggestHazards && (
            <Button
              type="button"
              onClick={handleSuggestHazards}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Lightbulb className="h-4 w-4" />
              {t("suggestHazards")}
            </Button>
          )}
          {!readOnly && !isAdding && (
            <Button
              type="button"
              onClick={handleStartAdd}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("addMaterial")}
            </Button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Material Name */}
              <div className="md:col-span-2">
                <label htmlFor="material-name" className="block text-sm font-medium mb-1">
                  {t("materialName")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="material-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Bijv. Cement, Verf, Staal"
                />
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="material-quantity" className="block text-sm font-medium mb-1">
                  {t("quantity")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="material-quantity"
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => handleFieldChange("quantity", e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Bijv. 10, 25.5"
                />
              </div>

              {/* Unit */}
              <div>
                <label htmlFor="material-unit" className="block text-sm font-medium mb-1">
                  {t("unit")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="material-unit"
                  type="text"
                  value={formData.unit}
                  onChange={(e) => handleFieldChange("unit", e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Bijv. kg, liter, m³"
                />
              </div>

              {/* Storage Requirements */}
              <div className="md:col-span-2">
                <label htmlFor="material-storage" className="block text-sm font-medium mb-1">{t("storageRequirements")}</label>
                <textarea
                  id="material-storage"
                  value={formData.storageRequirements}
                  onChange={(e) => handleFieldChange("storageRequirements", e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Bijv. Koel en droog bewaren, uit de zon"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hazardous}
                    onChange={(e) => handleFieldChange("hazardous", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{t("hazardous")}</span>
                  <span
                    className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold"
                    title="Gevaarlijk: gebruik dit wanneer het materiaal extra risico's oplevert (bijvoorbeeld brandbaar, explosief, giftig of bijtend) en er aanvullende veiligheidsmaatregelen nodig zijn volgens VCA."
                  >
                    i
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.msdsRequired}
                    onChange={(e) => handleFieldChange("msdsRequired", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{t("msdsRequired")}</span>
                  <span
                    className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold"
                    title="MSDS vereist: selecteer dit wanneer je voor dit materiaal een veiligheidsinformatieblad (Material Safety Data Sheet) nodig hebt, zodat alle risico's en beheersmaatregelen duidelijk beschikbaar zijn voor het team."
                  >
                    i
                  </span>
                </label>
              </div>

              {formData.msdsRequired && (
                <div className="md:col-span-2 mt-2 space-y-2">
                  <label className="block text-sm font-medium">
                    MSDS document(en) uploaden
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.odt,.ods,.rtf,.txt,.html,.htm,.xml,.json,.csv"
                    onChange={(e) => handleMsdsUpload(e.target.files)}
                    className="block text-sm"
                  />
                  {formData.msdsFiles && formData.msdsFiles.length > 0 && (
                    <ul className="text-xs text-slate-700 space-y-1">
                      {formData.msdsFiles.map((file) => (
                        <li key={file.id} className="flex items-center justify-between gap-2">
                          <span className="truncate">{file.fileName}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMsdsFile(file.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Verwijderen
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{validationError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 justify-end">
              <Button type="button" onClick={handleCancel} variant="outline" size="sm">
                Annuleren
              </Button>
              <Button type="button" onClick={handleSave} size="sm">
                Opslaan
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Materials List */}
      <div className="space-y-2">
        {materials.length === 0 && !isAdding && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-sm text-slate-600">
            Nog geen materialen toegevoegd
          </div>
        )}

        {materials.map((material) => (
          <Card key={material.id} className="border">
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-semibold text-slate-900 break-all">{material.name}</h4>
                    {material.hazardous && (
                      <Badge className="bg-red-500 text-white text-xs px-2 py-1 flex items-center justify-center">
                        <span
                          title="Dit materiaal is als gevaarlijk gemarkeerd. Let op de extra veiligheidsmaatregelen en volg de VCA-richtlijnen voor opslag, gebruik en persoonlijke beschermingsmiddelen."
                          className="flex items-center justify-center"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </span>
                      </Badge>
                    )}
                    {material.msdsRequired && (
                      <Badge className="bg-orange-500 text-white text-xs">MSDS Vereist</Badge>
                    )}
                  </div>

                  <div className="text-sm text-slate-600 space-y-1">
                    <div>
                      <span className="font-medium">Hoeveelheid:</span> {material.quantity}{" "}
                      {material.unit}
                    </div>
                    {material.storageRequirements && (
                      <div>
                        <span className="font-medium">Opslag:</span> {material.storageRequirements}
                      </div>
                    )}
                  </div>
                </div>

                {!readOnly && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      type="button"
                      onClick={() => handleStartEdit(material)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      Bewerken
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDelete(material.id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                      Verwijderen
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>

    {/* Hazard Suggestions Modal */}
    {showSuggestions && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">{t("hazardSuggestions")}</h3>
            </div>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-gray-500 hover:text-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {suggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                {t("noSuggestions")}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  {t("basedOnMaterials")}
                </p>
                {suggestions.map((hazard, index) => (
                  <Card key={index} className="border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-orange-100 text-orange-800 text-xs">
                            {hazard.category}
                          </Badge>
                          <Badge className={`text-xs ${
                            hazard.riskLevel === 'high' || hazard.riskLevel === 'very_high'
                              ? 'bg-red-100 text-red-800'
                              : hazard.riskLevel === 'substantial' || hazard.riskLevel === 'possible'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {hazard.riskLevel}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          {hazard.description}
                        </h4>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium mb-1">Beheersmaatregelen:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {hazard.controlMeasures.map((control, idx) => (
                              <li key={idx}>{control.description}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleAddSuggestion(hazard)}
                        size="sm"
                        className="flex-shrink-0"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t("addSuggestion")}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
            <Button
              type="button"
              onClick={() => setShowSuggestions(false)}
              variant="outline"
              size="sm"
            >
              Sluiten
            </Button>
            {suggestions.length > 0 && (
              <Button
                type="button"
                onClick={handleAddAllSuggestions}
                size="sm"
              >
                Alle suggesties toevoegen
              </Button>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default MaterialsList;