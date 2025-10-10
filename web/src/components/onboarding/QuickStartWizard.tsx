"use client";

import React, { useState } from "react";
import { useForm, Controller, FieldError } from "react-hook-form";
import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";
import { Alert } from "../ui/Alert";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface QuickStartFormData {
  // Step 1: Organization
  organizationName: string;
  organizationSlug: string;
  industry: string;

  // Step 2: Team
  teamMembers: string;

  // Step 3: Project
  projectName: string;
  projectLocation: string;

  // Step 4: First TRA
  traTemplate: string;
}

const INDUSTRIES = [
  { value: "construction", label: "Bouw" },
  { value: "electrical", label: "Elektrotechniek" },
  { value: "plumbing", label: "Loodgieterswerk" },
  { value: "roofing", label: "Dakwerk" },
  { value: "groundwork", label: "Grondwerk" },
  { value: "painting", label: "Schilderwerk" },
  { value: "other", label: "Anders" },
];

interface QuickStartWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function QuickStartWizard({ onComplete, onSkip }: QuickStartWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QuickStartFormData>({
    defaultValues: {
      organizationName: "",
      organizationSlug: "",
      industry: "",
      teamMembers: "",
      projectName: "",
      projectLocation: "",
      traTemplate: "",
    },
  });

  const steps = [
    {
      title: "Organisatie details",
      description: "Vul de basisgegevens van uw organisatie in",
      fields: ["organizationName", "industry"],
    },
    {
      title: "Team toevoegen",
      description: "Nodig teamleden uit voor uw organisatie",
      fields: ["teamMembers"],
    },
    {
      title: "Eerste project",
      description: "Maak uw eerste project aan",
      fields: ["projectName", "projectLocation"],
    },
    {
      title: "Eerste TRA",
      description: "Kies een sjabloon voor uw eerste TRA",
      fields: ["traTemplate"],
    },
  ];

  const organizationName = watch("organizationName");

  // Auto-generate slug from organization name
  React.useEffect(() => {
    if (organizationName && currentStep === 0) {
      const slug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      // Update using setValue if you have it from useForm
    }
  }, [organizationName, currentStep]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: QuickStartFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create organization
      const orgRes = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.organizationName,
          slug: data.organizationSlug,
          settings: { industry: data.industry },
        }),
      });

      if (!orgRes.ok) throw new Error("Failed to create organization");
      const org = await orgRes.json();

      // Step 2: Invite team members if provided
      if (data.teamMembers) {
        const emails = data.teamMembers
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean);
        for (const email of emails) {
          await fetch("/api/invitations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              role: "field_worker",
            }),
          });
        }
      }

      // Step 3: Create project
      if (data.projectName) {
        const projRes = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.projectName,
            location: { address: data.projectLocation },
          }),
        });

        if (!projRes.ok) throw new Error("Failed to create project");
        const project = await projRes.json();

        // Step 4: Create first TRA from template
        if (data.traTemplate) {
          await fetch("/api/tras", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              templateId: data.traTemplate,
              projectId: project.id,
              title: `Eerste TRA - ${data.projectName}`,
              description: "Automatisch aangemaakt via quick start wizard",
            }),
          });
        }
      }

      // Mark wizard as completed
      localStorage.setItem("safework-pro-quickstart-completed", "true");
      onComplete();
    } catch (err) {
      console.error("Quick start wizard error:", err);
      setError(err instanceof Error ? err.message : "Er is een fout opgetreden");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Welkom bij SafeWork Pro</h2>
            <button onClick={onSkip} className="text-gray-500 hover:text-gray-700 text-sm">
              Overslaan
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>
                Stap {currentStep + 1} van {steps.length}
              </span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-900">{steps[currentStep].title}</h3>
            <p className="text-gray-600 text-sm mt-1">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Step 1: Organization */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Controller
                name="organizationName"
                control={control}
                rules={{ required: "Organisatienaam is verplicht" }}
                render={({ field }) => (
                  <FormField
                    label="Organisatienaam"
                    htmlFor="org-name"
                    required
                    error={errors.organizationName}
                  >
                    <input
                      id="org-name"
                      {...field}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Bijv. ABC Bouw BV"
                    />
                  </FormField>
                )}
              />

              <Controller
                name="industry"
                control={control}
                rules={{ required: "Sector is verplicht" }}
                render={({ field }) => (
                  <FormField label="Sector" htmlFor="industry" required error={errors.industry}>
                    <select id="industry" {...field} className="w-full border rounded-lg px-3 py-2">
                      <option value="">Selecteer een sector</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind.value} value={ind.value}>
                          {ind.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                )}
              />
            </div>
          )}

          {/* Step 2: Team */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Controller
                name="teamMembers"
                control={control}
                render={({ field }) => (
                  <FormField label="Teamleden uitnodigen (optioneel)" htmlFor="team-members">
                    <div>
                      <textarea
                        id="team-members"
                        {...field}
                        className="w-full border rounded-lg px-3 py-2"
                        rows={4}
                        placeholder="jan@example.com, maria@example.com"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Voer e-mailadressen in gescheiden door komma's
                      </p>
                    </div>
                  </FormField>
                )}
              />

              <Alert variant="info">
                U kunt later altijd meer teamleden toevoegen via het Team menu.
              </Alert>
            </div>
          )}

          {/* Step 3: Project */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Controller
                name="projectName"
                control={control}
                render={({ field }) => (
                  <FormField label="Projectnaam (optioneel)" htmlFor="project-name">
                    <div>
                      <input
                        id="project-name"
                        {...field}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Bijv. Renovatie Kantoorgebouw A"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        U kunt ook later projecten aanmaken
                      </p>
                    </div>
                  </FormField>
                )}
              />

              <Controller
                name="projectLocation"
                control={control}
                render={({ field }) => (
                  <FormField label="Locatie (optioneel)" htmlFor="project-location">
                    <input
                      id="project-location"
                      {...field}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Bijv. Amsterdam, Nederland"
                    />
                  </FormField>
                )}
              />
            </div>
          )}

          {/* Step 4: First TRA */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Controller
                name="traTemplate"
                control={control}
                render={({ field }) => (
                  <FormField label="Kies een TRA sjabloon (optioneel)" htmlFor="tra-template">
                    <div>
                      <select
                        id="tra-template"
                        {...field}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="">Geen sjabloon</option>
                        <option value="construction">Bouwwerkzaamheden</option>
                        <option value="electrical">Elektrische werkzaamheden</option>
                        <option value="height">Werken op hoogte</option>
                        <option value="confined">Besloten ruimte</option>
                      </select>
                      <p className="text-sm text-gray-500 mt-1">U kunt ook later TRA's aanmaken</p>
                    </div>
                  </FormField>
                )}
              />

              <Alert variant="success">
                U bent bijna klaar! Na voltooiing kunt u direct aan de slag met SafeWork Pro.
              </Alert>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              variant="secondary"
            >
              Vorige
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Volgende
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Bezig...
                  </>
                ) : (
                  "Voltooien"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
