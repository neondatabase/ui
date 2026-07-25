import type { OperationStatus } from "@neon/sdk";

import { createNeonClient } from "@/lib/neon-client";

import type { ActivityEntry, ActivityStatus } from "./activity-feed";
import { ActivityFeed } from "./activity-feed";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const relativeTime = (iso: string) => {
  const delta = Date.now() - new Date(iso).getTime();

  if (delta < MINUTE_MS) {
    return "just now";
  }
  if (delta < HOUR_MS) {
    return `${Math.floor(delta / MINUTE_MS)}m ago`;
  }
  if (delta < DAY_MS) {
    return `${Math.floor(delta / HOUR_MS)}h ago`;
  }

  return `${Math.floor(delta / DAY_MS)}d ago`;
};

const statusOf = (status: OperationStatus): ActivityStatus => {
  if (status === "failed" || status === "error") {
    return "error";
  }
  if (status === "running" || status === "scheduling") {
    return "pending";
  }
  if (status === "finished") {
    return "success";
  }

  return "info";
};

const titleOf = (action: string) =>
  action.replaceAll("_", " ").replace(/^\w/u, (char) => char.toUpperCase());

/**
 * Server component: turn a project's recent Neon operations into an activity
 * feed. The API key stays server-side; the feed only ever sees plain data.
 */
export const ActivityFeedExample = async ({
  projectId,
}: {
  projectId: string;
}) => {
  const neon = createNeonClient(process.env.NEON_API_KEY ?? "");
  // Operations are cursor-paginated; one page is a feed's worth of history.
  const { data } = await neon.operations.list(projectId).page();

  const entries: ActivityEntry[] = (data?.items ?? []).map((operation) => ({
    id: operation.id,
    source: operation.branch_id ? `branch ${operation.branch_id}` : "system",
    status: statusOf(operation.status),
    timestamp: relativeTime(operation.created_at),
    title: titleOf(operation.action),
  }));

  return <ActivityFeed entries={entries} />;
};
