import type { ReactNode } from "react";

/** Copy for the surfaces that reuse the empty state. */
export const emptyStates: Record<
  "apps" | "checkpoints" | "usage",
  { description: string; title: string; actionLabel?: ReactNode }
> = {
  apps: {
    actionLabel: "Create your first app",
    description:
      "Describe what you want to build and the agent scaffolds it with a Neon database attached.",
    title: "No apps yet",
  },
  checkpoints: {
    description:
      "Checkpoints appear as the agent saves working versions of your app.",
    title: "No checkpoints",
  },
  usage: {
    description: "Usage data shows up after your first agent run.",
    title: "Nothing to report",
  },
};
