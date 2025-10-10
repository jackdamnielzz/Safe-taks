"use client";

import React from "react";
import { useHapticFeedback } from "@/hooks/useTouchOptimized";

/**
 * EmergencyAccess - Critical safety component for field workers
 * Always visible emergency stop work functionality
 * Designed for gloved hands and high-stress situations
 */
interface EmergencyAccessProps {
  onStopWork: () => void;
  onEmergencyContact: () => void;
  isOnline?: boolean;
  className?: string;
}

export function EmergencyAccess({
  onStopWork,
  onEmergencyContact,
  isOnline = true,
  className = "",
}: EmergencyAccessProps) {
  const { heavyTap } = useHapticFeedback();

  const handleStopWork = () => {
    heavyTap();
    onStopWork();
  };

  const handleEmergencyContact = () => {
    heavyTap();
    onEmergencyContact();
  };

  return (
    <div className={`emergency-access ${className}`}>
      {/* Emergency Button - Always visible and prominent */}
      <button
        onClick={handleStopWork}
        className="emergency-stop-btn"
        aria-label="Stop Work Emergency"
        title="Stop Work Emergency"
      >
        <span className="emergency-icon">🚨</span>
        <span className="emergency-text">STOP WERK</span>
        <span className="emergency-subtext">Noodstop</span>
      </button>

      {/* Secondary Emergency Contact */}
      <button
        onClick={handleEmergencyContact}
        className="emergency-contact-btn"
        aria-label="Emergency Contact"
        title="Emergency Contact"
      >
        <span className="emergency-icon">📞</span>
        <span className="emergency-text">NOODGEVAL</span>
      </button>

      {/* Connection Status Indicator */}
      <div className={`connection-status ${isOnline ? "online" : "offline"}`}>
        <span className={`status-dot ${isOnline ? "online" : "offline"}`} />
        <span className="status-text">{isOnline ? "Online" : "Offline"}</span>
      </div>
    </div>
  );
}

/**
 * Floating Emergency Button - Compact version for mobile screens
 */
interface FloatingEmergencyButtonProps {
  onClick: () => void;
  isVisible?: boolean;
  className?: string;
}

export function FloatingEmergencyButton({
  onClick,
  isVisible = true,
  className = "",
}: FloatingEmergencyButtonProps) {
  const { heavyTap } = useHapticFeedback();

  if (!isVisible) return null;

  return (
    <button
      onClick={() => {
        heavyTap();
        onClick();
      }}
      className={`floating-emergency-btn ${className}`}
      aria-label="Emergency Stop Work"
      title="Emergency Stop Work"
    >
      <span className="emergency-icon">🚨</span>
    </button>
  );
}

/**
 * Emergency Status Banner - Shows current emergency state
 */
interface EmergencyStatusBannerProps {
  isEmergencyActive?: boolean;
  emergencyType?: "stop_work" | "hazard" | "injury" | null;
  message?: string;
  onAcknowledge?: () => void;
  className?: string;
}

export function EmergencyStatusBanner({
  isEmergencyActive = false,
  emergencyType = null,
  message = "",
  onAcknowledge,
  className = "",
}: EmergencyStatusBannerProps) {
  if (!isEmergencyActive) return null;

  const getEmergencyColor = () => {
    switch (emergencyType) {
      case "stop_work":
        return "emergency-stop-work";
      case "hazard":
        return "emergency-hazard";
      case "injury":
        return "emergency-injury";
      default:
        return "emergency-default";
    }
  };

  return (
    <div className={`emergency-status-banner ${getEmergencyColor()} ${className}`}>
      <div className="emergency-banner-content">
        <span className="emergency-banner-icon">
          {emergencyType === "stop_work" && "🚨"}
          {emergencyType === "hazard" && "⚠️"}
          {emergencyType === "injury" && "🏥"}
        </span>
        <div className="emergency-banner-text">
          <div className="emergency-banner-title">
            {emergencyType === "stop_work" && "STOP WERK ACTIEF"}
            {emergencyType === "hazard" && "GEVAAR GEMELD"}
            {emergencyType === "injury" && "LETSEL GEMELD"}
          </div>
          {message && <div className="emergency-banner-message">{message}</div>}
        </div>
        {onAcknowledge && (
          <button
            onClick={onAcknowledge}
            className="emergency-banner-acknowledge"
            aria-label="Acknowledge Emergency"
          >
            ✓
          </button>
        )}
      </div>
    </div>
  );
}
