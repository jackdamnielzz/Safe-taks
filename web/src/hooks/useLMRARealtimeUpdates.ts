/**
 * LMRA Real-time Updates Hook
 * Firebase real-time listeners for LMRA dashboard updates
 * Task 5.10: Real-time Dashboard Updates
 */

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LMRASession, LMRASummary } from "@/lib/types/lmra";

// ============================================================================
// TYPES
// ============================================================================

interface UseLMRARealtimeOptions {
  orgId: string;
  projectId?: string;
  traId?: string;
  limit?: number;
  enableNotifications?: boolean;
}

interface LMRARealtimeState {
  sessions: LMRASession[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

// ============================================================================
// HOOK
// ============================================================================

export function useLMRARealtimeUpdates(options: UseLMRARealtimeOptions) {
  const { orgId, projectId, traId, limit: queryLimit = 50, enableNotifications = true } = options;

  const [state, setState] = useState<LMRARealtimeState>({
    sessions: [],
    isLoading: true,
    error: null,
    lastUpdate: null,
  });

  useEffect(() => {
    if (!orgId) return;

    setState((s) => ({ ...s, isLoading: true, error: null }));

    // Build query
    const baseCollection = collection(db, `organizations/${orgId}/lmraSessions`);
    let q = query(baseCollection, orderBy("startedAt", "desc"), limit(queryLimit));

    // Apply filters
    if (projectId) {
      q = query(q, where("projectId", "==", projectId));
    }
    if (traId) {
      q = query(q, where("traId", "==", traId));
    }

    // Setup real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sessions = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as LMRASession
        );

        setState({
          sessions,
          isLoading: false,
          error: null,
          lastUpdate: new Date(),
        });

        // Check for stop work alerts
        if (enableNotifications) {
          const stopWorkSessions = sessions.filter(
            (s) => s.overallAssessment === "stop_work" && !s.stopWorkAcknowledgedBy
          );

          if (stopWorkSessions.length > 0) {
            // Send notification for stop work
            sendStopWorkNotification(stopWorkSessions[0]);
          }
        }
      },
      (error) => {
        console.error("LMRA real-time update error:", error);
        setState((s) => ({
          ...s,
          isLoading: false,
          error: error.message,
        }));
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [orgId, projectId, traId, queryLimit, enableNotifications]);

  return state;
}

/**
 * Hook for single LMRA session real-time updates
 */
export function useLMRASessionRealtime(sessionId: string | null, orgId: string) {
  const [session, setSession] = useState<LMRASession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !orgId) return;

    setIsLoading(true);
    setError(null);

    const sessionRef = doc(db, `organizations/${orgId}/lmraSessions`, sessionId);

    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSession({
            id: snapshot.id,
            ...snapshot.data(),
          } as LMRASession);
        } else {
          setSession(null);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Session real-time error:", error);
        setError(error.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId, orgId]);

  return { session, isLoading, error };
}

/**
 * Hook for LMRA statistics real-time updates
 */
export function useLMRAStatsRealtime(orgId: string, projectId?: string) {
  const [stats, setStats] = useState({
    total: 0,
    safeCount: 0,
    cautionCount: 0,
    stopWorkCount: 0,
    todayCount: 0,
  });

  useEffect(() => {
    if (!orgId) return;

    const baseCollection = collection(db, `organizations/${orgId}/lmraSessions`);
    let q = query(baseCollection);

    if (projectId) {
      q = query(q, where("projectId", "==", projectId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map((doc) => doc.data() as LMRASession);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const newStats = {
        total: sessions.length,
        safeCount: sessions.filter((s) => s.overallAssessment === "safe_to_proceed").length,
        cautionCount: sessions.filter((s) => s.overallAssessment === "proceed_with_caution").length,
        stopWorkCount: sessions.filter((s) => s.overallAssessment === "stop_work").length,
        todayCount: sessions.filter((s) => {
          const startDate =
            s.startedAt instanceof Date ? s.startedAt : (s.startedAt as any).toDate();
          return startDate >= today;
        }).length,
      };

      setStats(newStats);
    });

    return () => unsubscribe();
  }, [orgId, projectId]);

  return stats;
}

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

/**
 * Send stop work notification
 */
function sendStopWorkNotification(session: LMRASession) {
  // Check if browser supports notifications
  if (!("Notification" in window)) {
    return;
  }

  // Request permission if needed
  if (Notification.permission === "default") {
    Notification.requestPermission();
    return;
  }

  // Send notification if permitted
  if (Notification.permission === "granted") {
    new Notification("⚠️ Stop Work Triggered", {
      body: `LMRA stop work op project. Reden: ${session.stopWorkReason || "Onveilige omstandigheden"}`,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      tag: `stop-work-${session.id}`,
      requireInteraction: true,
      data: {
        sessionId: session.id,
        type: "stop_work",
      },
    });
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

/**
 * Send custom LMRA notification
 */
export function sendLMRANotification(title: string, message: string, data?: any) {
  if (Notification.permission !== "granted") {
    return;
  }

  new Notification(title, {
    body: message,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    data,
  });
}
