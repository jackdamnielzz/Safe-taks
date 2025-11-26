/**
 * SyncStatusIndicator Component
 * Shows sync status for offline LMRA data, photos, and stop-work alerts
 * W1.6: Offline Sync Implementation
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getOfflineSyncManager } from "@/lib/offlineSyncManager";
import { getStopWorkService } from "@/lib/stopWorkService";

interface SyncCounts {
  sessions: number;
  photos: number;
  alerts: number;
  total: number;
}

type SyncStatus = "synced" | "pending" | "syncing" | "failed";

export function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [pendingCounts, setPendingCounts] = useState<SyncCounts>({
    sessions: 0,
    photos: 0,
    alerts: 0,
    total: 0,
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Poll for pending items
  const checkPendingItems = useCallback(async () => {
    try {
      const syncManager = getOfflineSyncManager();
      const stopWorkService = getStopWorkService();

      // Get pending items from sync manager
      const pending = await syncManager.getPendingSyncItems();

      // Get pending stop-work alerts from localStorage
      const alertsJson = localStorage.getItem("stopWorkQueue");
      const alerts = alertsJson ? JSON.parse(alertsJson) : [];

      const counts: SyncCounts = {
        sessions: pending.sessions,
        photos: pending.photos,
        alerts: Array.isArray(alerts) ? alerts.length : 0,
        total: pending.sessions + pending.photos + (Array.isArray(alerts) ? alerts.length : 0),
      };

      setPendingCounts(counts);

      // Determine sync status
      if (counts.total === 0) {
        setSyncStatus("synced");
      } else if (isSyncing) {
        setSyncStatus("syncing");
      } else {
        setSyncStatus("pending");
      }

      // Get last sync time from localStorage
      const lastSync = localStorage.getItem("lastSyncTime");
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
    } catch (err) {
      console.error("Error checking pending items:", err);
      setSyncStatus("failed");
      setError(err instanceof Error ? err.message : "Fout bij controleren sync status");
    }
  }, [isSyncing]);

  // Poll every 5 seconds
  useEffect(() => {
    checkPendingItems();
    const interval = setInterval(checkPendingItems, 5000);
    return () => clearInterval(interval);
  }, [checkPendingItems]);

  // Manual sync trigger
  const handleManualSync = async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    setSyncStatus("syncing");
    setError(null);

    try {
      const syncManager = getOfflineSyncManager();
      const stopWorkService = getStopWorkService();

      // Sync all pending items (sessions, photos, projects)
      await syncManager.syncNow();

      // Sync stop-work alerts
      await stopWorkService.syncPendingAlerts();

      // Update last sync time
      const now = new Date();
      localStorage.setItem("lastSyncTime", now.toISOString());
      setLastSyncTime(now);

      // Recheck pending items
      await checkPendingItems();
    } catch (err) {
      console.error("Manual sync failed:", err);
      setSyncStatus("failed");
      setError(err instanceof Error ? err.message : "Synchronisatie mislukt");
    } finally {
      setIsSyncing(false);
    }
  };

  // Get status icon and color
  const getStatusDisplay = () => {
    switch (syncStatus) {
      case "synced":
        return { icon: "✓", color: "bg-green-500", text: "Gesynchroniseerd" };
      case "pending":
        return { icon: "⏳", color: "bg-yellow-500", text: "Wacht op sync" };
      case "syncing":
        return { icon: "↻", color: "bg-blue-500", text: "Synchroniseren..." };
      case "failed":
        return { icon: "✗", color: "bg-red-500", text: "Sync mislukt" };
    }
  };

  const status = getStatusDisplay();

  // Don't show if everything is synced and online
  if (syncStatus === "synced" && isOnline && pendingCounts.total === 0) {
    return null;
  }

  return (
    <div className="sync-status-indicator">
      {/* Status Badge */}
      <div className="status-badge">
        <div className={`status-icon ${status.color}`}>{status.icon}</div>
        <div className="status-info">
          <div className="status-text">{status.text}</div>
          {!isOnline && <div className="offline-badge">Offline</div>}
        </div>
      </div>

      {/* Pending Counts */}
      {pendingCounts.total > 0 && (
        <div className="pending-counts">
          <div className="counts-header">Te synchroniseren:</div>
          {pendingCounts.sessions > 0 && (
            <div className="count-item">
              📋 {pendingCounts.sessions} LMRA sessie{pendingCounts.sessions !== 1 ? "s" : ""}
            </div>
          )}
          {pendingCounts.photos > 0 && (
            <div className="count-item">
              📷 {pendingCounts.photos} foto{pendingCounts.photos !== 1 ? "'s" : ""}
            </div>
          )}
          {pendingCounts.alerts > 0 && (
            <div className="count-item">
              🛑 {pendingCounts.alerts} stop-werk melding{pendingCounts.alerts !== 1 ? "en" : ""}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Last Sync Time */}
      {lastSyncTime && (
        <div className="last-sync">Laatste sync: {lastSyncTime.toLocaleTimeString("nl-NL")}</div>
      )}

      {/* Manual Sync Button */}
      {isOnline && pendingCounts.total > 0 && (
        <button onClick={handleManualSync} disabled={isSyncing} className="sync-button">
          {isSyncing ? "Bezig..." : "Nu synchroniseren"}
        </button>
      )}

      <style jsx>{`
        .sync-status-indicator {
          position: fixed;
          bottom: 1rem;
          left: 1rem;
          z-index: 40;
          background: white;
          border-radius: 0.75rem;
          box-shadow:
            0 4px 6px rgba(0, 0, 0, 0.1),
            0 2px 4px rgba(0, 0, 0, 0.06);
          padding: 1rem;
          max-width: 320px;
          border: 2px solid #e5e7eb;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .status-icon {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.125rem;
          flex-shrink: 0;
        }

        .bg-green-500 {
          background: #10b981;
        }

        .bg-yellow-500 {
          background: #f59e0b;
        }

        .bg-blue-500 {
          background: #3b82f6;
        }

        .bg-red-500 {
          background: #ef4444;
        }

        .status-info {
          flex: 1;
        }

        .status-text {
          font-weight: 600;
          color: #111827;
          font-size: 0.875rem;
        }

        .offline-badge {
          display: inline-block;
          margin-top: 0.25rem;
          padding: 0.125rem 0.5rem;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .pending-counts {
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .counts-header {
          font-weight: 600;
          color: #374151;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .count-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .error-message {
          padding: 0.5rem;
          background: #fee2e2;
          border-left: 3px solid #ef4444;
          border-radius: 0.25rem;
          color: #991b1b;
          font-size: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .last-sync {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-bottom: 0.75rem;
        }

        .sync-button {
          width: 100%;
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .sync-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .sync-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .sync-status-indicator {
            left: 0.5rem;
            right: 0.5rem;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}
