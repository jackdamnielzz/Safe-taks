import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { NextIntlProvider } from "next-intl";

// Import the Dutch messages for tests
import nlMessages from "@/i18n/locales/nl.json";

// Import AuthProvider fallback util (renderWithProviders uses AuthProvider wrapper)
// Reuse the simple AuthProvider fallback created earlier by renderWithProviders.
import { renderWithProviders } from "./renderWithProviders";

/**
 * Render with AuthProvider + NextIntlProvider (nl) + optional router mock already provided by renderWithProviders.
 *
 * Usage:
 *   import { renderWithProvidersIntl } from 'web/test/utils/withProviders';
 *   renderWithProvidersIntl(<MyComponent />);
 */

export function renderWithProvidersIntl(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  const Wrapper = ({ children }: { children?: React.ReactNode }) => (
    <NextIntlProvider messages={nlMessages}>
      {children}
    </NextIntlProvider>
  );

  // Compose Intl wrapper around the UI and reuse renderWithProviders to apply AuthProvider/router mocks.
  return renderWithProviders(<Wrapper>{ui}</Wrapper>, options);
}

export * from "@testing-library/react";