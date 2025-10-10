"use client";

import React from "react";
import { UseFormRegister, FieldError } from "react-hook-form";

interface TextAreaProps {
  id: string;
  label: string;
  placeholder?: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  id,
  label,
  placeholder,
  register,
  error,
  required = false,
  rows = 4,
  className = "",
  disabled = false,
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        {...register(id)}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
    </div>
  );
};
