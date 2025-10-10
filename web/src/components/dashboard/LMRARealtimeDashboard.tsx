/**
 * LMRA Real-time Dashboard
 * Live updates of LMRA sessions with push notifications
 * Task 5.10: Real-time Dashboard Updates
 */

"use client";

import React, { useEffect } from "react";
import {
  useLMRARealtimeUpdates,
  useLMRAStatsRealtime,
  requestNotificationPermission,
} from "@/hooks/useLMRARealtimeUpdates";
import { LMRASession } from "@/lib/types/lmra";
import { StatsCard } from "./StatsCard";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Alert } from "../ui/Alert";
import { Badge } from "../ui/Badge";

// ============================================================================
// TYPES
// ============================================================================

interface LMRARealtimeDashboardProps {
  orgId: string;
  projectId?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LMRARealtimeDashboard({ orgId, projectId }: LMRARealtimeDashboardProps) {
  const { sessions, isLoading, error, lastUpdate } = useLMRARealtimeUpdates({
    orgId,
    projectId,
    limit: 20,
    enableNotifications: true,
  });

  const stats = useLMRAStatsRealtime(orgId, projectId);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">Fout bij laden real-time data: {error}</Alert>;
  }

  // Filter stop work sessions
  const stopWorkSessions = sessions.filter(
    (s) => s.overallAssessment === "stop_work" && !s.stopWorkAcknowledgedBy
  );

  return (
    <div className="space-y-6">
      {/* Last update indicator */}
      {lastUpdate && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Live updates actief
          </div>
          <div>Laatste update: {lastUpdate.toLocaleTimeString("nl-NL")}</div>
        </div>
      )}

      {/* Stop work alerts */}
      {stopWorkSessions.length > 0 && (
        <Alert variant="error" className="border-2 border-red-500">
          <div className="font-bold mb-2">
            🛑 {stopWorkSessions.length} Stop Work Alert{stopWorkSessions.length > 1 ? "s" : ""}
          </div>
          {stopWorkSessions.map((session) => (
            <div key={session.id} className="mt-2 text-sm">
              <div className="font-medium">{session.performedByName}</div>
              <div className="text-red-700">
                {session.stopWorkReason || "Reden niet gespecificeerd"}
              </div>
            </div>
          ))}
        </Alert>
      )}

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Vandaag" value={stats.todayCount} icon="📅" />
        <StatsCard title="Veilig" value={stats.safeCount} icon="✅" />
        <StatsCard title="Met Voorzichtigheid" value={stats.cautionCount} icon="⚠️" />
        <StatsCard title="Stop Work" value={stats.stopWorkCount} icon="🛑" />
      </div>

      {/* Recent sessions list */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Recente LMRA Sessies</h3>
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nog geen LMRA sessies uitgevoerd</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <LMRASessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SESSION CARD COMPONENT
// ============================================================================

function LMRASessionCard({ session }: { session: LMRASession }) {
  const startTime =
    session.startedAt instanceof Date ? session.startedAt : (session.startedAt as any).toDate();

  const getAssessmentColor = (assessment: string) => {
    switch (assessment) {
      case "safe_to_proceed":
        return "bg-green-100 text-green-800";
      case "proceed_with_caution":
        return "bg-orange-100 text-orange-800";
      case "stop_work":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAssessmentText = (assessment: string) => {
    switch (assessment) {
      case "safe_to_proceed":
        return "Veilig";
      case "proceed_with_caution":
        return "Met voorzichtigheid";
      case "stop_work":
        return "Stop work";
      default:
        return assessment;
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={getAssessmentColor(session.overallAssessment)}>
              {getAssessmentText(session.overallAssessment)}
            </Badge>
            {session.syncStatus === "pending_sync" && (
              <Badge className="bg-blue-100 text-blue-800">Sync in behandeling</Badge>
            )}
            {session.syncStatus === "sync_failed" && (
              <Badge className="bg-red-100 text-red-800">Sync mislukt</Badge>
            )}
          </div>

          <div className="text-sm text-gray-900 font-medium mb-1">
            {session.performedByName || "Onbekend"}
          </div>

          <div className="text-xs text-gray-600 space-y-1">
            <div>📍 Nauwkeurigheid: {session.location.accuracy.toFixed(1)}m</div>
            <div>👷 Team: {session.teamMembers.length} leden</div>
            {session.photos.length > 0 && <div>📷 Foto's: {session.photos.length}</div>}
            <div>🕐 {startTime.toLocaleString("nl-NL")}</div>
          </div>

          {session.stopWorkReason && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
              <strong>Stop work reden:</strong> {session.stopWorkReason}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ml-4">
          <button
            className="text-green-600 hover:text-green-700 text-sm font-medium"
            onClick={() => {
              // Navigate to session details
              window.location.href = `/lmra/sessions/${session.id}`;
            }}
          >
            Details →
          </button>
        </div>
      </div>
    </div>
  );
}
