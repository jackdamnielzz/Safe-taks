"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import TemplateSelector from "@/components/templates/TemplateSelector";
import { LMRAStep1_TraSelection, LMRA } from "@/lib/types/lmra";
import { TraTemplate } from "@/types/tra-template";
import { getAllTemplates } from "@/lib/templates/load-templates";

type Props = {
  lmra?: Partial<LMRA>;
  onChange: (stepPayload: Partial<LMRAStep1_TraSelection>) => void;
};

export default function Step1_TraSelection({ lmra, onChange }: Props) {
  const t = useTranslations("safety.lmra.steps.step1");
  const current = lmra?.step1;
  const [templates, setTemplates] = useState<TraTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Manual loader to let the user retry loading templates on demand (helps debugging in the browser)
  const loadTemplatesNow = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error(`Failed to fetch templates: ${res.status}`);
      const data = await res.json();
      const loadedTemplates = Array.isArray(data?.templates) ? data.templates : [];
      // eslint-disable-next-line no-console
      console.debug(
        "[Step1_TraSelection] manual fetchTemplates count:",
        loadedTemplates.length,
        loadedTemplates
      );
      setTemplates(loadedTemplates);
    } catch (e) {
      console.error("[Step1_TraSelection] manual fetch failed:", e);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load templates via the API endpoint to avoid bundler JSON import issues in client runtime
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/templates");
        if (!res.ok) throw new Error(`Failed to fetch templates: ${res.status}`);
        const data = await res.json();
        const loadedTemplates = Array.isArray(data?.templates) ? data.templates : [];
        // Debug: log loaded templates so we can see why none appear in the UI
        // eslint-disable-next-line no-console
        console.debug(
          "[Step1_TraSelection] fetch loadedTemplates count:",
          loadedTemplates.length,
          loadedTemplates
        );
        if (!mounted) return;
        setTemplates(loadedTemplates);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
        if (!mounted) return;
        setTemplates([]);
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSelect = useCallback(
    (template: TraTemplate) => {
      onChange({
        traId: template.id,
        traTitle: template.name,
        traVersion: template.version ?? 1,
        templateId: template.id,
        selectedAt: new Date(),
      });
    },
    [onChange]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("description")}</p>

      {/* Reuse existing TemplateSelector component */}
      <div>
        {/* Visible template count to help debug without opening console */}
        <div className="mb-3 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            {t("templatesLoaded", { count: templates.length })}
          </span>
          {loadError && (
            <span className="inline-flex items-center rounded-md bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
              {t("errorLoading", { error: loadError })}
            </span>
          )}
        </div>

        <TemplateSelector
          templates={templates}
          onSelect={handleSelect}
          selectedId={current?.traId}
        />
      </div>

      {/* Manual load button (useful if templates don't appear automatically) */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={loadTemplatesNow}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {t("reloadButton")}
        </button>
        <span className="text-sm text-gray-500">{t("reloadHelp")}</span>
      </div>

      {/* Debug helper: show template count when none appear */}
      {templates.length === 0 && !isLoading && (
        <div className="mt-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          {t("noTemplates", { count: templates.length })}
        </div>
      )}

      <div className="text-sm text-gray-600">
        {current?.traTitle ? (
          <div>
            {t("selected", { title: current.traTitle })}{" "}
            {current.traVersion ? (
              <span className="text-xs">{t("version", { version: current.traVersion })}</span>
            ) : null}
          </div>
        ) : (
          <div>{t("notSelected")}</div>
        )}
      </div>
    </div>
  );
}
