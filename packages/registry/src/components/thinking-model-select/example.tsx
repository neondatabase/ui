"use client";

import { useState } from "react";

import type { ThinkingEffort } from "../thinking-select/thinking-select";
import { gatewayModels } from "./fixtures";
import { ThinkingModelSelect } from "./thinking-model-select";

/**
 * The selection pair maps directly onto a Neon AI Gateway chat call:
 * the model id goes in `model`, the effort in `reasoning_effort`
 * (omitted when thinking is off).
 */
export const ThinkingModelSelectExample = ({
  onSubmit,
}: {
  onSubmit: (body: {
    model: string;
    reasoning_effort?: Exclude<ThinkingEffort, "off">;
  }) => void;
}) => {
  const [model, setModel] = useState("gpt-5-2");
  const [effort, setEffort] = useState<ThinkingEffort>("medium");

  return (
    <div className="flex items-center gap-2">
      <ThinkingModelSelect
        effort={effort}
        models={gatewayModels}
        onEffortChange={setEffort}
        onValueChange={setModel}
        value={model}
      />
      <button
        className="h-8 border border-border/60 px-3 text-xs transition-colors hover:border-border"
        onClick={() =>
          onSubmit({
            model,
            ...(effort === "off" ? {} : { reasoning_effort: effort }),
          })
        }
        type="button"
      >
        Send
      </button>
    </div>
  );
};
