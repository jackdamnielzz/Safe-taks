"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { Plus, Search, Filter, Edit, Users, MapPin, Calendar, Activity } from "lucide-react";
import { Project, ProjectMemberRole } from "@/lib/types/project";
import { useTranslation } from "@/hooks/useTranslation";

interface ProjectsResponse {
  projects: Project[];
}

/**
 * Projects List Page
 * Displays all projects for the current organization with filtering and search capabilities
 */
export default function ProjectsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Filter projects when search or filter changes
  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, showActiveOnly]);

  /**
   * Load projects from API
   */
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error(`Failed to load projects: ${response.statusText}`);
      }

      const data: ProjectsResponse = await response.json();
      setProjects(data.projects);
    } catch (err) {
      console.error("Error loading projects:", err);
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enhanced search and filter projects with multiple criteria
   */
  const filterProjects = () => {
    let filtered = projects;

    // Enhanced search query - search in multiple fields with ranking
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((project) => {
        const searchFields = [];

        // Primary search fields (weighted higher)
        if (project.name) searchFields.push({ text: project.name, weight: 3 });
        if (project.description) searchFields.push({ text: project.description, weight: 2 });

        // Secondary search fields
        if (project.location?.city) searchFields.push({ text: project.location.city, weight: 1 });
        if (project.location?.address)
          searchFields.push({ text: project.location.address, weight: 1 });
        if (project.location?.country)
          searchFields.push({ text: project.location.country, weight: 1 });

        // Search in team member names
        if (project.membersSummary) {
          const memberNames = project.membersSummary
            .map((member) => member.displayName || member.uid)
            .filter(Boolean)
            .join(" ");
          if (memberNames) searchFields.push({ text: memberNames, weight: 1 });
        }

        // Check if any field contains the query
        return searchFields.some((field) => {
          const text = field.text.toLowerCase();
          return text.includes(query) || query.split(" ").every((word) => text.includes(word)); // Partial word matching
        });
      });
    }

    // Filter by active status
    if (showActiveOnly) {
      filtered = filtered.filter((project) => project.isActive !== false);
    }

    // Enhanced sorting for better UX
    filtered.sort((a, b) => {
      // Prioritize exact name matches when searching
      if (searchQuery.trim()) {
        const aNameMatch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0;
        const bNameMatch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0;

        if (aNameMatch !== bNameMatch) {
          return bNameMatch - aNameMatch; // Exact matches first
        }
      }

      // Then sort by last activity (most recent first)
      if (a.stats?.lastActivityAt && b.stats?.lastActivityAt) {
        const aTime =
          typeof a.stats.lastActivityAt === "object" && "seconds" in a.stats.lastActivityAt
            ? a.stats.lastActivityAt.seconds * 1000
            : new Date(a.stats.lastActivityAt).getTime();

        const bTime =
          typeof b.stats.lastActivityAt === "object" && "seconds" in b.stats.lastActivityAt
            ? b.stats.lastActivityAt.seconds * 1000
            : new Date(b.stats.lastActivityAt).getTime();

        return bTime - aTime;
      }

      // Finally sort by creation date (newest first)
      const aCreated =
        typeof a.createdAt === "object" && "seconds" in a.createdAt
          ? a.createdAt.seconds * 1000
          : new Date(a.createdAt as any).getTime();
      const bCreated =
        typeof b.createdAt === "object" && "seconds" in b.createdAt
          ? b.createdAt.seconds * 1000
          : new Date(b.createdAt as any).getTime();
      return bCreated - aCreated;
    });

    setFilteredProjects(filtered);
  };

  /**
   * Handle project creation
   */
  const handleCreateProject = () => {
    router.push("/projects/create");
  };

  /**
   * Handle project editing
   */
  const handleEditProject = (projectId: string) => {
    router.push(`/projects/${projectId}/edit`);
  };

  /**
   * Handle project members management
   */
  const handleManageMembers = (projectId: string) => {
    router.push(`/projects/${projectId}/members`);
  };

  /**
   * Get member role badge color
   */
  const getRoleBadgeColor = (role: ProjectMemberRole): string => {
    const colors: Record<ProjectMemberRole, string> = {
      owner: "bg-red-100 text-red-800",
      manager: "bg-blue-100 text-blue-800",
      contributor: "bg-green-100 text-green-800",
      reader: "bg-gray-100 text-gray-800",
    };
    return colors[role];
  };

  /**
   * Format project location
   */
  const formatLocation = (location?: Project["location"]): string => {
    if (!location) return "";

    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.country) parts.push(location.country);
    return parts.join(", ");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">
          <div>
            {error}
            <Button variant="outline" size="sm" className="ml-2" onClick={loadProjects}>
              Probeer opnieuw
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Projecten
              <HelpTooltip content="Beheer uw projecten en teamleden voor georganiseerde TRA/LMRA workflows" />
            </h1>
            <p className="text-gray-600 mt-2">
              {filteredProjects.length} van {projects.length} projecten
            </p>
          </div>
          <Button onClick={handleCreateProject} className="gap-2">
            <Plus className="h-4 w-4" />
            Nieuw Project
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Zoek projecten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <Button
          variant={showActiveOnly ? "primary" : "outline"}
          onClick={() => setShowActiveOnly(!showActiveOnly)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {showActiveOnly ? "Alle Projecten" : "Alleen Actieve"}
        </Button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Activity className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen projecten gevonden</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || !showActiveOnly
              ? "Probeer uw zoekopdracht aan te passen of de filters te wijzigen."
              : "Maak uw eerste project aan om te beginnen met TRA en LMRA workflows."}
          </p>
          {!searchQuery && showActiveOnly && (
            <Button onClick={handleCreateProject} className="gap-2">
              <Plus className="h-4 w-4" />
              Eerste Project Aanmaken
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {project.description || "Geen beschrijving beschikbaar"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProject(project.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageMembers(project.id)}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Location */}
                {project.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{formatLocation(project.location)}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{project.memberCount || 0} leden</span>
                  </div>
                  {project.stats?.trasCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <span>{project.stats.trasCount} TRA's</span>
                    </div>
                  )}
                </div>

                {/* Last activity */}
                {project.stats?.lastActivityAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Laatste activiteit:{" "}
                      {new Date(
                        typeof project.stats.lastActivityAt === "object" &&
                        "seconds" in project.stats.lastActivityAt
                          ? project.stats.lastActivityAt.seconds * 1000
                          : (project.stats.lastActivityAt as any)
                      ).toLocaleDateString("nl-NL")}
                    </span>
                  </div>
                )}

                {/* Status badge */}
                {!project.isActive && (
                  <Badge variant="secondary" className="w-fit">
                    Inactief
                  </Badge>
                )}

                {/* Member roles preview */}
                {project.membersSummary && project.membersSummary.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.membersSummary.slice(0, 3).map((member) => (
                      <Badge
                        key={member.uid}
                        variant="default"
                        className={`text-xs ${getRoleBadgeColor(member.role)}`}
                      >
                        {member.displayName || member.uid}
                      </Badge>
                    ))}
                    {project.membersSummary.length > 3 && (
                      <Badge variant="default" className="text-xs">
                        +{project.membersSummary.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
