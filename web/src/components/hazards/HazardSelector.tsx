"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import hazardLibrary from "@/data/hazards/hazard-library.json";

export type HazardItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  typicalEffect: number;
  typicalExposure: number;
  typicalProbability: number;
  commonControls?: string[];
};

interface HazardSelectorProps {
  value?: HazardItem[];
  onChange?: (selected: HazardItem[]) => void;
  allowCustom?: boolean;
  maxSelectable?: number;
}

export default function HazardSelector({
  value = [],
  onChange,
  allowCustom = true,
  maxSelectable = 20,
}: HazardSelectorProps) {
  const t = useTranslations("hazards.selector");
  const tCategories = useTranslations("hazards.categories");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [selected, setSelected] = useState<Record<string, HazardItem>>({});
  const [customText, setCustomText] = useState("");

  // Load hazards from JSON
  const hazards: HazardItem[] = (hazardLibrary as any).hazards || [];

  useEffect(() => {
    // initialize from value once on mount
    const map: Record<string, HazardItem> = {};
    for (const h of value) map[h.id] = h;
    setSelected(map);
    // We intentionally do NOT depend on `value` here to avoid React infinite update loops
    // when parents derive `value` from `onChange` output.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!onChange) return;
    const next = Object.values(selected);
    onChange(next);
  }, [selected, onChange]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    hazards.forEach((h) => set.add(h.category));
    return ["all", ...Array.from(set).sort()];
  }, [hazards]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hazards.filter((h) => {
      if (category !== "all" && h.category !== category) return false;
      if (!q) return true;
      return (
        h.name.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.id.toLowerCase().includes(q)
      );
    });
  }, [hazards, query, category]);

  const toggle = (h: HazardItem) => {
    setSelected((prev) => {
      const copy = { ...prev };
      if (copy[h.id]) {
        delete copy[h.id];
      } else {
        if (Object.keys(copy).length >= maxSelectable) {
          return prev;
        }
        copy[h.id] = h;
      }
      return copy;
    });
  };

  const addCustom = () => {
    if (!allowCustom) return;
    const text = customText.trim();
    if (!text) return;
    const id = `custom-${Date.now()}`;
    const customHazard: HazardItem = {
      id,
      name: text,
      description: text,
      category: "custom",
      typicalEffect: 7,
      typicalExposure: 3,
      typicalProbability: 1,
      commonControls: [],
    };
    setSelected((prev) => ({ ...prev, [customHazard.id]: customHazard }));
    setCustomText("");
  };

  const riskScore = (h: HazardItem) =>
    Math.round((h.typicalEffect || 1) * (h.typicalExposure || 1) * (h.typicalProbability || 1));

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      {/* Selected Hazards Summary */}
      <div className="space-y-2">
        {Object.values(selected).map((h) => (
          <div
            key={h.id}
            className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-slate-900">{h.name}</div>
              <div className="text-xs text-slate-600 mt-0.5">
                {tCategories(h.category as any)}
              </div>
            </div>
            <button
              onClick={() => toggle(h)}
              className="text-red-600 hover:text-red-800 text-sm flex-shrink-0"
              title="Verwijderen"
            >
              ✕
            </button>
          </div>
        ))}
        {Object.values(selected).length === 0 && (
          <div className="text-sm text-slate-500 italic">
            Geen gevaren geselecteerd
          </div>
        )}
      </div>

      {/* Dropdown Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border-2 border-slate-300 rounded-lg hover:border-blue-500 hover:bg-slate-50 transition-colors"
      >
        <span className="font-medium text-slate-700">
          {isOpen ? "Sluiten" : "+ Gevaar toevoegen"}
        </span>
        <span className="text-slate-400">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="border-2 border-slate-200 rounded-lg bg-white p-4 space-y-3">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm flex-shrink-0"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "Alle categorieën" : tCategories(c as any)}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Zoeken..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Hazard List */}
          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded">
            {filtered.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">
                Geen gevaren gevonden
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map((h) => {
                  const isSelected = !!selected[h.id];
                  return (
                    <li
                      key={h.id}
                      className={`p-3 hover:bg-slate-50 cursor-pointer ${isSelected ? "bg-blue-50" : ""}`}
                      onClick={() => toggle(h)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-slate-900">{h.name}</div>
                          <div className="text-xs text-slate-600 mt-1">{h.description}</div>
                          <div className="flex gap-2 mt-1.5">
                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                              {tCategories(h.category as any)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Custom Hazard Input */}
          {allowCustom && (
            <div className="pt-3 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Eigen gevaar toevoegen..."
                  className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom();
                    }
                  }}
                />
                <button
                  onClick={addCustom}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
                >
                  Toevoegen
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
