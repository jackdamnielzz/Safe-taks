/**
 * Canonical Jest mock for `next-intl`.
 *
 * Goals:
 * - Deterministic Dutch translations for keys used in core TemplateSelector/TraWizard/VCA flows.
 * - Stable API surface: useTranslations, useFormatter, NextIntlClientProvider.
 * - No side effects, no environment checks, no console noise in normal runs.
 *
 * NOTE:
 * - Keys not in the map fall back to the key string; tests that rely on specific Dutch text
 *   must assert only for keys that are defined here.
 */

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
const React = require("react");

/**
 * Minimal, curated translation map.
 * Keep this aligned with:
 * - web/src/i18n/locales/nl.json
 * - Expectations in:
 *   - web/src/__tests__/template-selector.test.tsx
 *   - web/src/__tests__/tra-wizard.template-load.test.tsx
 *   - web/src/__tests__/next-intl-mock-test.test.ts
 *   - web/src/__tests__/next-intl-debug.test.ts
 */
const translations = {
  // Template selector
  "templates.selector.title": "Templates",
  "templates.selector.subtitle": "Kies een TRA-template om snel te starten",
  "templates.selector.startFromScratch": "Begin zonder template",

  // Generic template labels
  "templates.startFromScratch": "Begin zonder template",

  // Wizard core
  "wizard.createTitle": "TRA Aanmaken",
  "wizard.titleLabel": "TRA Titel",
  "wizard.descriptionLabel": "Beschrijving",
  "wizard.projectRequired": "Project is verplicht",
  "wizard.next": "Volgende",
  "wizard.back": "Terug",

  // Common labels used in tests
  Titel: "Titel",
  Volgende: "Volgende",
  Terug: "Terug",
};

/**
 * useTranslations(namespace?): (key, params?) => string
 * - If namespace is provided, tests should pass fully qualified keys including that namespace,
 *   which matches how app code is structured.
 * - For simplicity and robustness in tests, this mock:
 *   - First tries the key as-is.
 *   - Then tries `${namespace}.${key}` if a namespace was given.
 */
function useTranslations(namespace) {
  return (key, params) => {
    const candidates = [];
    if (typeof key === "string") {
      candidates.push(key);
      if (namespace) {
        candidates.push(`${namespace}.${key}`);
      }
    }

    let result =
      candidates
        .map((k) => translations[k])
        .find((v) => typeof v === "string") || key;

    if (params && typeof params === "object") {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(
          new RegExp(`\\{${paramKey}\\}`, "g"),
          String(paramValue)
        );
      }
    }

    return result;
  };
}

/**
 * useFormatter mock:
 * - Matches the minimal usage patterns in the app (date/number formatting).
 */
function useFormatter() {
  return {
    formatDate: (d) =>
      d ? new Date(d).toLocaleString("nl-NL") : "",
    formatNumber: (n) =>
      n === null || n === undefined
        ? ""
        : new Intl.NumberFormat("nl-NL").format(n),
  };
}

/**
 * NextIntlClientProvider mock:
 * - No-op provider; just renders children.
 */
function NextIntlClientProvider({ children }) {
  return React.createElement(React.Fragment, null, children);
}

const nextIntl = {
  useTranslations,
  useFormatter,
  NextIntlClientProvider,
};

module.exports = nextIntl;
module.exports.default = nextIntl;
module.exports.useTranslations = useTranslations;
module.exports.useFormatter = useFormatter;
module.exports.NextIntlClientProvider = NextIntlClientProvider;
