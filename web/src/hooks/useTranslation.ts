"use client";

import { useTranslations } from "next-intl";

export function useTranslation() {
  return {
    t: useTranslations(),
    nav: useTranslations("nav"),
    auth: useTranslations("auth"),
    common: useTranslations("common"),
    validation: useTranslations("validation"),
    errors: useTranslations("errors"),
    safety: useTranslations("safety"),
    dashboard: useTranslations("dashboard"),
  };
}

// Convenience hooks for specific namespaces
export function useNavTranslation() {
  return useTranslations("nav");
}

export function useAuthTranslation() {
  return useTranslations("auth");
}

export function useCommonTranslation() {
  return useTranslations("common");
}

export function useValidationTranslation() {
  return useTranslations("validation");
}

export function useErrorTranslation() {
  return useTranslations("errors");
}

export function useSafetyTranslation() {
  return useTranslations("safety");
}

export function useDashboardTranslation() {
  return useTranslations("dashboard");
}
