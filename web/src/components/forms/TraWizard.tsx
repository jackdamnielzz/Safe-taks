"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation";
import { FormField } from "../ui/FormField";
import { Button } from "../ui/Button";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Alert } from "../ui/Alert";
import type { CreateTRARequest, TeamMemberInfo } from "../../lib/types/tra";
import { hasRequiredTeamRoles } from "@/lib/types/tra";
import { TraStepBasic } from "./TraWizardStepBasic";
import { TeamMemberSelector } from "./TeamMemberSelector";
import { ProjectSelector } from "../projects/ProjectSelector";
import TemplateSelector from "../templates/TemplateSelector";
import { useAuth } from "../AuthProvider";
import { ComplianceReport } from "../vca/ComplianceReport";
import { calculateVCACompliance } from "@/lib/vca-compliance";

/**
 * Minimal, accessible multi-step TRA wizard.
 * - Debounced autosave to POST /api/tras/draft
 * - Per-step basic client-side validation (using react-hook-form)
 * - Progress bar, step navigation, save status indicator
 *
 * Reuse this component from page at web/src/app/tras/create/page.tsx
 */

type WizardForm = Partial<CreateTRARequest> & {
  // Extended wizard-only fields that backend may enrich later
  teamMembersInfo?: TeamMemberInfo[];
};

const STEPS = ["Start", "Basic", "Steps", "Team", "Review"] as const;
 
