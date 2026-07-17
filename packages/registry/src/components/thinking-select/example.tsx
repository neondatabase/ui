"use client";

import { useState } from "react";

import { ThinkingSelect } from "./thinking-select";
import type { ThinkingEffort } from "./thinking-select";

/**
 * The selected effort maps directly onto the AI SDK's provider options for
 * a Neon AI Gateway chat call (OpenAI-compatible `reasoning_effort`).
 */
export const ThinkingSelectExample = ({
  onSubmit,
}: {
  onSubmit: (body: {
    model: string;
    reasoning_effort?: Exclude<ThinkingEffort, "off">;
  }) => void;
}) => {
  const [effort, setEffort] = useState<ThinkingEffort>("off");

  return (
    <div className="flex items-center gap-2">
      <ThinkingSelect onValueChange={setEffort} value={effort} />
      <button
        className="h-8 border border-border/60 px-3 text-xs transition-colors hover:border-border"
        onClick={() =>
          onSubmit({
            model: "neon/claude-sonnet-4-6",
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
