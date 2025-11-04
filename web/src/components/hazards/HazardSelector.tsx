'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import hazardLibrary from '@/data/hazards/hazard-library.json';

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
  const t = useTranslations();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [selected, setSelected] = useState<Record<string, HazardItem>>({});
  const [customText, setCustomText] = useState('');

  // Load hazards from JSON
  const hazards: HazardItem[] = (hazardLibrary as any).hazards || [];

  useEffect(() => {
    // initialize from value
    const map: Record<string, HazardItem> = {};
    for (const h of value) map[h.id] = h;
    setSelected(map);
  }, [JSON.stringify(value)]);

  useEffect(() => {
    onChange && onChange(Object.values(selected));
  }, [selected]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    hazards.forEach((h) => set.add(h.category));
    return ['all', ...Array.from(set).sort()];
  }, [hazards]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hazards.filter((h) => {
      if (category !== 'all' && h.category !== category) return false;
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
      category: 'custom',
      typicalEffect: 7,
      typicalExposure: 3,
      typicalProbability: 1,
      commonControls: [],
    };
    setSelected((prev) => ({ ...prev, [customHazard.id]: customHazard }));
    setCustomText('');
  };

  const riskScore = (h: HazardItem) =>
    Math.round((h.typicalEffect || 1) * (h.typicalExposure || 1) * (h.typicalProbability || 1));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('hazards.selector.title', { default: 'Selecteer gevaren' })}</h3>
          <p className="text-sm text-gray-600">{t('hazards.selector.subtitle', { default: 'Kies uit de gevarenbibliotheek of voeg een eigen gevaar toe' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-sm"
            aria-label="Filter categorie"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? t('hazards.selector.allCategories', { default: 'Alle categorieën' }) : c}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder={t('hazards.selector.search', { default: 'Zoeken...' })}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-sm"
            aria-label="Zoek gevaren"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="col-span-2 space-y-3">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="text-sm text-gray-600 mb-2">
              {t('hazards.selector.results', { count: filtered.length, default: `${filtered.length} gevaren gevonden` })}
            </div>

            <ul className="space-y-2 max-h-96 overflow-auto pr-2">
              {filtered.map((h) => {
                const isSelected = !!selected[h.id];
                return (
                  <li key={h.id} className="flex items-start justify-between gap-3 rounded p-2 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <input
                        id={`hazard-${h.id}`}
                        checked={isSelected}
                        onChange={() => toggle(h)}
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      <div>
                        <label htmlFor={`hazard-${h.id}`} className="font-medium text-gray-900">
                          {h.name}
                        </label>
                        <div className="text-xs text-gray-600">{h.description}</div>
                        <div className="mt-1 flex gap-2">
                          <Badge variant="secondary">{h.category}</Badge>
                          <Badge variant="info">{t('hazards.selector.risk', { default: 'Risico' })}: {riskScore(h)}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-xs text-gray-500">
                      <div>{h.commonControls && h.commonControls.length > 0 ? `${h.commonControls.slice(0,2).join(', ')}${h.commonControls.length>2?'...':''}` : t('hazards.selector.noControls', { default: '-' })}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {allowCustom && (
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="text-sm font-medium text-gray-900">{t('hazards.selector.addCustomTitle', { default: 'Eigen gevaar toevoegen' })}</div>
              <div className="mt-2 flex gap-2">
                <input
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={t('hazards.selector.addCustomPlaceholder', { default: 'Omschrijf het gevaar' })}
                  className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  onClick={addCustom}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {t('hazards.selector.add', { default: 'Toevoegen' })}
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="text-sm font-medium text-gray-900">{t('hazards.selector.selectedTitle', { default: 'Geselecteerde gevaren' })}</div>
            <div className="mt-3 space-y-2">
              {Object.values(selected).length === 0 && <div className="text-sm text-gray-600">{t('hazards.selector.none', { default: 'Geen geselecteerd' })}</div>}
              {Object.values(selected).map((h) => (
                <div key={h.id} className="flex items-start justify-between gap-3 rounded border border-gray-100 p-2">
                  <div>
                    <div className="font-medium text-gray-900">{h.name}</div>
                    <div className="text-xs text-gray-600">{h.description}</div>
                    <div className="mt-1 text-xs text-gray-500">{t('hazards.selector.risk')}: {riskScore(h)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => toggle(h)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      {t('hazards.selector.remove', { default: 'Verwijder' })}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="text-sm font-medium text-gray-900">{t('hazards.selector.summary', { default: 'Samenvatting' })}</div>
            <div className="mt-2 text-sm text-gray-600">
              {t('hazards.selector.count', { count: Object.values(selected).length, default: '{count} geselecteerd' })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
