"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/layouts/FormContainer";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/AuthProvider";

export default function EmailVerifiedPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // If the user is already logged in, skip this page and go straight to home
  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [loading, user, router]);

  // While redirecting for logged-in users, show a minimal loader
  if (!loading && user) {
    return (
      <AuthLayout title="Redirecting..." subtitle="Taking you to your dashboard.">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </AuthLayout>
    );
  }

  // For users who just verified via email (but are not logged in yet), show the confirmation + login link
  return (
    <AuthLayout
      title="Email verified successfully"
      subtitle="Your account is now active. You can log in and start using the application."
    >
      <div className="space-y-8">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center shadow-sm">
            <svg
              className="h-12 w-12 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-3 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Your email address has been confirmed
          </h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Thank you for confirming your email. You can now log in securely with your account
            details and start working in the application.
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/auth/login">
            <Button variant="primary" className="w-full">
              Go to login
            </Button>
          </Link>

          <p className="text-xs text-center text-gray-500">
            If you didn't request this verification, you can safely ignore this page.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}