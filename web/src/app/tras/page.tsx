"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, ProtectedRoute, useAuth } from "../../components/AuthProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Modal } from "../../components/ui/Modal";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import TraWizard from "../../components/forms/TraWizard";
import type { TRA } from "../../lib/types/tra";

/**
 * Enhanced TRAs page with full functionality
 * - Create new TRAs with the wizard
 * - List and manage existing TRAs
 * - Filter and search capabilities
 * - Proper Dutch localization
 */

interface TRAsResponse {
  tras: TRA[];
  totalCount: number;
}

function TRAsContent() {
  const { user, userProfile } = useAuth();
  const router = useRouter();

  // State management
  const [tras, setTras] = useState<TRA[]>([]);
  const [filteredTras, setFilteredTras] = useState<TRA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load TRAs on mount
  useEffect(() => {
    loadTRAs();
  }, []);

  // Filter TRAs when search or filter changes
  useEffect(() => {
    filterTRAs();
  }, [tras, searchQuery, statusFilter]);

  /**
   * Load TRAs from API
   */
  const loadTRAs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/tras");
      if (!response.ok) {
        throw new Error(`Failed to load TRAs: ${response.statusText}`);
      }

      const data: TRAsResponse = await response.json();
      setTras(data.tras);
    } catch (err) {
      console.error("Error loading TRAs:", err);
      setError(err instanceof Error ? err.message : "Failed to load TRAs");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter TRAs based on search and status
   */
  const filterTRAs = () => {
    if (!tras) return; // Guard against undefined tras
    let filtered = tras;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (tra) =>
          tra.title.toLowerCase().includes(query) ||
          tra.description?.toLowerCase().includes(query) ||
          tra.status?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((tra) => tra.status === statusFilter);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => {
      const aTime =
        a.createdAt && typeof a.createdAt === "object" && "seconds" in a.createdAt
          ? a.createdAt.seconds * 1000
          : new Date(a.createdAt as any).getTime();
      const bTime =
        b.createdAt && typeof b.createdAt === "object" && "seconds" in b.createdAt
          ? b.createdAt.seconds * 1000
          : new Date(b.createdAt as any).getTime();
      return bTime - aTime;
    });

    setFilteredTras(filtered);
  };

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      draft: {
        color: "bg-gray-100 text-gray-800",
        label: "Concept",
        icon: <Edit className="w-3 h-3" />,
      },
      active: {
        color: "bg-green-100 text-green-800",
        label: "Actief",
        icon: <CheckCircle className="w-3 h-3" />,
      },
      completed: {
        color: "bg-blue-100 text-blue-800",
        label: "Voltooid",
        icon: <CheckCircle className="w-3 h-3" />,
      },
      archived: {
        color: "bg-red-100 text-red-800",
        label: "Gearchiveerd",
        icon: <AlertTriangle className="w-3 h-3" />,
      },
    };

    const statusInfo = statusMap[status] || {
      color: "bg-gray-100 text-gray-800",
      label: status,
      icon: null,
    };

    return (
      <Badge className={`${statusInfo.color} gap-1`}>
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  /**
   * Handle TRA creation modal close
   */
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    // Refresh the list after a short delay to allow for server processing
    setTimeout(() => {
      loadTRAs();
    }, 1000);
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
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error laden TRAs</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadTRAs}>Probeer opnieuw</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">TRA's — Taak Risico Analyses</h1>
            <p className="text-gray-600 mt-2">
              {filteredTras.length} van {tras?.length || 0} TRA's
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nieuwe TRA
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Zoek TRA's..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Alle Status</option>
          <option value="draft">Concept</option>
          <option value="active">Actief</option>
          <option value="completed">Voltooid</option>
          <option value="archived">Gearchiveerd</option>
        </select>
      </div>

      {/* TRAs Grid */}
      {filteredTras.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <AlertTriangle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || statusFilter !== "all" ? "Geen TRA's gevonden" : "Geen TRA's nog"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== "all"
              ? "Probeer uw zoekopdracht aan te passen of de filters te wijzigen."
              : "Maak uw eerste TRA aan om te beginnen met risicoanalyses."}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Eerste TRA Aanmaken
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTras.map((tra) => (
            <Card
              key={tra.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/tras/${tra.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{tra.title}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {tra.description || "Geen beschrijving beschikbaar"}
                    </CardDescription>
                  </div>
                  <div className="ml-2">{getStatusBadge(tra.status || "draft")}</div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Task steps count */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Stappen: {tra.taskSteps?.length || 0}</span>
                </div>

                {/* Team members */}
                {tra.teamMembers && tra.teamMembers.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{tra.teamMembers.length} teamleden</span>
                  </div>
                )}

                {/* Created date */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Aangemaakt:{" "}
                    {tra.createdAt
                      ? typeof tra.createdAt === "object" && "seconds" in tra.createdAt
                        ? new Date(tra.createdAt.seconds * 1000).toLocaleDateString("nl-NL")
                        : new Date(tra.createdAt as any).toLocaleDateString("nl-NL")
                      : "Onbekend"}
                  </span>
                </div>

                {/* Last modified */}
                {tra.updatedAt && (
                  <div className="text-xs text-gray-500">
                    Laatst gewijzigd:{" "}
                    {typeof tra.updatedAt === "object" && "seconds" in tra.updatedAt
                      ? new Date(tra.updatedAt.seconds * 1000).toLocaleDateString("nl-NL")
                      : new Date(tra.updatedAt as any).toLocaleDateString("nl-NL")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create TRA Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        title="Nieuwe TRA Aanmaken"
        size="lg"
      >
        <TraWizard />
      </Modal>
    </div>
  );
}

export default function TRAsPageWrapper() {
  return (
    <AuthProvider>
      <ProtectedRoute
        fallback={
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto text-center">
              <h2 className="text-xl font-semibold mb-4">Inloggen vereist</h2>
              <p className="text-gray-600 mb-6">
                Deze pagina vereist authenticatie. Log in om door te gaan.
              </p>
              <Button onClick={() => (window.location.href = "/account/signin")}>Inloggen</Button>
            </div>
          </div>
        }
      >
        <TRAsContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}
