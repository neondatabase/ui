import { createNeonClient as createSdkClient } from "@neon/sdk";

/**
 * Shared Neon API client factory for neon-ui data hooks.
 *
 * Wraps `@neon/sdk`, the official TypeScript SDK for the Neon API. Methods are
 * grouped into resource namespaces (`neon.branches`, `neon.postgres.endpoints`,
 * `neon.consumption`, ...) and resolve to `{ data, error }` rather than
 * throwing, so a failed call is handled where it happens.
 *
 * The API key must come from the server side (route handler, server
 * component, or server function). Never expose NEON_API_KEY to the browser;
 * browser-facing components should receive data as props or go through the
 * Data API, which is designed for untrusted clients.
 */
export const createNeonClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error(
      "neon-ui: missing Neon API key. Pass process.env.NEON_API_KEY from server-side code."
    );
  }

  return createSdkClient({ apiKey });
};

export type NeonClient = ReturnType<typeof createNeonClient>;
