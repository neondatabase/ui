import type { AuthProvider } from "./auth-form";

/** OAuth providers a Better Auth app commonly wires up. */
export const sampleProviders: AuthProvider[] = [
  { id: "github", label: "GitHub" },
  { id: "google", label: "Google" },
];

/** A server-side verdict pinned to one field. */
export const sampleFieldErrors = {
  password: "Incorrect password.",
};
