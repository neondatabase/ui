/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import ChatInputDemo from "./chat-input-demo";
import source from "./chat-input-demo.tsx?raw";
import PreviewTabs from "./preview-tabs";

export default function ChatInputDemoPreview() {
  return (
    <PreviewTabs minHeight={300} source={source}>
      <ChatInputDemo />
    </PreviewTabs>
  );
}
