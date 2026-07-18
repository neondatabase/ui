/** The provisioning step sequence the demo cycles through. */
export const provisioningSteps = [
  "Creating Neon project…",
  "Provisioning database…",
  "Scaffolding application…",
  "Starting sandbox…",
] as const;

export const sampleErrorDetail =
  "Compute quota exceeded on the free plan. Retry or upgrade to continue.";
