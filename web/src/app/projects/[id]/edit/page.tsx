"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    slug: "",
    description: "",
    city: "",
    address: "",
    country: "Nederland",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error("Project niet gevonden");
        }
        const data = await response.json();
        
        setFormData({
          name: data.name || "",
          slug: data.slug || "",
          description: data.description || "",
          city: data.location?.city || "",
          address: data.location?.address || "",
          country: data.location?.country || "Nederland",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fout bij laden project");
      } finally {
        setFetching(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.name.trim().length < 3) {
      setError("Voer een geldige projectnaam in (minimaal 3 tekens).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
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

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data?.error || `Fout bij bijwerken project (${response.status})`;
        throw new Error(message);
      }

      router.push("/projects");
    } catch (err) {
      console.error("❌ Error updating project:", err);
      setError(err instanceof Error ? err.message : "Fout bij bijwerken project");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
          <span className="ml-3 text-gray-600">Project laden...</span>
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Project Bewerken</h1>
        <p className="text-gray-600 mt-2">
          Wijzig de projectgegevens
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Projectnaam" htmlFor="name" required>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
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
                URL-vriendelijke naam voor het project
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
                    Opslaan...
                  </>
                ) : (
                  "Wijzigingen Opslaan"
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