export default function TraWizard({ initialData }: { initialData?: WizardForm }) {
  const t = useTranslations("safety.tra.wizard");

  /**
   * Veilige wrapper rond t() zodat ruwe i18n keys nooit direct in de UI terechtkomen.
   * - Als de vertaling ontbreekt en de key zelf terugkomt, gebruiken we de meegegeven fallback.
   */
  const tSafe = (key: string, fallback: string, vars?: Record<string, unknown>) => {
    const value = t(key as any, vars as any);
    const fullKey = `safety.tra.wizard.${key}`;
    if (value === key || value === fullKey) {
      return fallback;
    }
    return value;
  };
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<WizardForm>({
    defaultValues: initialData || { title: "", description: "", taskSteps: [], projectId: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [complianceView, setComplianceView] = useState<"compact" | "detailed">("compact");
  const [stepError, setStepError] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);

  // Start mode: first choose between template or empty
  const [startMode, setStartMode] = useState<"none" | "template" | "empty">("none");

  const stepErrorRef = useRef<HTMLDivElement | null>(null);
  const [stepErrorHighlight, setStepErrorHighlight] = useState(false);

  // Template selection state
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null);
  const [isTemplateLoading, setIsTemplateLoading] = useState<boolean>(false);
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(null);

  const watched = watch();
  const mounted = useRef(false);

  // Load full template data when user selects a templateId
  async function handleTemplateChange(templateId: string | null) {
    // keep templateId in form data
    setValue("templateId", templateId || undefined);
    setSelectedTemplateName(null);
    setTemplateLoadError(null);

    if (!templateId) {
      // user chose "Start from scratch"
      return;
    }

    setIsTemplateLoading(true);
    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(templateId)}`);
      if (!res.ok) throw new Error("Failed to load template");
      const payload = await res.json();
      const tpl = payload?.template ?? payload;

      if (!tpl || !tpl.id) throw new Error("Invalid template data");

      setSelectedTemplateName(tpl.name || tpl.title || tpl.id);

      // Pre-populate form fields (user can still edit)
      setValue("title", tpl.name ?? getValues().title ?? "");
      setValue("description", tpl.description ?? getValues().description ?? "");
      // template may use taskSteps or steps
      setValue("taskSteps", tpl.taskSteps ?? tpl.steps ?? []);
      setValue("templateId", tpl.id);
    } catch (e) {
      console.error("[TraWizard] template load failed", e);
      setTemplateLoadError((e as any)?.message || String(e));
    } finally {
      setIsTemplateLoading(false);
    }
  }

  // Calculate VCA compliance in real-time
  const complianceResult = React.useMemo(() => {
    const currentData = getValues();

    // Build TRA object for compliance checking
    // Cast as any since we're in draft mode and don't have all required TRA fields yet
    const traForCompliance = {
      id: "draft",
      title: currentData.title || "",
      description: currentData.description || "",
      organizationId: "draft-org", // Placeholder for draft
      projectId: currentData.projectId || "",
      taskSteps: (currentData.taskSteps || []).map((step) => ({
        ...step,
        hazards: (step as any).hazards || [],
      })),
      teamMembers: currentData.teamMembers || [],
      requiredCompetencies: currentData.requiredCompetencies || [],
      status: "draft" as const,
      createdBy: "",
      createdAt: new Date(),
      overallRiskScore: 0,
      overallRiskLevel: "trivial" as const,
      version: 1,
      complianceFramework: currentData.complianceFramework || ("vca" as const),
    } as any; // Type assertion needed for draft TRA

    return calculateVCACompliance(traForCompliance);
  }, [
    watched.title,
    watched.description,
    watched.taskSteps,
    watched.teamMembers,
    watched.requiredCompetencies,
    watched.complianceFramework,
  ]);

  // Debounced autosave - TEMPORARILY DISABLED FOR TESTING
  // Change AUTOSAVE_DELAY to adjust timing or set to null to disable
  const AUTOSAVE_DELAY: number | null = null; // DISABLED - set to 10000 to re-enable
  
  const autosave = useRef(
    debounce(async (payload: WizardForm) => {
      if (!AUTOSAVE_DELAY) return; // Skip autosave if disabled
      try {
        setSaveStatus("saving");
        const res = await fetch("/api/tras/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to save draft");
        setSaveStatus("saved");
        // Auto-clear saved status after 3 seconds
        setTimeout(() => setSaveStatus("idle"), 3000);
      } catch (e) {
        console.error(e);
        setSaveStatus("failed");
      }
    }, AUTOSAVE_DELAY || 10000)
  ).current;

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    // Auto-save is disabled - no action taken
    if (AUTOSAVE_DELAY) {
      autosave(getValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched]);

  useEffect(() => {
    return () => {
      autosave.flush();
    };
  }, [autosave]);

  useEffect(() => {
    if (stepError && stepErrorRef.current && typeof window !== "undefined") {
      const element = stepErrorRef.current;
      const rect = element.getBoundingClientRect();
      const scrollTop = window.scrollY || window.pageYOffset;

      // Scroll so that the banner ruim bovenaan in beeld komt, met nog wat extra marge
      const targetY = rect.top + scrollTop - 220; // 220px marge boven het blok

      window.scrollTo({
        top: targetY < 0 ? 0 : targetY,
        behavior: "smooth",
      });

      // Highlight pas even ná het starten van de scroll
      let clearHighlightTimeout: number | undefined;
      const highlightTimeout = window.setTimeout(() => {
        setStepErrorHighlight(true);
        clearHighlightTimeout = window.setTimeout(
          () => setStepErrorHighlight(false),
          600
        );
      }, 250);

      return () => {
        window.clearTimeout(highlightTimeout);
        if (clearHighlightTimeout) {
          window.clearTimeout(clearHighlightTimeout);
        }
      };
    }
  }, [stepError]);
 
  async function handleNext() {
    // Step-specific validation before moving forward
    if (stepIndex === 0) {
      // Start mode selection: user must pick template or empty before continuing
      if (startMode === "none") {
        setStepError(
          "Kies eerst hoe je wilt beginnen: met een TRA-sjabloon of met een lege TRA die je zelf invult."
        );
        return;
      }
      setStepError(null);
    } else if (stepIndex === 1) {
      // Basic info: title + projectId
      const basicValid = await trigger(["title", "projectId"]);
      if (!basicValid) {
        setStepError(
          tSafe(
            "validationMessage",
            "Vul eerst de verplichte velden (titel en project) in voordat je verder gaat."
          )
        );
        return;
      }
      setStepError(null);
    } else if (stepIndex === 2) {
      // Task steps + hazards + basic controls
      const stepsValid = validateTaskSteps();
      if (!stepsValid) {
        return;
      }
    } else if (stepIndex === 3) {
      // Team members + required roles
      const teamValid = validateTeamSection();
      if (!teamValid) {
        return;
      }
    }

    setStepIndex((s) => Math.min(s + 1, STEPS.length - 1));
  }
 
  function prev() {
    setStepIndex((s) => Math.max(s - 1, 0));
  }

  function validateTaskSteps(): boolean {
    const steps = getValues().taskSteps || [];
    const messages: string[] = [];
 
    if (!steps.length) {
      const friendly = tSafe(
        "validation.stepsRequired",
        "Voeg minimaal één taakstap toe voordat je verder gaat."
      );
      messages.push(friendly);
    }
 
    steps.forEach((step: any, index: number) => {
      const stepNumber = index + 1;
 
      if (!step.description || step.description.trim().length < 5) {
        messages.push(
          tSafe(
            "validation.stepDescriptionMin",
            `Stap ${stepNumber}: vul een duidelijke omschrijving in (minimaal 5 tekens).`,
            { step: stepNumber }
          )
        );
      }
 
      const hazards = Array.isArray(step.hazards) ? step.hazards : [];
      if (hazards.length === 0) {
        messages.push(
          tSafe(
            "validation.stepHasNoHazards",
            `Stap ${stepNumber}: selecteer minimaal één gevaar voor deze taakstap.`,
            { step: stepNumber }
          )
        );
      } else {
        const hasHazardWithoutControls = hazards.some(
          (h: any) => !Array.isArray(h.controlMeasures) || h.controlMeasures.length === 0
        );
        if (hasHazardWithoutControls) {
          messages.push(
            tSafe(
              "validation.hazardMissingControls",
              `Stap ${stepNumber}: voeg voor elk gevaar minstens één beheersmaatregel toe.`,
              { step: stepNumber }
            )
          );
        }
      }
    });

    // At least one task step must be explicitly afgerond
    const hasCompletedStep = steps.some((step: any) => step?.status === "completed");
    if (!hasCompletedStep) {
      messages.push(
        "Rond minimaal één taakstap af met de knop 'Stap afronden' voordat je verder gaat."
      );
    }
 
    if (messages.length > 0) {
      setStepError(messages.join(" "));
      return false;
    }
 
    setStepError(null);
    return true;
  }

  function validateTeamSection(): boolean {
    const current = getValues() as WizardForm;
    const members: string[] = current.teamMembers || [];
    const membersInfo: TeamMemberInfo[] = current.teamMembersInfo || [];
 
    if (!members.length) {
      setTeamError(
        tSafe(
          "review.memberRequired",
          "Voeg minimaal één teamlid toe dat deze TRA ontvangt."
        )
      );
      return false;
    }
 
    if (membersInfo.length > 0 && !hasRequiredTeamRoles(membersInfo)) {
      setTeamError(
        tSafe(
          "validation.teamRoleRequired",
          "Wijs de vereiste teamrollen toe (bijvoorbeeld werkverantwoordelijke, uitvoerder en veiligheidskundige)."
        )
      );
      return false;
    }
 
    setTeamError(null);
    return true;
  }

  async function handleFinalSubmit(data: WizardForm) {
    // Re-run validation for all required sections before final submit
    const basicValid = await trigger(["title", "projectId"]);
    const stepsValid = validateTaskSteps();
    const teamValid = validateTeamSection();
 
    if (!basicValid || !stepsValid || !teamValid) {
      return;
    }
 
    await onSubmit(data);
  }

  async function handleExplicitDraftSave() {
    const payload = getValues();
    try {
      setSaveStatus("saving");
      const res = await fetch("/api/tras/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save draft");
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (e) {
      console.error(e);
      setSaveStatus("failed");
    }
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main wizard form */}
      <form
        onSubmit={handleSubmit(handleFinalSubmit)}
        aria-labelledby="tra-wizard-title"
        className="lg:col-span-2 bg-white p-6 rounded shadow-sm"
      >
        <div className="mb-4">
          <h2 id="tra-wizard-title" className="text-xl font-semibold">
            {t("createTitle", { step: stepIndex + 1, total: STEPS.length })}
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
          {/* Step-level validation error for the current step */}
          {stepIndex === 0 && stepError && (
            <div
              ref={stepErrorRef}
              data-testid="tra-step-error"
              data-cy="tra-step-error"
              className={stepErrorHighlight ? "tra-step-error-highlight" : undefined}
            >
              <Alert variant="error" className="mb-2">
                {stepError}
              </Alert>
            </div>
          )}

          {/* NEW: Step 0 – choose how to start (template vs empty) */}
          {stepIndex === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Kies eerst hoe je de TRA wilt starten. Je kunt beginnen met een bestaand TRA-sjabloon
                (voorgedefinieerde stappen en gevaren), of een volledig lege TRA openen en alles zelf
                invullen.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setStartMode("template");
                    setStepError(null);
                  }}
                  className={`border rounded-lg p-4 text-left transition-colors ${
                    startMode === "template"
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                  }`}
                >
                  <h3 className="font-semibold mb-1">Start met TRA-sjabloon</h3>
                  <p className="text-sm text-slate-600">
                    Bekijk de beschikbare sjablonen en gebruik één als basis. Je kunt daarna alles
                    nog aanpassen.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStartMode("empty");
                    setValue("templateId", undefined);
                    setStepError(null);
                  }}
                  className={`border rounded-lg p-4 text-left transition-colors ${
                    startMode === "empty"
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                  }`}
                >
                  <h3 className="font-semibold mb-1">Begin met lege TRA</h3>
                  <p className="text-sm text-slate-600">
                    Begin zonder sjabloon en vul zelf stap voor stap alle informatie in, net als een
                    leeg document in Word.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Step 1 – optional template selector (only when user chose template flow) */}
          {stepIndex === 1 && startMode === "template" && (
            <TemplateSelector
              value={getValues().templateId}
              onChange={(id) => {
                // handle selection (includes "start from scratch" -> null)
                handleTemplateChange(id);
              }}
              organizationId={userProfile?.organizationId || ""}
            />
          )}

          {/* Step 1 – basic info fields */}
          {stepIndex === 1 && (
            <Controller
              name="title"
              control={control}
              rules={{
                // Gebruik een vaste Nederlandse tekst i.p.v. een i18n key om MISSING_MESSAGE te voorkomen
                required: "Dit veld is verplicht",
                validate: (value) =>
                  (value && value.trim().length >= 5) ||
                  "Titel moet minimaal 5 tekens bevatten",
              }}
              render={({ field }) => (
                <FormField
                  label={t("titleLabel")}
                  htmlFor="tra-title"
                  required
                  error={errors.title as any}
                >
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

          {/* Indicator that title/description may be from a template */}
          {stepIndex === 1 && getValues().templateId && (
            <div className="text-sm text-gray-600 space-y-2">
              {isTemplateLoading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner /> {t("templates.loading")}
                </span>
              ) : templateLoadError ? (
                <span className="text-red-600">{t("templates.loadError")}: {templateLoadError}</span>
              ) : (
                <div className="flex items-center justify-between">
                  <span>{t("templates.selectedIndicator", { name: selectedTemplateName || "" })}</span>
                  <button
                    type="button"
                    onClick={() => handleTemplateChange(getValues().templateId!)}
                    className="text-blue-600 hover:text-blue-800 underline text-sm"
                    disabled={isTemplateLoading}
                  >
                    {t("templates.resetToTemplate")}
                  </button>
                </div>
              )}
            </div>
          )}

          {stepIndex === 1 && (
            <Controller
              name="description"
              control={control}
              rules={{
                // Gebruik een vaste Nederlandse tekst om MISSING_MESSAGE te voorkomen
                validate: (value) =>
                  !value ||
                  value.trim().length >= 10 ||
                  "Beschrijving moet minimaal 10 tekens bevatten",
              }}
              render={({ field }) => (
                <FormField
                  label={t("descriptionLabel")}
                  htmlFor="tra-description"
                  error={errors.description as any}
                >
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

          {stepIndex === 0 && (
            <div className="space-y-2">
              <Controller
                name="projectId"
                control={control}
                rules={{
                  required: tSafe(
                    "projectRequired",
                    "Selecteer een project voordat je verder gaat."
                  ),
                }}
                render={({ field }) => (
                  <ProjectSelector
                    value={field.value}
                    onChange={field.onChange}
                    organizationId={userProfile?.organizationId || ""}
                    error={errors?.projectId?.message as string}
                    required
                  />
                )}
              />
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span>Nog geen geschikt project?</span>
                <button
                  type="button"
                  onClick={() => {
                    // Navigate to project creation so user can add a project from this context
                    // Using window.location to avoid importing router here and keep wizard simple.
                    if (typeof window !== "undefined") {
                      window.location.href = "/projects/create";
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                >
                  <span className="text-base leading-none">+</span>
                  <span>Nieuw project aanmaken</span>
                </button>
              </div>
            </div>
          )}

          {stepIndex === 2 && (
            <>
              <TraStepBasic
                control={control}
                setValue={setValue}
                currentSteps={getValues().taskSteps || []}
              />
              {stepError && (
                <p className="mt-2 text-sm text-red-600" data-cy="tra-steps-error">
                  {stepError}
                </p>
              )}
            </>
          )}

          {stepIndex === 3 && (
            <>
              <TeamMemberSelector
                control={control}
                setValue={setValue}
                getValues={getValues}
              />
              {teamError && (
                <p className="mt-2 text-sm text-red-600" data-cy="tra-team-error">
                  {teamError}
                </p>
              )}
            </>
          )}

          {stepIndex === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">{t("review.title")}</h3>

              {/* Basic Info */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-medium text-slate-700 mb-2">{t("review.basicInfo")}</h4>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-slate-600">{t("review.titleField")}</dt>
                    <dd className="font-medium">
                      {getValues().title || (
                        <span className="text-slate-400">{t("review.notFilled")}</span>
                      )}
                    </dd>
                  </div>
                  {getValues().description && (
                    <div>
                      <dt className="text-sm text-slate-600">{t("review.descriptionField")}</dt>
                      <dd className="text-sm">{getValues().description}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Task Steps */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-medium text-slate-700 mb-2">{t("review.taskSteps")}</h4>
                {(() => {
                  const steps = getValues().taskSteps;
                  return steps?.length ? (
                    <p className="text-sm">
                      {t("review.stepsAdded", {
                        count: steps.length,
                        plural:
                          steps.length === 1 ? t("review.stepSingular") : t("review.stepPlural"),
                      })}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400">{t("review.noSteps")}</p>
                  );
                })()}
              </div>

              {/* Team Members */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-medium text-slate-700 mb-2">{t("review.teamMembers")}</h4>
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
                    <p className="text-sm text-amber-600">{t("review.addMemberWarning")}</p>
                  );
                })()}
              </div>

              {/* Validation Warning */}
              {(!getValues().title ||
                !getValues().projectId ||
                !getValues().teamMembers ||
                getValues().teamMembers?.length === 0) && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>{t("review.validationWarning")}</strong> {t("review.validationMessage")}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-700">
                    {!getValues().title && <li>{t("review.titleRequired")}</li>}
                    {!getValues().projectId && <li>{t("projectRequired")}</li>}
                    {(!getValues().teamMembers || getValues().teamMembers?.length === 0) && (
                      <li>{t("review.memberRequired")}</li>
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
              {t("back")}
            </button>

            {stepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                {t("next")}
              </button>
            ) : (
              <Button type="submit">{t("createButton")}</Button>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600">
            <button
              type="button"
              onClick={handleExplicitDraftSave}
              className="px-3 py-2 rounded border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            >
              Wijzigingen opslaan
            </button>
            {saveStatus === "saving" && (
              <span className="flex items-center gap-2">
                <LoadingSpinner /> {t("saving")}
              </span>
            )}
            {saveStatus === "saved" && <span aria-live="polite">{t("saved")}</span>}
            {saveStatus === "failed" && <span className="text-red-600">{t("saveFailed")}</span>}
          </div>
        </div>
      </form>

      {/* VCA Compliance Sidebar */}
      <aside className="lg:col-span-1">
        <div className="sticky top-6 space-y-4">
          {/* Compliance Report */}
          <ComplianceReport
            result={complianceResult}
            variant={complianceView}
            className="mb-4"
          />

          {/* Toggle View Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setComplianceView(complianceView === "compact" ? "detailed" : "compact")}
            className="w-full"
          >
            {complianceView === "compact"
              ? t("compliance.toggleDetails")
              : t("compliance.hideDetails")}
          </Button>

          {/* Quick tips - only show in compact mode */}
          {complianceView === "compact" && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-black mb-2">
                {t("compliance.tipsTitle")}
              </h3>
              <ul className="space-y-2 text-xs text-black">
                <li>{t("compliance.tip1")}</li>
                <li>{t("compliance.tip2")}</li>
                <li>{t("compliance.tip3")}</li>
                <li>{t("compliance.tip4")}</li>
                <li>{t("compliance.tip5")}</li>
              </ul>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
