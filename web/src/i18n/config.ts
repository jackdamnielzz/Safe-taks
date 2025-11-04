import { getRequestConfig } from "next-intl/server";

// Can be imported from a shared config
export const locales = ["nl"] as const;
export const defaultLocale = "nl" as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  // Note: notFound() cannot be used in root layout context, so we default to "nl"
  const validLocale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default,
    timeZone: "Europe/Amsterdam",
    now: new Date(),
  };
});
