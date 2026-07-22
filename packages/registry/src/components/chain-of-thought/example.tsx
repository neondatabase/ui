import type { UIMessage } from "ai";

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "./chain-of-thought";
import type { ChainOfThoughtStepStatus } from "./chain-of-thought";

/** Map an AI SDK tool part's state onto a step status. */
const stepStatus = (state: string): ChainOfThoughtStepStatus => {
  if (state === "output-available" || state === "output-error") {
    return "complete";
  }

  return "active";
};

/**
 * Render a message's tool invocations as a chain of thought, one step
 * per call, from AI SDK `useChat`. Open the fold by default while the
 * message streams so the reader watches steps land.
 */
export const ChainOfThoughtExample = ({
  isStreaming,
  message,
}: {
  message: UIMessage;
  /** Whether this message is still being generated. */
  isStreaming: boolean;
}) => {
  const steps = message.parts.flatMap((part) => {
    if (part.type === "dynamic-tool") {
      return [{ label: part.toolName, status: stepStatus(part.state) }];
    }

    if (
      part.type.startsWith("tool-") &&
      "state" in part &&
      "toolCallId" in part
    ) {
      return [
        {
          label: part.type.slice("tool-".length),
          status: stepStatus(String(part.state)),
        },
      ];
    }

    return [];
  });

  if (steps.length === 0) {
    return null;
  }

  return (
    <ChainOfThought defaultOpen={isStreaming}>
      <ChainOfThoughtHeader />
      <ChainOfThoughtContent>
        {steps.map((step, index) => (
          <ChainOfThoughtStep
            key={`${step.label}-${index.toString()}`}
            label={step.label}
            status={step.status}
          />
        ))}
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
};
