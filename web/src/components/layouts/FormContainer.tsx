"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";

interface FormContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
}

export const FormContainer: React.FC<FormContainerProps> = ({
  children,
  title,
  description,
  maxWidth = "2xl",
  className = "",
}) => {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  return (
    <div className={`mx-auto ${maxWidthClasses[maxWidth]} ${className}`}>
      {title || description ? (
        <Card>
          {(title || description) && (
            <CardHeader>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
          )}
          <CardContent>{children}</CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>{children}</CardContent>
        </Card>
      )}
    </div>
  );
};

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showLogo = true,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {showLogo && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <span className="text-4xl">🏗️</span>
              <span className="text-2xl font-bold text-gray-900">SafeWork Pro</span>
            </div>
            <p className="text-gray-600">Task Risk Assessment Platform</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
};

interface WizardStepProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  currentStep: number;
  totalSteps: number;
}

export const WizardStep: React.FC<WizardStepProps> = ({
  children,
  title,
  description,
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Step {currentStep} of {totalSteps}
          </span>
          <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        {description && <p className="text-gray-600 mb-6">{description}</p>}
        {children}
      </div>
    </div>
  );
};

interface FormSectionProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({
  children,
  title,
  description,
  collapsible = false,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  if (!collapsible) {
    return (
      <div className="space-y-4">
        <div className="border-b border-gray-200 pb-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="text-left">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? "transform rotate-180" : ""}`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && <div className="p-4 pt-0 space-y-4">{children}</div>}
    </div>
  );
};

interface FormActionsProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right" | "between";
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  align = "right",
  className = "",
}) => {
  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={`flex items-center gap-3 pt-6 border-t border-gray-200 ${alignClasses[align]} ${className}`}
    >
      {children}
    </div>
  );
};
