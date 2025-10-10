"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation";
import { FormField } from "../ui/FormField";
import { Button } from "../ui/Button";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import type { CreateTRARequest } from "../../lib/types/tra";
import { TraStepBasic } from "./TraWizardStepBasic";
import { TeamMemberSelector } from "./TeamMemberSelector";

/**
 * Minimal, accessible multi-step TRA wizard.
 * - Debounced autosave to POST /api/tras/draft
 * - Per-step basic client-side validation (using react-hook-form)
 * - Progress bar, step navigation, save status indicator
 *
 * Reuse this component from page at web/src/app/tras/create/page.tsx
 */

type WizardForm = Partial<CreateTRARequest>;

const STEPS = ["Basic", "Steps", "Team", "Review"] as const;

export default function TraWizard({ initialData }: { initialData?: WizardForm }) {
  const router = useRouter();
  const { control, handleSubmit, watch, setValue, getValues } = useForm<WizardForm>({
    defaultValues: initialData || { title: "", description: "", taskSteps: [] },
    mode: "onBlur",
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  const watched = watch();
  const mounted = useRef(false);

  // Debounced autosave (2s after changes)
  const autosave = useRef(
    debounce(async (payload: WizardForm) => {
      try {
        setSaveStatus("saving");
        const res = await fetch("/api/tras/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to save draft");
        setSaveStatus("saved");
      } catch (e) {
        console.error(e);
        setSaveStatus("failed");
      }
    }, 2000)
  ).current;

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    autosave(getValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched]);

  useEffect(() => {
    return () => {
      autosave.flush();
    };
  }, [autosave]);

  function next() {
    setStepIndex((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function prev() {
    setStepIndex((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(data: WizardForm) {
    // final validation can be added here (reuse web/src/lib/validators/tra.ts externally)
    try {
      setSaveStatus("saving");
      const res = await fetch("/api/tras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Create failed");
      const body = await res.json();
      setSaveStatus("saved");
      // redirect to created TRA detail or list
      if (body?.id) {
        router.push(`/tras/${body.id}`);
      } else {
        router.push("/tras");
      }
    } catch (e) {
      console.error(e);
      setSaveStatus("failed");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-labelledby="tra-wizard-title"
      className="bg-white p-6 rounded shadow-sm"
    >
      <div className="mb-4">
        <h2 id="tra-wizard-title" className="text-xl font-semibold">
          Create TRA — Step {stepIndex + 1} of {STEPS.length}
        </h2>
        <div className="mt-2 h-2 bg-slate-100 rounded">
          <div
            aria-hidden
            className="h-2 bg-blue-500 rounded"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-4" role="region" aria-live="polite">
        {stepIndex === 0 && (
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <FormField label="Title" htmlFor="tra-title" required>
                <input
                  id="tra-title"
                  {...field}
                  className="w-full border rounded px-3 py-2"
                  aria-required
                />
              </FormField>
            )}
          />
        )}

        {stepIndex === 0 && (
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <FormField label="Description" htmlFor="tra-description">
                <textarea
                  id="tra-description"
                  {...field}
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                />
              </FormField>
            )}
          />
        )}

        {stepIndex === 1 && (
          <TraStepBasic
            control={control}
            setValue={setValue}
            currentSteps={getValues().taskSteps || []}
          />
        )}

        {stepIndex === 2 && (
          <TeamMemberSelector
            control={control}
            setValue={setValue}
            getValues={getValues}
          />
        )}

        {stepIndex === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Controleer je TRA</h3>
            
            {/* Basic Info */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium text-slate-700 mb-2">Basis Informatie</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-slate-600">Titel:</dt>
                  <dd className="font-medium">{getValues().title || <span className="text-slate-400">Niet ingevuld</span>}</dd>
                </div>
                {getValues().description && (
                  <div>
                    <dt className="text-sm text-slate-600">Beschrijving:</dt>
                    <dd className="text-sm">{getValues().description}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Task Steps */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium text-slate-700 mb-2">Taakstappen</h4>
              {(() => {
                const steps = getValues().taskSteps;
                return steps?.length ? (
                  <p className="text-sm">
                    {steps.length} {steps.length === 1 ? 'stap' : 'stappen'} toegevoegd
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">Geen taakstappen toegevoegd</p>
                );
              })()}
            </div>

            {/* Team Members */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium text-slate-700 mb-2">Teamleden</h4>
              {(() => {
                const members = getValues().teamMembers;
                return members?.length ? (
                  <ul className="space-y-1">
                    {members.map((email: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {email}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-amber-600">⚠️ Voeg minimaal 1 teamlid toe om de TRA in te dienen</p>
                );
              })()}
            </div>

            {/* Validation Warning */}
            {(!getValues().title || !getValues().teamMembers || getValues().teamMembers?.length === 0) && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Let op:</strong> Vul alle verplichte velden in voordat je de TRA aanmaakt:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-amber-700">
                  {!getValues().title && <li>• Titel is verplicht</li>}
                  {(!getValues().teamMembers || getValues().teamMembers?.length === 0) && (
                    <li>• Minimaal 1 teamlid is verplicht</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={prev}
            disabled={stepIndex === 0}
            className="px-3 py-2 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
          >
            Back
          </button>

          {stepIndex < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <Button type="submit">Create TRA</Button>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-2">
              <LoadingSpinner /> Saving...
            </span>
          )}
          {saveStatus === "saved" && <span aria-live="polite">Saved</span>}
          {saveStatus === "failed" && <span className="text-red-600">Save failed</span>}
        </div>
      </div>
    </form>
  );
}
