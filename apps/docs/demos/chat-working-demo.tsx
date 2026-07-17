"use client";

import { ChatWorkingIndicator } from "@neon-ui/registry/components/agent-chat/agent-chat";

export default function ChatWorkingDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ChatWorkingIndicator />
      <ChatWorkingIndicator label="Provisioning your database…" />
    </div>
  );
}
