/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import ChatWorkingDemo from "./chat-working-demo";
import source from "./chat-working-demo.tsx?raw";
import { highlightedHtml } from "./generated/chat-working-preview";
import PreviewTabs from "./preview-tabs";

export default function ChatWorkingDemoPreview() {
  return (
    <PreviewTabs minHeight={220} highlighted={highlightedHtml} source={source}>
      <ChatWorkingDemo />
    </PreviewTabs>
  );
}
