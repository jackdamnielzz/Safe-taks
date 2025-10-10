"use client";

import React from "react";
import { useHapticFeedback } from "@/hooks/useTouchOptimized";

interface FABProps {
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  size?: "default" | "large";
  extended?: boolean;
  className?: string;
}

/**
 * FloatingActionButton (FAB) - Mobile-optimized primary action button
 * Following DESIGN_SYSTEM_ENHANCEMENTS.md Section 3.3
 * Includes haptic feedback for enhanced mobile UX
 */
export function FloatingActionButton({
  icon,
  label,
  onClick,
  variant = "primary",
  size = "default",
  extended = false,
  className = "",
}: FABProps) {
  const { mediumTap } = useHapticFeedback();

  const handleClick = () => {
    mediumTap();
    onClick();
  };

  const variantClasses = {
    primary: "bg-primary-500 hover:bg-primary-600 active:bg-primary-700",
    secondary: "bg-secondary-500 hover:bg-secondary-600 active:bg-secondary-700",
    danger: "bg-danger-500 hover:bg-danger-600 active:bg-danger-700",
  };

  const sizeClasses = {
    default: extended ? "" : "w-14 h-14",
    large: extended ? "" : "w-16 h-16",
  };

  const baseClasses = "fab touch-target-large";
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${extended ? "fab-extended" : ""} ${className}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={classes}
      aria-label={label || "Action button"}
    >
      <span className="flex items-center justify-center">{icon}</span>
      {extended && label && <span className="font-semibold text-base">{label}</span>}
    </button>
  );
}

// FAB Speed Dial - Multiple quick actions
interface FABSpeedDialProps {
  mainIcon: React.ReactNode;
  actions: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }>;
  className?: string;
}

export function FABSpeedDial({ mainIcon, actions, className = "" }: FABSpeedDialProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { mediumTap } = useHapticFeedback();

  const toggleOpen = () => {
    mediumTap();
    setIsOpen(!isOpen);
  };

  return (
    <div className={`fab-speed-dial ${isOpen ? "is-open" : ""} ${className}`}>
      {/* Action Buttons */}
      {actions.map((action, index) => (
        <div
          key={index}
          className="fab-speed-dial-item"
          style={{
            transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
          }}
        >
          <button
            type="button"
            onClick={() => {
              mediumTap();
              action.onClick();
              setIsOpen(false);
            }}
            className="fab w-12 h-12 bg-white text-neutral-700 shadow-lg"
            aria-label={action.label}
            title={action.label}
          >
            {action.icon}
          </button>
        </div>
      ))}

      {/* Main FAB */}
      <FloatingActionButton
        icon={mainIcon}
        onClick={toggleOpen}
        label={isOpen ? "Sluiten" : "Acties"}
      />
    </div>
  );
}
