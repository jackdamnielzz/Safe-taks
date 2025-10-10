"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { AuthLayout } from "@/components/layouts/FormContainer";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/components/AuthProvider";

// Forgot password form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { resetPassword, error, clearError } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    clearError();
    setSuccess(false);

    try {
      await resetPassword(data.email);
      setSuccess(true);
    } catch (err) {
      // Error is handled by AuthProvider
      console.error("Password reset failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address and we'll send you instructions to reset your password."
    >
      {success ? (
        <div className="space-y-6">
          <Alert variant="success">
            <strong>Check your email!</strong>
            <p className="mt-1">
              We've sent password reset instructions to your email address. Please check your inbox
              and follow the link to reset your password.
            </p>
          </Alert>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-gray-900">Didn't receive the email?</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes for the email to arrive</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setSuccess(false);
                clearError();
              }}
              className="w-full"
            >
              Try another email address
            </Button>

            <Link
              href="/auth/login"
              className="block text-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="error" onClose={clearError}>
              {error}
            </Alert>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("email")}
              id="email"
              type="email"
              autoComplete="email"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="you@company.com"
              disabled={isLoading}
              autoFocus
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Sending..." : "Send reset instructions"}
          </Button>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              ← Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
