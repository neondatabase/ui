import type { UIMessagePart, UIDataTypes, UITools } from "ai";

import { ToolCallChip } from "./tool-call-chip";
import type { ToolCallState } from "./tool-call-chip";

/** Map an AI SDK tool part's state onto the chip's lifecycle. */
const chipState = (state: string): ToolCallState => {
  if (state === "output-error") {
    return "error";
  }

  return state === "output-available" ? "done" : "running";
};

/**
 * Render the tool invocations from an AI SDK message part list, e.g.
 * `message.parts` from `useChat`.
 */
export const ToolCallChipExample = ({
  parts,
}: {
  parts: UIMessagePart<UIDataTypes, UITools>[];
}) => (
  <div className="flex flex-wrap gap-2">
    {parts.map((part, index) => {
      if (part.type === "dynamic-tool") {
        return (
          <ToolCallChip
            key={`${part.toolName}-${index.toString()}`}
            name={part.toolName}
            state={chipState(part.state)}
          />
        );
      }

      if (part.type.startsWith("tool-") && "state" in part) {
        return (
          <ToolCallChip
            key={`${part.type}-${index.toString()}`}
            name={part.type.slice("tool-".length)}
            state={chipState(String(part.state))}
          />
        );
      }

      return null;
    })}
  </div>
);
