"use client";

import { useState } from "react";

import type { AppPlan } from "@/components/status-badge/status-badge";

import { AppCreator } from "./app-creator";

/**
 * Wire the creator to your API layer: create a Neon project for the app
 * (`POST /projects`), then hand the prompt to the agent.
 */
export const AppCreatorExample = ({
  createApp,
}: {
  createApp: (input: {
    prompt: string;
    plan: AppPlan;
  }) => Promise<{ projectId: string }>;
}) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (prompt: string, plan: AppPlan) => {
    setIsCreating(true);

    try {
      const { projectId } = await createApp({ plan, prompt });
      window.location.assign(`/apps/${projectId}`);
    } finally {
      setIsCreating(false);
    }
  };

  return <AppCreator isCreating={isCreating} onCreate={handleCreate} />;
};
