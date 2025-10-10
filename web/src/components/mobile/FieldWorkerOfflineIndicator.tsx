"use client";

import React from "react";

/**
 * FieldWorkerOfflineIndicator - Enhanced offline status for field workers
 * Critical for construction sites with poor network coverage
 */
interface OfflineIndicatorProps {
  isOnline: boolean;
  lastSync?: Date;
  pendingActions?: number;
  onForceSync?: () => void;
  className?: string;
}

export function FieldWorkerOfflineIndicator({
  isOnline,
  lastSync,
  pendingActions = 0,
  onForceSync,
  className = "",
}: OfflineIndicatorProps) {
  const formatLastSync = (date?: Date) => {
    if (!date) return "Nooit";

    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return "Zojuist";
    if (diffMinutes < 60) return `${diffMinutes}m geleden`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}u geleden`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d geleden`;
  };

  const getStatusColor = () => {
    if (isOnline) return "online";
    if (pendingActions > 5) return "critical";
    if (pendingActions > 0) return "warning";
    return "offline";
  };

  const getStatusText = () => {
    if (isOnline) return "Online";
    if (pendingActions > 0) return `${pendingActions} pending`;
    return "Offline";
  };

  return (
    <div className={`field-worker-offline-indicator ${getStatusColor()} ${className}`}>
      {/* Status Icon & Text */}
      <div className="offline-status-main">
        <div className={`status-icon ${isOnline ? "online" : "offline"}`}>
          {isOnline ? "📶" : "📵"}
        </div>
        <div className="status-info">
          <div className="status-text">{getStatusText()}</div>
          {lastSync && <div className="last-sync">Laatste sync: {formatLastSync(lastSync)}</div>}
        </div>
      </div>

      {/* Pending Actions Indicator */}
      {pendingActions > 0 && (
        <div className="pending-actions">
          <span className="pending-count">{pendingActions}</span>
          <span className="pending-label">wachtend</span>
        </div>
      )}

      {/* Force Sync Button */}
      {onForceSync && !isOnline && (
        <button
          onClick={onForceSync}
          className="force-sync-btn"
          aria-label="Force Sync"
          title="Force Sync"
        >
          🔄
        </button>
      )}

      {/* Connection Quality Indicator */}
      <div className="connection-quality">
        <div className={`quality-bars ${isOnline ? "online" : "offline"}`}>
          <div className="quality-bar" />
          <div className="quality-bar" />
          <div className="quality-bar" />
          <div className="quality-bar" />
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Offline Badge - For mobile toolbars and headers
 */
interface CompactOfflineBadgeProps {
  isOnline: boolean;
  pendingActions?: number;
  className?: string;
}

export function CompactOfflineBadge({
  isOnline,
  pendingActions = 0,
  className = "",
}: CompactOfflineBadgeProps) {
  return (
    <div className={`compact-offline-badge ${isOnline ? "online" : "offline"} ${className}`}>
      <span className="badge-icon">{isOnline ? "📶" : "📵"}</span>
      {pendingActions > 0 && <span className="badge-count">{pendingActions}</span>}
    </div>
  );
}

/**
 * Offline Mode Notification Banner
 */
interface OfflineModeBannerProps {
  isVisible: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function OfflineModeBanner({
  isVisible,
  onDismiss,
  className = "",
}: OfflineModeBannerProps) {
  if (!isVisible) return null;

  return (
    <div className={`offline-mode-banner ${className}`}>
      <div className="banner-content">
        <span className="banner-icon">📵</span>
        <div className="banner-text">
          <div className="banner-title">Offline Modus</div>
          <div className="banner-message">
            Uw wijzigingen worden automatisch gesynchroniseerd zodra u weer online bent.
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="banner-dismiss"
            aria-label="Dismiss Offline Banner"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
