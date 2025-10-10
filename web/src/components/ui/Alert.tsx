"use client";

import React from "react";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  children,
  onClose,
  className = "",
}) => {
  const variantStyles = {
    info: {
      container: "bg-blue-50 border-blue-200 text-blue-800",
      icon: "text-blue-400",
      iconPath: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    success: {
      container: "bg-green-50 border-green-200 text-green-800",
      icon: "text-green-400",
      iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    warning: {
      container: "bg-yellow-50 border-yellow-200 text-yellow-800",
      icon: "text-yellow-400",
      iconPath:
        "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    },
    error: {
      container: "bg-red-50 border-red-200 text-red-800",
      icon: "text-red-400",
      iconPath: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={`flex items-start p-4 border rounded-lg ${styles.container} ${className}`}
      role="alert"
    >
      {/* Icon */}
      <svg
        className={`flex-shrink-0 w-5 h-5 ${styles.icon} mr-3`}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path d={styles.iconPath}></path>
      </svg>

      {/* Content */}
      <div className="flex-1">
        {title && <h3 className="font-medium mb-1">{title}</h3>}
        <div className={title ? "text-sm" : ""}>{children}</div>
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 ml-3 -mr-1 -mt-1 p-1 rounded-md hover:bg-opacity-20 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-gray-500 ${styles.icon}`}
          aria-label="Close alert"
        >
          <svg
            className="w-4 h-4"
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
    </div>
  );
};

interface ToastProps {
  variant?: AlertVariant;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  position?: "top-right" | "top-center" | "bottom-right" | "bottom-center";
}

export const Toast: React.FC<ToastProps> = ({
  variant = "info",
  message,
  isVisible,
  onClose,
  duration = 5000,
  position = "top-right",
}) => {
  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  };

  const variantStyles = {
    info: "bg-blue-600 text-white",
    success: "bg-green-600 text-white",
    warning: "bg-yellow-600 text-white",
    error: "bg-red-600 text-white",
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 animate-slide-in-right`}
      role="alert"
      aria-live="polite"
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${variantStyles[variant]} min-w-[300px] max-w-md`}
      >
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close notification"
        >
          <svg
            className="w-4 h-4"
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
      </div>
    </div>
  );
};
