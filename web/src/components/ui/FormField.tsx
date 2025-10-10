"use client";

import React from "react";
import { UseFormRegister, FieldError } from "react-hook-form";

interface FormFieldProps {
  id?: string;
  htmlFor?: string;
  label: string;
  type?: string;
  placeholder?: string;
  register?: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * FormField is flexible to support two usage patterns used across the app:
 * 1) Controlled via react-hook-form register (register + id)
 * 2) Custom children (label + custom input elements) — used by TraWizard.
 *
 * When children are provided, we render them directly and use htmlFor for the label.
 * Otherwise we render a simple input using register(id).
 */
export const FormField: React.FC<FormFieldProps> = ({
  id,
  htmlFor,
  label,
  type = "text",
  placeholder,
  register,
  error,
  required = false,
  className = "",
  disabled = false,
  children,
}) => {
  const inputId = id || htmlFor || undefined;

  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {children ? (
        // If children provided, caller manages the input element.
        <div>{children}</div>
      ) : (
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          {...(register && inputId ? register(inputId) : {})}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? "border-red-500" : "border-gray-300"
          } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
        />
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
    </div>
  );
};
