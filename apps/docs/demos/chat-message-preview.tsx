/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import ChatMessageDemo from "./chat-message-demo";
import source from "./chat-message-demo.tsx?raw";
import PreviewTabs from "./preview-tabs";

export default function ChatMessageDemoPreview() {
  return (
    <PreviewTabs minHeight={360} source={source}>
      <ChatMessageDemo />
    </PreviewTabs>
  );
}
