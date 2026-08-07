"use client";

import { useEffect, useMemo, useState } from "react";

/** Structurally compatible with ModelSelect's AiModel. */
export interface GatewayModel {
  /** Gateway model id in short form, e.g. "gpt-5-2". */
  id: string;
  /** Human-readable name, e.g. "GPT-5.2". */
  name: string;
  /** Provider name used for grouping, e.g. "OpenAI". */
  provider: string;
  /** Whether the model supports extended reasoning. */
  reasoning?: boolean;
}

export type GatewayModelsStatus = "loading" | "ready" | "error";

export interface UseGatewayModelsOptions {
  /**
   * URL of the catalog endpoint. Point it at your server-side proxy in
   * front of the gateway's `GET /v1/models` — the bearer token must not
   * ship to the browser. Accepts either the raw OpenAI-compatible shape
   * (`{ data: [...] }`, filtered to enabled models) or a pre-shaped
   * `{ models: GatewayModel[] }` payload.
   */
  endpoint?: string;
  /** Preferred model id; wins whenever the catalog includes it. */
  defaultModel?: string;
}

/** Raw entry from the gateway's OpenAI-compatible `GET /v1/models`. */
interface RawGatewayModel {
  id: string;
  name?: string;
  owned_by?: string;
  enabled?: boolean;
}

/** Display names for `owned_by` slugs the gateway reports. */
const PROVIDER_NAMES: Record<string, string> = {
  alibaba: "Alibaba",
  anthropic: "Anthropic",
  databricks: "Databricks",
  google: "Google",
  meta: "Meta",
  "meta-llama": "Meta",
  mistral: "Mistral",
  moonshot: "Moonshot AI",
  openai: "OpenAI",
  qwen: "Qwen",
  zhipu: "Zhipu AI",
};

const shapeModels = (payload: unknown): GatewayModel[] => {
  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  // Pre-shaped proxy response: { models: GatewayModel[] }.
  if ("models" in payload && Array.isArray(payload.models)) {
    return payload.models as GatewayModel[];
  }

  // OpenAI-compatible response: { data: [...] }, keep enabled models only.
  if ("data" in payload && Array.isArray(payload.data)) {
    return (payload.data as RawGatewayModel[])
      .filter((model) => model.enabled !== false)
      .map((model) => ({
        id: model.id,
        name: model.name || model.id,
        provider:
          PROVIDER_NAMES[model.owned_by ?? ""] ?? model.owned_by ?? "Other",
      }));
  }

  return [];
};

/**
 * The live model catalog of a Neon AI Gateway branch, with a selection
 * that is always valid against it: an explicit pick wins while listed,
 * then `defaultModel` when listed, then the first available model.
 * Hardcoded ids the gateway has not enabled can never be submitted.
 */
export const useGatewayModels = ({
  defaultModel,
  endpoint = "/api/models",
}: UseGatewayModelsOptions = {}): {
  /** The selected, catalog-validated model id; undefined while empty. */
  model: string | undefined;
  /** Enabled models on this gateway branch, shaped for ModelSelect. */
  models: GatewayModel[];
  setModel: (id: string) => void;
  status: GatewayModelsStatus;
} => {
  const [models, setModels] = useState<GatewayModel[]>([]);
  const [status, setStatus] = useState<GatewayModelsStatus>("loading");
  const [picked, setPicked] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(endpoint, { signal: controller.signal });

        if (!response.ok) {
          setStatus("error");
          return;
        }

        setModels(shapeModels(await response.json()));
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) {
          setStatus("error");
        }
      }
    })();

    return () => controller.abort();
  }, [endpoint]);

  // Derived, never snapped: the selection re-validates on every render,
  // so a stale pick heals itself if the catalog changes underneath it.
  const model = useMemo(() => {
    const listed = (id: string | undefined) =>
      id !== undefined && models.some((entry) => entry.id === id);

    if (listed(picked)) {
      return picked;
    }
    if (listed(defaultModel)) {
      return defaultModel;
    }
    return models[0]?.id;
  }, [models, picked, defaultModel]);

  return { model, models, setModel: setPicked, status };
};
