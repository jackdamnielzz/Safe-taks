"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { crmService } from "@/lib/services/crm-service";
import { LeadCaptureForm as LeadCaptureFormType } from "@/lib/types/lead";
import { useTranslation } from "@/hooks/useTranslation";

// Simple checkbox component
function Checkbox({
  id,
  checked,
  onChange,
  className = "",
}: {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${className}`}
    />
  );
}

interface LeadCaptureFormProps {
  title?: string;
  description?: string;
  source?: string;
  interests?: string[];
  showCompanyFields?: boolean;
  showPhoneField?: boolean;
  submitButtonText?: string;
  onSuccess?: (lead: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

/**
 * Lead capture form component for email signup and CRM integration
 */
export function LeadCaptureForm({
  title = "Blijf op de hoogte",
  description = "Ontvang updates over SafeWork Pro en digitale veiligheid",
  source,
  interests = [],
  showCompanyFields = true,
  showPhoneField = false,
  submitButtonText = "Aanmelden",
  onSuccess,
  onError,
  className = "",
}: LeadCaptureFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<LeadCaptureFormType>({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    phone: "",
    jobTitle: "",
    companySize: "",
    industry: "",
    interests,
    gdprConsent: false,
    marketingConsent: true,
    source,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof LeadCaptureFormType, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.gdprConsent) {
      setError("E-mailadres en GDPR toestemming zijn verplicht.");
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Voer een geldig e-mailadres in.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Track the form submission
      crmService.trackCTA("newsletter_signup", formData.email);

      // Capture the lead
      const lead = await crmService.captureLead(formData, source);

      setIsSuccess(true);
      onSuccess?.(lead);

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          email: "",
          firstName: "",
          lastName: "",
          company: "",
          phone: "",
          jobTitle: "",
          companySize: "",
          industry: "",
          interests,
          gdprConsent: false,
          marketingConsent: true,
          source,
        });
        setIsSuccess(false);
      }, 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Er is iets misgegaan. Probeer het opnieuw.";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="success">
            <div className="text-center">
              <h3 className="font-semibold text-green-800 mb-2">Bedankt voor uw aanmelding!</h3>
              <p className="text-green-700">
                We hebben uw gegevens ontvangen en nemen snel contact met u op.
              </p>
            </div>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Voornaam
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Uw voornaam"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Achternaam
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Uw achternaam"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mailadres <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="uw@email.nl"
            />
          </div>

          {/* Company Fields */}
          {showCompanyFields && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrijf
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Bedrijfsnaam"
                  />
                </div>

                <div>
                  <label
                    htmlFor="jobTitle"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Functie
                  </label>
                  <input
                    type="text"
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Uw functie"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="companySize"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Bedrijfsgrootte
                  </label>
                  <select
                    id="companySize"
                    value={formData.companySize}
                    onChange={(e) => handleInputChange("companySize", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecteer...</option>
                    <option value="1-10">1-10 medewerkers</option>
                    <option value="11-50">11-50 medewerkers</option>
                    <option value="51-200">51-200 medewerkers</option>
                    <option value="201-500">201-500 medewerkers</option>
                    <option value="500+">500+ medewerkers</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="industry"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Branche
                  </label>
                  <select
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleInputChange("industry", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecteer...</option>
                    <option value="bouw">Bouw</option>
                    <option value="infrastructuur">Infrastructuur</option>
                    <option value="industrie">Industrie</option>
                    <option value="energie">Energie</option>
                    <option value="chemie">Chemie</option>
                    <option value="transport">Transport & Logistiek</option>
                    <option value="anders">Anders</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Phone Field */}
          {showPhoneField && (
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefoonnummer
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+31 6 12345678"
              />
            </div>
          )}

          {/* GDPR Consent */}
          <div className="space-y-3">
            <div className="flex items-start">
              <Checkbox
                id="gdprConsent"
                checked={formData.gdprConsent}
                onChange={(checked) => handleInputChange("gdprConsent", checked)}
                className="mt-1"
              />
              <label htmlFor="gdprConsent" className="ml-2 text-sm text-gray-700">
                Ik ga akkoord met de{" "}
                <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                  privacyverklaring
                </a>{" "}
                en geef toestemming voor de verwerking van mijn gegevens.{" "}
                <span className="text-red-500">*</span>
              </label>
            </div>

            <div className="flex items-start">
              <Checkbox
                id="marketingConsent"
                checked={formData.marketingConsent}
                onChange={(checked) => handleInputChange("marketingConsent", checked)}
                className="mt-1"
              />
              <label htmlFor="marketingConsent" className="ml-2 text-sm text-gray-700">
                Ik wil graag nieuwsbrieven en updates ontvangen over SafeWork Pro en veiligheid.
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && <Alert variant="error">{error}</Alert>}

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting || !formData.gdprConsent} className="w-full">
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Bezig met verzenden...
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
