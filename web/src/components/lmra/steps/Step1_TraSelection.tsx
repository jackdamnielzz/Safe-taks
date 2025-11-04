import React, { useCallback, useState, useEffect } from "react";
import TemplateSelector from "@/components/templates/TemplateSelector";
import { LMRAStep1_TraSelection, LMRA } from "@/lib/types/lmra";
import { TraTemplate } from "@/types/tra-template";
import { getAllTemplates } from "@/lib/templates/load-templates";

type Props = {
  lmra?: Partial<LMRA>;
  onChange: (stepPayload: Partial<LMRAStep1_TraSelection>) => void;
};

export default function Step1_TraSelection({ lmra, onChange }: Props) {
  const current = lmra?.step1;
  const [templates, setTemplates] = useState<TraTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const loadedTemplates = getAllTemplates();
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error("Failed to load templates:", error);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
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
        <p className="text-sm text-muted">Templates laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Selecteer de bijbehorende TRA (Task Risk Analysis) waar deze LMRA bij hoort.
      </p>

      {/* Reuse existing TemplateSelector component */}
      <div>
        <TemplateSelector 
          templates={templates}
          onSelect={handleSelect} 
          selectedId={current?.traId} 
        />
      </div>

      <div className="text-sm text-gray-600">
        {current?.traTitle ? (
          <div>
            Geselecteerd: <strong>{current.traTitle}</strong>{" "}
            {current.traVersion ? <span className="text-xs">v{current.traVersion}</span> : null}
          </div>
        ) : (
          <div>Geen TRA geselecteerd</div>
        )}
      </div>
    </div>
  );
}
