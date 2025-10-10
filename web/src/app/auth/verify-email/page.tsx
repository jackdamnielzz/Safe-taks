"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/layouts/FormContainer";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/components/AuthProvider";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resendVerificationEmail, user, error, clearError } = useAuth();
  const email = searchParams?.get("email") || user?.email || "your email address";

  const [isResending, setIsResending] = React.useState(false);
  const [resendSuccess, setResendSuccess] = React.useState(false);
  const [canResend, setCanResend] = React.useState(true);
  const [countdown, setCountdown] = React.useState(0);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleResendEmail = async () => {
    if (!canResend || !user) return;

    setIsResending(true);
    clearError();
    setResendSuccess(false);

    try {
      await resendVerificationEmail();
      setResendSuccess(true);
      setCanResend(false);
      setCountdown(60); // 60 second cooldown

      // Auto-hide success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      // Error is handled by AuthProvider
      console.error("Resend verification email failed:", err);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We've sent a verification link to your email address."
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="flex-shrink-0 w-5 h-5 text-blue-400 mt-0.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-900">Check your email</h3>
              <div className="mt-2 text-sm text-blue-800">
                <p>
                  We sent a verification link to <strong>{email}</strong>. Click the link in the
                  email to activate your account.
                </p>
              </div>
            </div>
          </div>
        </div>

        {resendSuccess && (
          <Alert variant="success" onClose={() => setResendSuccess(false)}>
            Verification email sent! Please check your inbox.
          </Alert>
        )}

        {error && (
          <Alert variant="error" onClose={clearError}>
            {error}
          </Alert>
        )}

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900">Didn't receive the email?</h4>
          <ul className="text-sm text-gray-600 space-y-1.5">
            <li className="flex items-start">
              <svg
                className="w-4 h-4 text-gray-400 mt-0.5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Check your spam or junk folder
            </li>
            <li className="flex items-start">
              <svg
                className="w-4 h-4 text-gray-400 mt-0.5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Make sure you entered the correct email address
            </li>
            <li className="flex items-start">
              <svg
                className="w-4 h-4 text-gray-400 mt-0.5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Wait a few minutes for the email to arrive
            </li>
            <li className="flex items-start">
              <svg
                className="w-4 h-4 text-gray-400 mt-0.5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Add noreply@safeworkpro.com to your contacts
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="primary"
            onClick={handleResendEmail}
            disabled={!canResend || isResending || !user}
            loading={isResending}
            className="w-full"
          >
            {isResending
              ? "Sending..."
              : countdown > 0
                ? `Resend available in ${countdown}s`
                : "Resend verification email"}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Already verified?{" "}
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in to your account
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Wrong email address?{" "}
              <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up again
              </Link>
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="flex-shrink-0 w-5 h-5 text-yellow-400 mt-0.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-900">Still having trouble?</h3>
              <p className="mt-1 text-sm text-yellow-800">
                Contact our support team at{" "}
                <a
                  href="mailto:support@safeworkpro.com"
                  className="font-medium underline hover:text-yellow-900"
                >
                  support@safeworkpro.com
                </a>{" "}
                for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
