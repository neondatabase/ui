import type { AiModel } from "./model-select";

/**
 * The full Neon AI Gateway catalog, snapshotted from neon.com/models.json
 * (the machine-readable source of truth). Ids are the short form the
 * gateway accepts in the `model` field; `open` tags mark open-weight
 * models available to every project.
 */
export const gatewayModels: AiModel[] = [
  {
    id: "gpt-oss-120b",
    name: "GPT OSS 120B",
    provider: "OpenAI",
    reasoning: true,
    tag: "open",
  },
  {
    id: "gpt-oss-20b",
    name: "GPT OSS 20B",
    provider: "OpenAI",
    reasoning: true,
    tag: "open",
  },
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gpt-5-nano",
    name: "GPT-5 Nano",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gpt-5-1",
    name: "GPT-5.1",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gpt-5-1-codex-max",
    name: "GPT-5.1 Codex Max",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gpt-5-1-codex-mini",
    name: "GPT-5.1 Codex mini",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gpt-5-2",
    name: "GPT-5.2",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gpt-5-2-codex",
    name: "GPT-5.2 Codex",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gpt-5-3-codex",
    name: "GPT-5.3 Codex",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gpt-5-4",
    name: "GPT-5.4",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gpt-5-4-mini",
    name: "GPT-5.4 mini",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gpt-5-4-nano",
    name: "GPT-5.4 nano",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gemini-2-5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    reasoning: true,
  },
  {
    id: "gemini-2-5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    reasoning: true,
  },
  {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash Preview",
    provider: "Google",
    reasoning: true,
  },
  {
    id: "gemini-3-pro",
    name: "Gemini 3 Pro Preview",
    provider: "Google",
    reasoning: true,
  },
  {
    id: "gemini-3-1-flash-lite",
    name: "Gemini 3.1 Flash Lite Preview",
    provider: "Google",
    reasoning: true,
  },
  {
    id: "gemini-3-1-pro",
    name: "Gemini 3.1 Pro Preview Custom Tools",
    provider: "Google",
    reasoning: true,
  },
  {
    id: "gemini-3-5-flash",
    name: "Gemini 3.5 Flash",
    provider: "Google",
    reasoning: true,
  },
  {
    id: "gemma-3-12b",
    name: "Gemma 3 12B",
    provider: "Google",
    reasoning: false,
    tag: "open",
  },
  {
    id: "meta-llama-3-1-8b-instruct",
    name: "Llama 3.1 8B Instruct",
    provider: "Meta",
    reasoning: false,
    tag: "open",
  },
  {
    id: "llama-4-maverick",
    name: "Llama 4 Maverick 17B Instruct",
    provider: "Meta",
    reasoning: false,
    tag: "open",
  },
  {
    id: "meta-llama-3-3-70b-instruct",
    name: "Llama-3.3-70B-Instruct",
    provider: "Meta",
    reasoning: false,
    tag: "open",
  },
  {
    id: "qwen3-next-80b-a3b-instruct",
    name: "Qwen3-Next 80B-A3B Instruct",
    provider: "Alibaba",
    reasoning: false,
    tag: "open",
  },
  {
    id: "qwen35-122b-a10b",
    name: "Qwen3.5 122B-A10B",
    provider: "Alibaba",
    reasoning: true,
    tag: "open",
  },
];

export const defaultModelId = "gpt-5-2";
