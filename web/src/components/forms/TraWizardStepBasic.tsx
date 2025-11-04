'use client';

import React from "react";
import { Control, UseFormSetValue } from "react-hook-form";
import HazardSelector, { HazardItem } from '@/components/hazards/HazardSelector';

/**
 * Step component to edit basic task steps for TRA wizard.
 * - Supports description + duration
 * - Adds HazardSelector per step to attach hazards to each task step
 *
 * Props:
 * - control: react-hook-form control (passed from parent)
 * - setValue: react-hook-form setValue to update taskSteps
 * - currentSteps: current taskSteps array
 *
 * Note: this keeps behaviour simple and updates the parent form via setValue.
 */

export function TraStepBasic({
  control,
  setValue,
  currentSteps,
}: {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  currentSteps?: any[];
}) {
  const steps = currentSteps || [];

  const updateStepAt = (idx: number, patch: Partial<any>) => {
    const updated = [...steps];
    updated[idx] = { ...(updated[idx] || {}), ...patch };
    setValue("taskSteps", updated, { shouldDirty: true });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium mb-2">Taakstappen</h3>
      <p className="text-sm text-slate-600 mb-3">
        Voeg taakstappen toe. Per stap kunt u gevaren koppelen en duur instellen.
      </p>

      <div className="space-y-3">
        {steps.map((s, idx) => (
          <div key={idx} className="p-3 border rounded space-y-3">
            <div>
              <label className="block text-sm font-medium">Stap {idx + 1} omschrijving</label>
              <input
                className="w-full border rounded px-3 py-2 mt-1"
                defaultValue={s.description || ""}
                onBlur={(e) => updateStepAt(idx, { description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Duur (minuten)</label>
              <input
                className="w-full border rounded px-3 py-2 mt-1"
                defaultValue={s.duration ?? ""}
                onBlur={(e) => {
                  const val = Number(e.target.value) || 0;
                  updateStepAt(idx, { duration: val });
                }}
                type="number"
                min={0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Gevaren (koppel gevaren aan deze stap)</label>
              <HazardSelector
                value={(s.hazards || []) as HazardItem[]}
                onChange={(selected) => {
                  // store selected hazards on the step
                  updateStepAt(idx, { hazards: selected });
                }}
                allowCustom={true}
                maxSelectable={10}
              />
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const updated = [...steps, { description: "", duration: 0, hazards: [] }];
              setValue("taskSteps", updated, { shouldDirty: true });
            }}
            className="px-3 py-2 rounded bg-slate-100 hover:bg-slate-200"
          >
            Voeg stap toe
          </button>

          <button
            type="button"
            onClick={() => {
              if (!steps.length) return;
              const updated = steps.slice(0, -1);
              setValue("taskSteps", updated, { shouldDirty: true });
            }}
            className="px-3 py-2 rounded bg-red-50 text-red-700 hover:bg-red-100"
          >
            Verwijder laatste
          </button>
        </div>
      </div>
    </div>
  );
}
