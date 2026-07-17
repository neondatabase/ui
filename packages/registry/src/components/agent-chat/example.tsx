"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

import { gatewayModels } from "../model-select/fixtures";
import { ThinkingModelSelect } from "../thinking-model-select/thinking-model-select";
import type { ThinkingEffort } from "../thinking-select/thinking-select";
import { AgentChat } from "./agent-chat";

/**
 * Real wiring: stream a Neon-hosted agent (e.g. a Mastra agent on a Neon
 * Function) directly from the browser with a short-lived JWT, so the app
 * server never sits in the path of the long stream. Model and effort ride
 * along in the request body.
 */
export const AgentChatExample = ({
  agentUrl,
  getToken,
  prototypeId,
}: {
  agentUrl: string;
  getToken: () => Promise<string>;
  prototypeId: string;
}) => {
  const [model, setModel] = useState("gpt-5-2");
  const [effort, setEffort] = useState<ThinkingEffort>("medium");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${agentUrl}/chat`,
      prepareSendMessagesRequest: async ({ messages: outgoing }) => ({
        body: {
          messages: outgoing,
          model,
          prototypeId,
          ...(effort === "off" ? {} : { reasoning_effort: effort }),
        },
        headers: { Authorization: `Bearer ${await getToken()}` },
      }),
    }),
  });

  return (
    <AgentChat
      className="h-full"
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
      messages={messages}
      onSend={(text) => sendMessage({ text })}
      status={status}
    />
  );
};
