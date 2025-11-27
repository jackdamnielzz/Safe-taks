"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ArrowLeft } from "lucide-react";

interface ProjectFormData {
  name: string;
  slug: string;
  description: string;
  city: string;
  address: string;
  country: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    slug: "",
    description: "",
    city: "",
    address: "",
    country: "Nederland",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🚀 Form submit triggered", { formData });

    // Basic client-side guard: require project name before sending
    if (!formData.name || formData.name.trim().length < 3) {
      setError("Voer een geldige projectnaam in (minimaal 3 tekens).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Transform form data to match API schema: ProjectCreateSchema
      const payload = {
        name: formData.name.trim(),
        // Let backend generate slug if empty/invalid to avoid client-side mismatch
        slug: formData.slug?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        location:
          formData.city || formData.address || formData.country
            ? {
                city: formData.city?.trim() || undefined,
                address: formData.address?.trim() || undefined,
                country: formData.country?.trim() || undefined,
              }
            : undefined,
      };

      console.log("📤 Sending POST to /api/projects", payload);

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("📥 Response received", { status: response.status, ok: response.ok });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Surface backend validation/subscription errors in UI
        const message =
          data?.error ||
          (Array.isArray(data?.details) && data.details[0]?.message) ||
          `Failed to create project (${response.status})`;
        throw new Error(message);
      }

      console.log("✅ Project created successfully", data);

      // On success, go back to projects list; ProjectsContent will refetch via /api/projects
      router.push("/projects");
    } catch (err) {
      console.error("❌ Error creating project:", err);
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/projects")}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar projecten
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Nieuw Project Aanmaken</h1>
        <p className="text-gray-600 mt-2">
          Maak een nieuw project aan om TRA's en LMRA's te organiseren
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Use a real form submit button to ensure onSubmit is triggered */}
          <form method="post" onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Projectnaam" htmlFor="name" required>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bijv. Bouwproject Amsterdam"
                required
              />
            </FormField>

            <FormField label="Slug" htmlFor="slug">
              <input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="bijv-bouwproject-amsterdam"
              />
              <p className="text-sm text-gray-500 mt-1">
                Wordt automatisch gegenereerd uit de projectnaam
              </p>
            </FormField>

            <FormField label="Beschrijving" htmlFor="description">
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Beschrijf het project..."
              />
            </FormField>

            <FormField label="Stad" htmlFor="city">
              <input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bijv. Amsterdam"
              />
            </FormField>

            <FormField label="Adres" htmlFor="address">
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bijv. Hoofdstraat 123"
              />
            </FormField>

            <FormField label="Land" htmlFor="country">
              <input
                id="country"
                type="text"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nederland"
              />
            </FormField>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading || formData.name.trim().length < 3}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Aanmaken...
                  </>
                ) : (
                  "Project Aanmaken"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/projects")}
                disabled={loading}
              >
                Annuleren
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}