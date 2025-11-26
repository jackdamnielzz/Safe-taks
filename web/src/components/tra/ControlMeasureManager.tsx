"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { TextArea } from "@/components/ui/TextArea";
import { Trash, ChevronDown, ChevronUp, Check } from "lucide-react";
import type {
  ControlMeasure,
  ControlMeasureType,
  ImplementationStatus,
} from "@/lib/types/tra";

export type SuggestedControl = string;

const HIERARCHY: { key: ControlMeasureType; labelKey: string }[] = [
  { key: "elimination", labelKey: "elimination" },
  { key: "substitution", labelKey: "substitution" },
  { key: "engineering", labelKey: "engineering" },
  { key: "administrative", labelKey: "administrative" },
  { key: "ppe", labelKey: "ppe" },
];

const STATUS_OPTIONS: ImplementationStatus[] = ["planned", "in_progress", "completed", "verified"];

// Zod schema for a single control measure
const ControlMeasureSchema = z.object({
  id: z.string(),
  type: z.enum(["elimination", "substitution", "engineering", "administrative", "ppe"]),
  description: z.string().min(10, { message: "validation.descriptionMin" }),
  responsiblePerson: z.string().optional(),
  implementationStatus: z
    .enum(["planned", "in_progress", "completed", "verified"])
    .optional(),
});

const FormSchema = z.object({
  measures: z.array(ControlMeasureSchema).min(0),
});

type FormValues = z.infer<typeof FormSchema>;

interface ControlMeasureManagerProps {
  hazardId: string;
  existingMeasures?: ControlMeasure[];
  suggestedControls?: SuggestedControl[];
  onUpdate?: (measures: ControlMeasure[]) => void;
}

export default function ControlMeasureManager({
  hazardId,
  existingMeasures = [],
  suggestedControls = [],
  onUpdate,
}: ControlMeasureManagerProps) {
  const t = useTranslations("tra.controlMeasures");
  const [expandedMeasures, setExpandedMeasures] = useState<Set<number>>(new Set());
  const [savedMeasures, setSavedMeasures] = useState<Set<number>>(new Set());

  const {
    control,
    register,
    watch,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      measures: existingMeasures.map((m) => ({
        id: m.id,
        type: m.type,
        description: m.description,
        responsiblePerson: m.responsiblePerson || "",
        implementationStatus: m.implementationStatus || ("planned" as ImplementationStatus),
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "measures",
    keyName: "fieldId",
  });

  const toggleExpand = (index: number) => {
    setExpandedMeasures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const saveMeasure = (index: number) => {
    const values = watch();
    const out: ControlMeasure[] =
      (values.measures || []).map((m) => ({
        id: m.id || `${hazardId}-cm-unknown`,
        type: m.type as ControlMeasureType,
        description: m.description || "",
        responsiblePerson: m.responsiblePerson || undefined,
        implementationStatus: (m.implementationStatus as ImplementationStatus) || "planned",
      })) || [];
    
    onUpdate && onUpdate(out);
    setSavedMeasures(prev => new Set(prev).add(index));
    
    // Remove saved indicator after 2 seconds
    setTimeout(() => {
      setSavedMeasures(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }, 2000);
  };

  const addEmpty = () => {
    const newIndex = fields.length;
    append({
      id: `${hazardId}-cm-${Date.now()}`,
      type: "administrative",
      description: "",
      responsiblePerson: "",
      implementationStatus: "planned",
    });
    // Auto-expand the new measure
    setExpandedMeasures(prev => new Set(prev).add(newIndex));
  };

  const addSuggested = (text: string) => {
    const newIndex = fields.length;
    append({
      id: `${hazardId}-cm-${Date.now()}`,
      type: "administrative",
      description: text,
      responsiblePerson: "",
      implementationStatus: "planned",
    });
    // Auto-expand the new measure
    setExpandedMeasures(prev => new Set(prev).add(newIndex));
  };

  return (
    <Card className="border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("title")}</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addEmpty}>
              {t("addCustom")}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Suggested Controls */}
        {suggestedControls && suggestedControls.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-slate-600 mb-2">{t("suggestedTitle")}</div>
            <div className="flex flex-wrap gap-2">
              {suggestedControls.slice(0, 8).map((s, idx) => (
                <div
                  key={`${s}-${idx}`}
                  className="flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-1"
                >
                  <div className="text-sm">{s}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addSuggested(s)}
                    className="ml-2"
                  >
                    {t("add")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls List */}
        <div className="space-y-3">
          {fields.length === 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded">
              <div className="text-sm text-amber-800">{t("noneAdded")}</div>
              <div className="text-xs text-slate-600 mt-1">{t("helpText")}</div>
            </div>
          )}

          {fields.map((field, index) => {
            const isExpanded = expandedMeasures.has(index);
            const isSaved = savedMeasures.has(index);
            const measureValue = watch(`measures.${index}`);
            
            return (
              <div key={field.id} className="border rounded bg-white overflow-hidden">
                {/* Collapsed Header */}
                <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {t(`hierarchy.${measureValue?.type || 'administrative'}`)}
                      </span>
                      {measureValue?.description && (
                        <span className="text-sm text-gray-500 truncate">
                          - {measureValue.description.substring(0, 50)}
                          {measureValue.description.length > 50 ? '...' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSaved && (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <Check className="h-4 w-4" />
                        Opgeslagen
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpand(index)}
                      className="flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          <span className="text-xs">Inklappen</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span className="text-xs">Uitklappen</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-3">
                    <div className="space-y-3">
                      <FormField
                        id={`measures.${index}.type`}
                        label={t("type")}
                        register={register}
                      >
                        <select
                          id={`measures.${index}.type`}
                          {...register(`measures.${index}.type` as const)}
                          className="w-full mt-1 px-2 py-2 border rounded"
                        >
                          {HIERARCHY.map((h) => (
                            <option key={h.key} value={h.key}>
                              {t(`hierarchy.${h.labelKey}`)}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <TextArea
                        id={`measures.${index}.description`}
                        label={t("description")}
                        placeholder={t("descriptionPlaceholder")}
                        register={register}
                        error={errors.measures?.[index]?.description}
                        rows={3}
                      />

                      <FormField
                        id={`measures.${index}.responsiblePerson`}
                        label={t("responsible")}
                        register={register}
                        placeholder={t("responsiblePlaceholder")}
                      />

                      <FormField id={`measures.${index}.implementationStatus`} label={t("status")} register={register}>
                        <select
                          id={`measures.${index}.implementationStatus`}
                          {...register(`measures.${index}.implementationStatus` as const)}
                          className="w-full mt-1 px-2 py-2 border rounded"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {t(`statuses.${s}`)}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => remove(index)}
                          className="flex items-center gap-2"
                        >
                          <Trash className="h-4 w-4" />
                          <span className="text-sm">{t("delete")}</span>
                        </Button>
                        
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => saveMeasure(index)}
                          className="flex items-center gap-2"
                        >
                          <Check className="h-4 w-4" />
                          <span className="text-sm">Opslaan</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Validation / Summary */}
        <div className="mt-4">
          <div className="text-sm text-slate-600">
            {t("summaryCount", { count: fields.length })}
          </div>
          {fields.length === 0 && (
            <div className="text-xs text-red-600 mt-2">{t("validation.minOne")}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}