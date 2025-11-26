"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { AuthLayout } from "@/components/layouts/FormContainer";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/components/AuthProvider";
import GoogleSignUpLight from "./svg/light/web_light_rd_SU.svg";
import MicrosoftSignInLight from "./ms-symbollockup_signin_light.svg";

// Registration form validation schema
const registerSchema = z
  .object({
    companyName: z.string().min(2, "Company name must be at least 2 characters"),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, "You must agree to the terms and conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const router = useRouter();
  const { signUp, signInWithGoogle, loading, error, clearError } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [registrationCompleted, setRegistrationCompleted] = React.useState(false);
  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    clearError();
 
    try {
      // Split full name into first and last name
      const nameParts = data.fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
 
      await signUp(data.email, data.password, {
        firstName,
        lastName,
        companyName: data.companyName,
      });
 
      // Toon een duidelijke bevestigingsboodschap i.p.v. redirect naar login/verify pagina
      setRegisteredEmail(data.email);
      setRegistrationCompleted(true);
    } catch (err) {
      // Error is handled by AuthProvider
      console.error("Registration failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    clearError();

    try {
      await signInWithGoogle();
      // After Google sign-up, redirect to dashboard or profile completion
      router.push("/dashboard");
    } catch (err) {
      // Error is handled by AuthProvider
      console.error("Google sign-up failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder handler for Microsoft OpenID Connect / OAuth2 via backend.
  // When backend is ready, replace the console.log with a redirect to your
  // own authorization endpoint (for example: `/api/auth/microsoft`).
  const handleMicrosoftSignUp = async () => {
    setIsLoading(true);
    clearError();

    try {
      console.log("Microsoft OpenID Connect / OAuth2 signup via backend - TODO");
      // Example future implementation:
      // window.location.href = "/api/auth/microsoft";
    } catch (err) {
      console.error("Microsoft sign-up failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const SocialAuthButton: React.FC<{
    provider: "google" | "microsoft";
    disabled: boolean;
  }> = ({ provider, disabled }) => {
    const isGoogle = provider === "google";

    const label = isGoogle ? "Registreren met Google" : "Registreren met Microsoft";
    const iconSrc = isGoogle ? GoogleSignUpLight : MicrosoftSignInLight;
    const iconAlt = isGoogle ? "Sign up with Google" : "Sign in with Microsoft";

    return (
      <button
        type="button"
        onClick={isGoogle ? handleGoogleSignUp : handleMicrosoftSignUp}
        disabled={disabled}
        className="w-full p-0 bg-transparent border-none shadow-none hover:bg-transparent focus:outline-none focus-visible:outline-none"
        style={{ outline: "none", boxShadow: "none" }}
        aria-label={label}
      >
        <Image src={iconSrc} alt={iconAlt} className="w-full h-auto" />
      </button>
    );
  };

  return (
    <AuthLayout title={t("title")} subtitle={t("subtitle")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {registrationCompleted && (
          <Alert variant="success">
            {registeredEmail
              ? `Your account has been created. Please check ${registeredEmail} to verify your email address before logging in.`
              : "Your account has been created. Please check your email to verify your registration before logging in."}
          </Alert>
        )}
        {error && (
          <Alert variant="error" onClose={clearError}>
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              {t("companyName")}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("companyName")}
              id="companyName"
              type="text"
              autoComplete="organization"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.companyName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={t("companyNamePlaceholder")}
              disabled={isLoading}
            />
            {errors.companyName && (
              <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              {t("fullName")}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("fullName")}
              id="fullName"
              type="text"
              autoComplete="name"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.fullName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={t("fullNamePlaceholder")}
              disabled={isLoading}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t("workEmail")}
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
              placeholder={t("workEmailPlaceholder")}
              disabled={isLoading}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {t("password")}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("password")}
              id="password"
              type="password"
              autoComplete="new-password"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={t("passwordPlaceholder")}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">{t("passwordHint")}</p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("confirmPassword")}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("confirmPassword")}
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={t("confirmPasswordPlaceholder")}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-start">
          <input
            {...register("agreeToTerms")}
            id="agreeToTerms"
            type="checkbox"
            className="h-4 w-4 mt-0.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isLoading}
          />
          <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
            {t("agreeToTerms")}{" "}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              {t("termsOfService")}
            </Link>{" "}
            {t("and")}{" "}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              {t("privacyPolicy")}
            </Link>
            <span className="text-red-500 ml-1">*</span>
          </label>
        </div>
        {errors.agreeToTerms && (
          <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={isLoading || loading}
          disabled={isLoading || loading}
          className="w-full"
        >
          {isLoading || loading ? t("creatingAccount") : t("createAccount")}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">{t("orSignUpWith")}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Social auth buttons: shared component, alphabetical order (Google, Microsoft), equal size */}
          <SocialAuthButton provider="google" disabled={isLoading || loading} />
          <SocialAuthButton provider="microsoft" disabled={isLoading || loading} />
        </div>

        <p className="text-center text-sm text-gray-600">
          {t("alreadyHaveAccount")}{" "}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            {t("signIn")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
