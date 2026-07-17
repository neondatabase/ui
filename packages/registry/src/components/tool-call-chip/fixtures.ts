import type { ToolCallState } from "./tool-call-chip";

/** A believable agent turn's worth of tool invocations. */
export const toolCalls: {
  detail?: string;
  name: string;
  state: ToolCallState;
}[] = [
  { detail: "src/db/schema.ts", name: "writeFile", state: "done" },
  { detail: "bun run db:push", name: "runCommand", state: "done" },
  { detail: "book tracker v1", name: "checkpoint", state: "running" },
  { detail: "snap-01j8", name: "restore", state: "error" },
];
