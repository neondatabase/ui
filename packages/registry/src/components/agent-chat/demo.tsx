"use client";

import { useChat } from "@ai-sdk/react";
import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";

import { defaultModelId, gatewayModels } from "../model-select/fixtures";
import { ThinkingModelSelect } from "../thinking-model-select/thinking-model-select";
import type { ThinkingEffort } from "../thinking-select/thinking-select";
import { AgentChat } from "./agent-chat";
import { buildAgentConversation } from "./fixtures";

/**
 * Brand marks from theSVG, applied as alpha masks filled with
 * currentColor so they always match the surrounding text color.
 */
const logo = (slug: string) => {
  const url = `url(https://thesvg.org/icons/${slug}/default.svg)`;
  const style: CSSProperties = {
    WebkitMaskImage: url,
    WebkitMaskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskImage: url,
    maskPosition: "center",
    maskRepeat: "no-repeat",
    maskSize: "contain",
  };

  return <span className="block bg-current" style={style} />;
};

const providerLogos: Record<string, ReactNode> = {
  Alibaba: logo("alibaba"),
  Anthropic: logo("anthropic"),
  Google: logo("google"),
  Meta: logo("meta"),
  OpenAI: logo("openai"),
};

export const AgentChatDemo = () => {
  const chat = useMemo(() => buildAgentConversation(), []);
  const [model, setModel] = useState(defaultModelId);
  const [effort, setEffort] = useState<ThinkingEffort>("medium");
  const { messages, sendMessage, status } = useChat({
    messages: chat.get(0),
    transport: chat.transport(),
  });

  const modelName = gatewayModels.find((entry) => entry.id === model)?.name;

  return (
    <AgentChat
      activeControls={{ effort, model, modelName }}
      className="h-[420px] w-full max-w-md border border-border/60 bg-background"
      controls={
        <ThinkingModelSelect
          effort={effort}
          logos={providerLogos}
          models={gatewayModels}
          onEffortChange={setEffort}
          onValueChange={setModel}
          size="sm"
          value={model}
        />
      }
      messages={messages}
      onSend={() => {
        const next = chat.next(messages);

        if (next) {
          sendMessage({
            ...next,
            metadata: { effort, model, modelName },
          });
        }
      }}
      placeholder="Press send to play the scripted turn…"
      status={status}
    />
  );
};

export default AgentChatDemo;
