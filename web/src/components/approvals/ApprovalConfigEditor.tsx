"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import type { CreateApprovalPayload } from "@/types/approval";
import { Button } from "@/components/ui/Button";

interface ApprovalConfigEditorProps {
  traId: string;
  initial?: CreateApprovalPayload;
  onSave?: (payload: CreateApprovalPayload) => Promise<void> | void;
}

export default function ApprovalConfigEditor({
  traId,
  initial,
  onSave,
}: ApprovalConfigEditorProps) {
  const t = useTranslations();
  const [steps, setSteps] = useState(
    initial?.steps?.map((s, i) => ({ ...s })) ?? [
      {
        name: "Safety Manager review",
        approverRole: "safety_manager",
        approverId: null,
        dueDate: null,
      },
    ]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStep = (index: number, patch: Partial<CreateApprovalPayload["steps"][number]>) => {
    setSteps((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const addStep = () =>
    setSteps((prev) => [
      ...prev,
      { name: "Nieuwe stap", approverRole: "safety_manager", approverId: null, dueDate: null },
    ]);

  const removeStep = (index: number) => setSteps((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const payload: CreateApprovalPayload = {
      traId,
      createdBy: "system", // caller should override server-side
      steps: steps.map((s) => ({
        name: s.name,
        approverRole: s.approverRole,
        approverId: s.approverId ?? null,
        dueDate: s.dueDate ?? null,
      })),
      metadata: {},
    };
    try {
      if (onSave) {
        await onSave(payload);
      } else {
        // default: call API endpoint
        const res = await fetch(`/api/approvals/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(body || "Failed to save approval workflow");
        }
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {t("approvals.editor.title", { default: "Approval workflow configurator" })}
      </h3>

      <div className="space-y-3">
        {steps.map((s, idx) => (
          <div key={idx} className="border rounded p-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Stap {idx + 1}</div>
              <div>
                <button
                  type="button"
                  onClick={() => removeStep(idx)}
                  className="text-xs text-red-600 hover:underline"
                >
                  {t("approvals.editor.remove", { default: "Verwijder" })}
                </button>
              </div>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <input
                value={s.name}
                onChange={(e) => updateStep(idx, { name: e.target.value })}
                className="col-span-2 rounded border px-2 py-1"
                placeholder={t("approvals.editor.stepName", { default: "Stap naam" })}
              />
              <input
                value={s.approverRole}
                onChange={(e) => updateStep(idx, { approverRole: e.target.value })}
                className="rounded border px-2 py-1"
                placeholder={t("approvals.editor.role", { default: "Approver rol" })}
              />
              <input
                value={s.approverId ?? ""}
                onChange={(e) => updateStep(idx, { approverId: e.target.value || null })}
                className="rounded border px-2 py-1"
                placeholder={t("approvals.editor.approverId", {
                  default: "Optioneel: gebruiker id",
                })}
              />
              <input
                type="date"
                value={s.dueDate ? new Date(s.dueDate).toISOString().slice(0, 10) : ""}
                onChange={(e) =>
                  updateStep(idx, {
                    dueDate: e.target.value ? new Date(e.target.value).getTime() : null,
                  })
                }
                className="rounded border px-2 py-1"
              />
            </div>
          </div>
        ))}
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={addStep}
          className="rounded bg-slate-100 px-3 py-2 hover:bg-slate-200"
        >
          {t("approvals.editor.addStep", { default: "Voeg stap toe" })}
        </button>

        <Button onClick={handleSave} disabled={saving}>
          {saving
            ? t("approvals.editor.saving", { default: "Opslaan..." })
            : t("approvals.editor.save", { default: "Opslaan workflow" })}
        </Button>
      </div>
    </div>
  );
}
