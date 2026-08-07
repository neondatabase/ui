import type { AiModel } from "./model-select";

/**
 * The full Neon AI Gateway catalog, snapshotted from the neon provider
 * on models.dev (models.dev/providers/neon), the machine-readable
 * source of truth. Ids are the short form the gateway accepts in the
 * `model` field; `open` tags mark open-weight models available to
 * every project.
 */
export const gatewayModels: AiModel[] = [
  {
    id: "claude-fable-5",
    name: "Claude Fable 5",
    provider: "Anthropic",
    reasoning: true,
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5 (latest)",
    provider: "Anthropic",
    reasoning: true,
  },
  {
    id: "claude-opus-4-1",
    name: "Claude Opus 4.1 (latest)",
    provider: "Anthropic",
    reasoning: true,
  },
  {
    id: "claude-opus-4-5",
    name: "Claude Opus 4.5 (latest)",
    provider: "Anthropic",
    reasoning: true,
  },
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    provider: "Anthropic",
    reasoning: true,
  },
  {
    id: "claude-opus-4-7",
    name: "Claude Opus 4.7",
    provider: "Anthropic",
    reasoning: true,
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    provider: "Anthropic",
    reasoning: true,
  },
  {
    id: "claude-opus-5",
    name: "Claude Opus 5",
    provider: "Anthropic",
    reasoning: true,
  },
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5 (latest)",
    provider: "Anthropic",
    reasoning: true,
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "Anthropic",
    reasoning: true,
  },
  {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    provider: "Anthropic",
    reasoning: true,
  },
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
    id: "gpt-5-2",
    name: "GPT-5.2",
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
    id: "gpt-5-5",
    name: "GPT-5.5",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gpt-5-5-pro",
    name: "GPT-5.5 Pro",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gpt-5-6-luna",
    name: "GPT-5.6 Luna",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gpt-5-6-sol",
    name: "GPT-5.6 Sol",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gpt-5-6-terra",
    name: "GPT-5.6 Terra",
    provider: "OpenAI",
    reasoning: true,
  },
  {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash Preview",
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
    id: "gemini-3-5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    provider: "Google",
    reasoning: true,
  },
  {
    id: "gemini-3-6-flash",
    name: "Gemini 3.6 Flash",
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
  {
    id: "glm-5-2",
    name: "GLM-5.2",
    provider: "Zhipu AI",
    reasoning: true,
    tag: "open",
  },
  {
    id: "inkling",
    name: "Inkling",
    provider: "Thinking Machines",
    reasoning: true,
    tag: "open",
  },
  {
    id: "kimi-k3",
    name: "Kimi K3",
    provider: "Moonshot AI",
    reasoning: true,
    tag: "open",
  },
];

export const defaultModelId = "gpt-5-2";
