/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { AgentChatDemo } from "@neon-ui/registry/components/agent-chat/demo";

import source from "../../../packages/registry/src/components/agent-chat/demo.tsx?raw";
import { highlightedHtml } from "./generated/agent-chat-preview";
import PreviewTabs from "./preview-tabs";

export default function AgentChatPreview() {
  return (
    <PreviewTabs minHeight={520} highlighted={highlightedHtml} source={source}>
      <AgentChatDemo />
    </PreviewTabs>
  );
}
