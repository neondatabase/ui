import type { AuthProvider } from "./auth-form";

/** OAuth providers a Better Auth app commonly wires up. */
export const sampleProviders: AuthProvider[] = [
  { id: "github", label: "GitHub" },
  { id: "google", label: "Google" },
];

/** A structured failure the way the API reports it. */
export const sampleError = "That email and password don't match.";

/** A server-side verdict pinned to one field. */
export const sampleFieldErrors = {
  password: "Incorrect password.",
};
