import type { ActivityEntry } from "./activity-feed";

/** A realistic system feed for docs previews and tests, newest first. */
export const activityEntries: ActivityEntry[] = [
  {
    id: "evt_1",
    source: "agent",
    status: "pending",
    timestamp: "just now",
    title: "Scaling compute to handle load",
  },
  {
    actionLabel: "Retry",
    detail:
      "connect ETIMEDOUT ep-cool-darkness-a1b2c3d4.us-east-2.aws.neon.tech:5432\nrequest id: 7f3a9c21-…",
    id: "evt_2",
    source: "transfer",
    status: "error",
    timestamp: "2m ago",
    title: "Snapshot transfer failed",
  },
  {
    id: "evt_3",
    source: "agent",
    status: "success",
    timestamp: "8m ago",
    title: "Applied migration add_billing_table",
  },
  {
    id: "evt_4",
    source: "you",
    status: "success",
    timestamp: "1h ago",
    title: "Provisioned production database",
  },
  {
    id: "evt_5",
    source: "system",
    status: "info",
    timestamp: "3h ago",
    title: "Compute scaled to zero",
  },
];
