"use client";

import React from "react";

type BadgeVariant = "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  icon?: React.ReactNode;
  onRemove?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  icon,
  onRemove,
}) => {
  const variantStyles = {
    default: "bg-gray-100 text-gray-800 border-gray-200",
    primary: "bg-blue-100 text-blue-800 border-blue-200",
    secondary: "bg-purple-100 text-purple-800 border-purple-200",
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    error: "bg-red-100 text-red-800 border-red-200",
    info: "bg-cyan-100 text-cyan-800 border-cyan-200",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 ml-1 -mr-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current"
          aria-label="Remove"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      )}
    </span>
  );
};

interface StatusBadgeProps {
  status: "active" | "pending" | "completed" | "suspended" | "archived" | "draft" | "review";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const statusConfig = {
    active: { label: "Active", variant: "success" as BadgeVariant },
    pending: { label: "Pending", variant: "warning" as BadgeVariant },
    completed: { label: "Completed", variant: "primary" as BadgeVariant },
    suspended: { label: "Suspended", variant: "error" as BadgeVariant },
    archived: { label: "Archived", variant: "default" as BadgeVariant },
    draft: { label: "Draft", variant: "secondary" as BadgeVariant },
    review: { label: "Review", variant: "info" as BadgeVariant },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};

interface RiskBadgeProps {
  level: "low" | "medium" | "high" | "critical";
  score?: number;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, className = "" }) => {
  const riskConfig = {
    low: { label: "Low Risk", variant: "success" as BadgeVariant, icon: "🟢" },
    medium: { label: "Medium Risk", variant: "warning" as BadgeVariant, icon: "🟡" },
    high: { label: "High Risk", variant: "error" as BadgeVariant, icon: "🔴" },
    critical: { label: "Critical Risk", variant: "error" as BadgeVariant, icon: "🚨" },
  };

  const config = riskConfig[level];
  const displayText = score !== undefined ? `${config.label} (${score})` : config.label;

  return (
    <Badge variant={config.variant} className={className}>
      <span className="mr-1">{config.icon}</span>
      {displayText}
    </Badge>
  );
};

interface CountBadgeProps {
  count: number;
  variant?: BadgeVariant;
  max?: number;
  className?: string;
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  variant = "primary",
  max = 99,
  className = "",
}) => {
  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge variant={variant} size="sm" className={className}>
      {displayCount}
    </Badge>
  );
};

interface NotificationDotProps {
  show?: boolean;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const NotificationDot: React.FC<NotificationDotProps> = ({
  show = true,
  position = "top-right",
  size = "md",
  className = "",
}) => {
  if (!show) return null;

  const positionClasses = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
  };

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={`absolute ${positionClasses[position]} ${sizeClasses[size]} bg-red-500 rounded-full border-2 border-white ${className}`}
      aria-label="Notification indicator"
    />
  );
};
