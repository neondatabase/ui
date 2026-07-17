"use client";

import { ChatMessage } from "@neon-ui/registry/components/agent-chat/agent-chat";
import { sampleTurns } from "@neon-ui/registry/components/agent-chat/fixtures";

export default function ChatMessageDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {sampleTurns.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
    </div>
  );
}
