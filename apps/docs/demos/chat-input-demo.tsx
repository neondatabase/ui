"use client";

import { ChatInput } from "@neon-ui/registry/components/agent-chat/agent-chat";
import {
  defaultModelId,
  gatewayModels,
} from "@neon-ui/registry/components/model-select/fixtures";
import { ThinkingModelSelect } from "@neon-ui/registry/components/thinking-model-select/thinking-model-select";
import type { ThinkingEffort } from "@neon-ui/registry/components/thinking-select/thinking-select";
import { useState } from "react";

export default function ChatInputDemo() {
  const [model, setModel] = useState(defaultModelId);
  const [effort, setEffort] = useState<ThinkingEffort>("medium");
  const [sent, setSent] = useState<string | null>(null);

  return (
    <div className="w-full max-w-md space-y-3">
      <ChatInput
        className="rounded-lg border"
        controls={
          <ThinkingModelSelect
            effort={effort}
            models={gatewayModels}
            onEffortChange={setEffort}
            onValueChange={setModel}
            size="sm"
            value={model}
          />
        }
        onSend={setSent}
      />
      {sent ? (
        <p className="font-mono text-muted-foreground text-xs">sent: {sent}</p>
      ) : null}
    </div>
  );
}
