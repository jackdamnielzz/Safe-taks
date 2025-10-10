"use client";

import React, { useState } from "react";
import { useSwipe, useHapticFeedback } from "@/hooks/useTouchOptimized";

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant: "success" | "danger" | "primary";
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  className?: string;
  disabled?: boolean;
}

/**
 * SwipeableCard - Touch-optimized card with swipe actions
 * Following DESIGN_SYSTEM_ENHANCEMENTS.md Section 5.2
 * Common pattern for mobile list items with quick actions
 */
export function SwipeableCard({
  children,
  leftActions = [],
  rightActions = [],
  className = "",
  disabled = false,
}: SwipeableCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const { lightTap } = useHapticFeedback();

  const handleSwipeLeft = () => {
    if (disabled || rightActions.length === 0) return;
    lightTap();
    setSwipeOffset(-160); // Show right actions
  };

  const handleSwipeRight = () => {
    if (disabled || leftActions.length === 0) return;
    lightTap();
    setSwipeOffset(80); // Show left action
  };

  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  const handleActionClick = (action: SwipeAction) => {
    lightTap();
    action.onClick();
    setSwipeOffset(0); // Reset position
  };

  const variantClasses = {
    success: "bg-success-500 text-white",
    danger: "bg-danger-500 text-white",
    primary: "bg-primary-500 text-white",
  };

  return (
    <div className={`swipe-card relative ${className}`}>
      {/* Left Actions (shown on swipe right) */}
      {leftActions.length > 0 && (
        <div className="absolute top-0 left-0 bottom-0 flex items-center pl-2">
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={`swipe-action ${variantClasses[action.variant]} touch-target`}
              aria-label={action.label}
            >
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right Actions (shown on swipe left) */}
      {rightActions.length > 0 && (
        <div className="swipe-card-actions">
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={`swipe-action ${variantClasses[action.variant]} touch-target`}
              aria-label={action.label}
            >
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Card Content */}
      <div
        className="swipe-card-content"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset !== 0 ? "transform 300ms ease-out" : "none",
        }}
        onTouchStart={disabled ? undefined : onTouchStart}
        onTouchEnd={disabled ? undefined : onTouchEnd}
        onClick={() => setSwipeOffset(0)} // Reset on tap
      >
        {children}
      </div>
    </div>
  );
}
