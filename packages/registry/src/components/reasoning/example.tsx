import type { UIMessage } from "ai";

import { Reasoning, ReasoningContent, ReasoningTrigger } from "./reasoning";

/**
 * Render a message's reasoning from AI SDK `useChat`. Consolidates every
 * reasoning part into one block — models like GPT with high reasoning
 * effort emit several parts, and one fold beats a stack of "Thinking…"
 * indicators. Streaming is live when the message is still being
 * generated and its last part is reasoning.
 */
export const ReasoningExample = ({
  isStreaming,
  message,
}: {
  message: UIMessage;
  /** Whether this message is still being generated. */
  isStreaming: boolean;
}) => {
  const reasoningParts = message.parts.filter(
    (part) => part.type === "reasoning"
  );

  if (reasoningParts.length === 0) {
    return null;
  }

  const text = reasoningParts.map((part) => part.text).join("\n\n");
  const live = isStreaming && message.parts.at(-1)?.type === "reasoning";

  return (
    <Reasoning isStreaming={live}>
      <ReasoningTrigger />
      <ReasoningContent>{text}</ReasoningContent>
    </Reasoning>
  );
};
