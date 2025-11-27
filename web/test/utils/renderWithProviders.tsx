/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, react/display-name */
import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * Test render wrapper that mounts components with the app AuthProvider
 * and a lightweight next/router mock so components using useAuth/useRouter
 * can render inside tests.
 *
 * Usage:
 *   import { renderWithProviders } from 'web/test/utils/renderWithProviders';
 *   renderWithProviders(<MyComponent />);
 *
 * Note: This file keeps the wrapper minimal; individual tests can still mock
 * or override auth/router behaviour as needed.
 */

// Provide a next/navigation mock for tests if not already mocked by jest.setup.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nextNav = require("next/navigation");
  if (!nextNav || typeof nextNav.useRouter !== "function") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    jest.mock("next/navigation", () => ({
      useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn().mockResolvedValue(undefined),
        pathname: "/",
        query: {},
        back: jest.fn(),
      }),
    }));
  }
} catch (e) {
  // ignore outside jest
}

// Import AuthProvider if available; otherwise use a lightweight fallback.
let AuthProvider: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AuthProvider = require("@/components/AuthProvider").default;
} catch (e) {
  const FallbackContext = React.createContext({
    user: { uid: "test-user", email: "test@example.com" },
    userProfile: { organizationId: "test-org" },
  });
  AuthProvider = ({ children }: { children: React.ReactNode }) => (
    <FallbackContext.Provider
      value={{ user: { uid: "test-user", email: "test@example.com" }, userProfile: { organizationId: "test-org" } }}
    >
      {children}
    </FallbackContext.Provider>
  );
  AuthProvider.displayName = "FallbackAuthProvider";
}

/**
 * Render UI with providers.
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, {
    wrapper: ({ children }: { children?: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>,
    ...options,
  });
}

export * from "@testing-library/react";