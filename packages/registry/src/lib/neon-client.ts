import { createApiClient } from "@neondatabase/api-client";

/**
 * Shared Neon API client factory for neon-ui data hooks.
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

  return createApiClient({ apiKey });
};

export type NeonClient = ReturnType<typeof createNeonClient>;
