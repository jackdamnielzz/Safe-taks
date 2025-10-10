"use client";

import React from "react";
import { Control, UseFormSetValue } from "react-hook-form";

/**
 * Simple step component to edit basic task steps for TRA wizard.
 * Keeps implementation minimal and testable.
 *
 * Props:
 * - control: react-hook-form control (passed from parent)
 * - setValue: react-hook-form setValue to update taskSteps
 * - currentSteps: current taskSteps array
 *
 * This component intentionally keeps structure simple (title + duration)
 * — full hazard editing UI can be implemented later.
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
  return (
    <div>
      <h3 className="font-medium mb-2">Task steps</h3>
      <p className="text-sm text-slate-600 mb-3">
        Add simple task steps. You can expand each step later with hazards and controls.
      </p>

      <div className="space-y-3">
        {(currentSteps || []).map((s, idx) => (
          <div key={idx} className="p-3 border rounded">
            <label className="block text-sm font-medium">Step {idx + 1} description</label>
            <input
              className="w-full border rounded px-3 py-2 mt-1"
              defaultValue={s.description || ""}
              onBlur={(e) => {
                const updated = [...(currentSteps || [])];
                updated[idx] = { ...(updated[idx] || {}), description: e.target.value };
                setValue("taskSteps", updated, { shouldDirty: true });
              }}
            />
            <label className="block text-sm font-medium mt-2">Duration (minutes)</label>
            <input
              className="w-full border rounded px-3 py-2 mt-1"
              defaultValue={s.duration ?? ""}
              onBlur={(e) => {
                const val = Number(e.target.value) || 0;
                const updated = [...(currentSteps || [])];
                updated[idx] = { ...(updated[idx] || {}), duration: val };
                setValue("taskSteps", updated, { shouldDirty: true });
              }}
            />
          </div>
        ))}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const updated = [...(currentSteps || []), { description: "", duration: 0 }];
              setValue("taskSteps", updated, { shouldDirty: true });
            }}
            className="px-3 py-2 rounded bg-slate-100 hover:bg-slate-200"
          >
            Add step
          </button>

          <button
            type="button"
            onClick={() => {
              if (!(currentSteps || []).length) return;
              const updated = (currentSteps || []).slice(0, -1);
              setValue("taskSteps", updated, { shouldDirty: true });
            }}
            className="px-3 py-2 rounded bg-red-50 text-red-700 hover:bg-red-100"
          >
            Remove last
          </button>
        </div>
      </div>
    </div>
  );
}
