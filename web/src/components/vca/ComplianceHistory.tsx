/**
 * ComplianceHistory Component
 *
 * Displays compliance history for a specific TRA
 */

"use client";

import { useEffect, useState } from "react";
import type { ComplianceHistory } from "@/types/compliance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface ComplianceHistoryProps {
  traId: string;
  limit?: number;
}

export function ComplianceHistory({ traId, limit = 10 }: ComplianceHistoryProps) {
  const [history, setHistory] = useState<ComplianceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const response = await fetch(`/api/compliance/history/${traId}?limit=${limit}`);

        if (!response.ok) {
          throw new Error("Failed to fetch compliance history");
        }

        const data = await response.json();
        setHistory(data.history || []);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (traId) {
      fetchHistory();
    }
  }, [traId, limit]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>VCA Compliance Geschiedenis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>VCA Compliance Geschiedenis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-center py-4">Fout bij laden: {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>VCA Compliance Geschiedenis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500 text-center py-8">
            Geen compliance geschiedenis beschikbaar
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>VCA Compliance Geschiedenis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((record) => (
            <div
              key={record.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-gray-900">{record.score}%</div>
                  <Badge className={getClassForLevel(record.level)}>
                    {getLevelLabel(record.level)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">{formatDate(record.checkedAt)}</div>
              </div>

              {record.checkedByName && (
                <div className="text-sm text-gray-600 mb-2">
                  Gecontroleerd door: {record.checkedByName}
                </div>
              )}

              {record.issues && record.issues.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Problemen ({record.issues.length}):
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {record.issues.slice(0, 3).map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{issue.message}</span>
                      </li>
                    ))}
                    {record.issues.length > 3 && (
                      <li className="text-gray-500 italic">+{record.issues.length - 3} meer...</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="mt-3 grid grid-cols-5 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium text-gray-700">Risico</div>
                  <div className="text-gray-900">{record.breakdown.riskAssessment.score}%</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-700">Maatregelen</div>
                  <div className="text-gray-900">{record.breakdown.controlMeasures.score}%</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-700">Competenties</div>
                  <div className="text-gray-900">{record.breakdown.competencies.score}%</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-700">Documentatie</div>
                  <div className="text-gray-900">{record.breakdown.documentation.score}%</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-700">Goedkeuringen</div>
                  <div className="text-gray-900">{record.breakdown.approvals.score}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getClassForLevel(level: string): string {
  switch (level) {
    case "FULLY_COMPLIANT":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "COMPLIANT":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "PARTIALLY_COMPLIANT":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "NON_COMPLIANT":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
}

function formatDate(date: any): string {
  try {
    const d = date?.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "zojuist";
    if (diffMins < 60) return `${diffMins} minuten geleden`;
    if (diffHours < 24) return `${diffHours} uur geleden`;
    if (diffDays < 7) return `${diffDays} dagen geleden`;

    return d.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Onbekend";
  }
}

function getLevelLabel(level: string): string {
  switch (level) {
    case "FULLY_COMPLIANT":
      return "Volledig Compliant";
    case "COMPLIANT":
      return "Compliant";
    case "PARTIALLY_COMPLIANT":
      return "Gedeeltelijk Compliant";
    case "NON_COMPLIANT":
      return "Niet Compliant";
    default:
      return level;
  }
}
