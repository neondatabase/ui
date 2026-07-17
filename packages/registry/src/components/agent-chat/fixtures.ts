import { createChat } from "@shadcn/helpers/ai-sdk";
import type { UIMessage } from "ai";

/**
 * Deterministic vibe-coding session streamed through the real useChat
 * lifecycle (no model, network, or key): reasoning, tool calls, and
 * markdown, matching what a Neon-hosted Mastra agent emits.
 */
export const buildAgentConversation = () =>
  createChat()
    .user("Turn this into a book tracker: title, author, read/unread.")
    .sleep(400)
    .assistant(({ writer }) => {
      writer.reasoning(
        "The starter app has a Drizzle schema and a single page. I need a books table, a form, and a toggle."
      );
      writer.sleep(300);
      writer
        .tool("writeFile", { input: { path: "src/db/schema.ts" } })
        .output({ ok: true });
      writer
        .tool("runCommand", { input: { command: "bun run db:push" } })
        .output({ exitCode: 0 });
      writer
        .tool("writeFile", { input: { path: "src/app/page.tsx" } })
        .output({ ok: true });
      writer.sleep(300);
      writer.text(
        "Done. I added a `books` table (title, author, `read` boolean), pushed the schema to your Neon database, and rebuilt the page with an add-book form and a read/unread toggle per row.\n\nThe preview has reloaded — try adding a book."
      );
    })
    .user("Nice. Save a checkpoint before we go further.")
    .sleep(400)
    .assistant(({ writer }) => {
      writer
        .tool("checkpoint", { input: { label: "book tracker v1" } })
        .output({ gitSha: "4f2c9ab", snapshotId: "snap-01j8" });
      writer.text(
        "Checkpoint **book tracker v1** saved — code committed (`4f2c9ab`) and the database snapshotted together, so restoring rolls back both."
      );
    });

export const emptyStateCopy =
  "Ask the agent to build features. It edits the live app and can snapshot code + database as checkpoints.";

/** Static turns for rendering ChatMessage outside a live conversation. */
export const sampleTurns: UIMessage[] = [
  {
    id: "turn-user",
    parts: [
      {
        text: "Add auth so each user only sees their own books.",
        type: "text",
      },
    ],
    role: "user",
  },
  {
    id: "turn-assistant",
    parts: [
      {
        state: "done",
        text: "Neon Auth is already wired; I need a user_id column and a filtered query.",
        type: "reasoning",
      },
      {
        input: { path: "src/db/schema.ts" },
        output: { ok: true },
        state: "output-available",
        toolCallId: "call-1",
        type: "tool-writeFile",
      },
      {
        input: { command: "bun run db:push" },
        output: { exitCode: 0 },
        state: "output-available",
        toolCallId: "call-2",
        type: "tool-runCommand",
      },
      {
        text: "Done — books now carry a `user_id`, and every query filters by the signed-in user from **Neon Auth**. Sign in as two different users to verify the isolation.",
        type: "text",
      },
    ],
    role: "assistant",
  },
];
