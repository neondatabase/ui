"use client";

import { useEffect, useState } from "react";

import { ModelSelect } from "./model-select";
import type { AiModel } from "./model-select";

/**
 * Shape of neon.com/models.json — the machine-readable source of truth
 * for the Neon AI Gateway catalog (also published as the `neon` provider
 * on models.dev).
 */
interface NeonModelsResponse {
  neon: {
    models: Record<
      string,
      { id: string; name: string; provider: string; reasoning: boolean }
    >;
  };
}

const PROVIDER_NAMES: Record<string, string> = {
  alibaba: "Alibaba",
  google: "Google",
  meta: "Meta",
  openai: "OpenAI",
};

/**
 * Client component: list the live Neon AI Gateway catalog and let the
 * user pick a model. To list only the models enabled for a specific
 * project, use the gateway's OpenAI-compatible `GET /v1/models` with a
 * bearer token instead.
 */
export const ModelSelectExample = () => {
  const [models, setModels] = useState<AiModel[]>([]);
  const [model, setModel] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch("https://neon.com/models.json", {
          signal: controller.signal,
        });
        const payload = (await response.json()) as NeonModelsResponse;

        setModels(
          Object.values(payload.neon.models).map((entry) => ({
            id: entry.id,
            name: entry.name,
            provider: PROVIDER_NAMES[entry.provider] ?? entry.provider,
            reasoning: entry.reasoning,
          }))
        );
      } catch {
        // Surface fetch errors through your app's error channel.
      }
    })();

    return () => controller.abort();
  }, []);

  return <ModelSelect models={models} onValueChange={setModel} value={model} />;
};
