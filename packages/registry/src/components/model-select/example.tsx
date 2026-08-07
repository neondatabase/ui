"use client";

import { useEffect, useState } from "react";

import { ModelSelect } from "./model-select";
import type { AiModel } from "./model-select";

/**
 * Shape of the models.dev catalog: providers keyed by id, models keyed
 * by model id. The Neon AI Gateway is published as the `neon` provider —
 * swap the key to point the same code at any other gateway on models.dev.
 */
type ModelsDevResponse = Record<
  string,
  {
    models: Record<
      string,
      { id: string; name: string; family: string; reasoning: boolean }
    >;
  }
>;

/** Upstream lab, derived from the models.dev family id. */
const FAMILY_PROVIDERS: [prefix: string, label: string][] = [
  ["claude", "Anthropic"],
  ["gemini", "Google"],
  ["gemma", "Google"],
  ["gpt", "OpenAI"],
  ["glm", "Zhipu AI"],
  ["kimi", "Moonshot AI"],
  ["ling", "Thinking Machines"],
  ["llama", "Meta"],
  ["qwen", "Alibaba"],
];

const providerOf = (family: string) =>
  FAMILY_PROVIDERS.find(([prefix]) => family.startsWith(prefix))?.[1] ?? family;

/**
 * Client component: list the Neon AI Gateway catalog from models.dev
 * and let the user pick a model. `fallbackToFirst` keeps the selection
 * inside the fetched catalog — never hardcode a default id, since a
 * given gateway branch may not have it enabled. To list only the models
 * enabled for a specific project, fetch the gateway's OpenAI-compatible
 * `GET /v1/models` through a server proxy instead — the
 * `use-gateway-models` hook wraps that pattern, including the
 * catalog-validated selection.
 */
export const ModelSelectExample = () => {
  const [models, setModels] = useState<AiModel[]>([]);
  const [model, setModel] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch("https://models.dev/api.json", {
          signal: controller.signal,
        });
        const payload = (await response.json()) as ModelsDevResponse;

        setModels(
          Object.values(payload.neon?.models ?? {}).map((entry) => ({
            id: entry.id,
            name: entry.name,
            provider: providerOf(entry.family),
            reasoning: entry.reasoning,
          }))
        );
      } catch {
        // Surface fetch errors through your app's error channel.
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <ModelSelect
      fallbackToFirst
      models={models}
      onValueChange={setModel}
      value={model}
    />
  );
};
