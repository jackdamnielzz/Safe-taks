"use client";

/**
 * Report Builder Page
 * Drag-and-drop interface for creating custom reports
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert } from "@/components/ui/Alert";
import type { ReportTemplate, ReportSection, ReportSectionType } from "@/lib/types/report";
import { createDefaultSection, getSectionTypeName } from "@/lib/types/report";

export default function ReportBuilderPage() {
  const { user, userProfile } = useAuth();
  const [template, setTemplate] = useState<Partial<ReportTemplate>>({
    name: "",
    description: "",
    sections: [],
    branding: {},
  });
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canBuildReports = userProfile?.role === "admin" || userProfile?.role === "safety_manager";

  const addSection = (type: ReportSectionType) => {
    const newSection = createDefaultSection(type, template.sections?.length || 0);
    setTemplate({
      ...template,
      sections: [...(template.sections || []), newSection],
    });
    setSelectedSection(newSection.id);
  };

  const removeSection = (sectionId: string) => {
    setTemplate({
      ...template,
      sections: template.sections?.filter((s) => s.id !== sectionId) || [],
    });
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
  };

  const moveSection = (sectionId: string, direction: "up" | "down") => {
    const sections = [...(template.sections || [])];
    const index = sections.findIndex((s) => s.id === sectionId);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
    sections.forEach((s, i) => (s.order = i));

    setTemplate({ ...template, sections });
  };

  const saveTemplate = async () => {
    if (!template.name) {
      setError("Rapportnaam is verplicht");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/reports/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });

      if (!response.ok) throw new Error("Failed to save template");

      alert("Rapport sjabloon opgeslagen!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  if (!canBuildReports) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">
          Je hebt geen toegang tot deze pagina. Alleen admins en safety managers kunnen rapporten
          bouwen.
        </Alert>
      </div>
    );
  }

  const sectionTypes: ReportSectionType[] = [
    "executive_summary",
    "kpi_widget",
    "chart",
    "data_table",
    "tra_list",
    "lmra_list",
    "text_block",
    "risk_matrix",
    "compliance_summary",
    "page_break",
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rapport Builder</h1>
        <p className="text-gray-600">Bouw aangepaste rapporten met drag-and-drop interface</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template Settings */}
        <Card className="lg:col-span-1">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Sjabloon Instellingen</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Maandelijks Veiligheidsrapport"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
                <textarea
                  value={template.description}
                  onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Beschrijf het doel van dit rapport..."
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Branding</h3>
                <div className="space-y-2">
                  <input
                    type="color"
                    value={template.branding?.primaryColor || "#f97316"}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        branding: { ...template.branding, primaryColor: e.target.value },
                      })
                    }
                    className="w-full h-10 rounded"
                  />
                  <p className="text-xs text-gray-500">Primaire kleur</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={saveTemplate}
                  disabled={saving || !template.name}
                  className="w-full"
                >
                  {saving ? <LoadingSpinner size="sm" /> : "💾 Sjabloon Opslaan"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Middle: Section List */}
        <Card className="lg:col-span-1">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Secties</h2>

            {template.sections && template.sections.length > 0 ? (
              <div className="space-y-2">
                {template.sections.map((section, index) => (
                  <div
                    key={section.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSection === section.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedSection(section.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {section.title || getSectionTypeName(section.type)}
                        </p>
                        <p className="text-xs text-gray-500">{getSectionTypeName(section.type)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(section.id, "up");
                          }}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(section.id, "down");
                          }}
                          disabled={index === template.sections!.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSection(section.id);
                          }}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">
                Geen secties toegevoegd. Kies een sectie type hieronder.
              </p>
            )}

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Sectie Toevoegen</h3>
              <div className="grid grid-cols-2 gap-2">
                {sectionTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => addSection(type)}
                    className="px-3 py-2 text-xs border border-gray-300 rounded hover:border-orange-500 hover:bg-orange-50 transition-colors"
                  >
                    {getSectionTypeName(type)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Right: Section Editor */}
        <Card className="lg:col-span-1">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Sectie Bewerken</h2>

            {selectedSection ? (
              <div className="space-y-4">
                {(() => {
                  const section = template.sections?.find((s) => s.id === selectedSection);
                  if (!section) return null;

                  return (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Titel
                        </label>
                        <input
                          type="text"
                          value={section.title || ""}
                          onChange={(e) => {
                            const updated = template.sections?.map((s) =>
                              s.id === selectedSection ? { ...s, title: e.target.value } : s
                            );
                            setTemplate({ ...template, sections: updated });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Breedte
                        </label>
                        <select
                          value={section.width || "full"}
                          onChange={(e) => {
                            const updated = template.sections?.map((s) =>
                              s.id === selectedSection ? { ...s, width: e.target.value as any } : s
                            );
                            setTemplate({ ...template, sections: updated });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="full">Volledige breedte</option>
                          <option value="half">Halve breedte</option>
                          <option value="third">Een derde</option>
                          <option value="two-thirds">Twee derde</option>
                        </select>
                      </div>

                      {section.type === "text_block" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Inhoud
                          </label>
                          <textarea
                            value={(section as any).content || ""}
                            onChange={(e) => {
                              const updated = template.sections?.map((s) =>
                                s.id === selectedSection ? { ...s, content: e.target.value } : s
                              );
                              setTemplate({ ...template, sections: updated });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={6}
                          />
                        </div>
                      )}

                      <div className="pt-4 text-xs text-gray-500">
                        <p>
                          <strong>Type:</strong> {getSectionTypeName(section.type)}
                        </p>
                        <p>
                          <strong>ID:</strong> {section.id}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">
                Selecteer een sectie om te bewerken
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Preview Section */}
      <Card className="mt-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Voorbeeld</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
            <p className="text-center text-gray-500">Rapport voorbeeld wordt hier weergegeven</p>
            <p className="text-center text-sm text-gray-400 mt-2">
              {template.sections?.length || 0} secties
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
