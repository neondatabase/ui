import type { QueryHistoryEntry } from "./query-history";

export const queryHistoryEntries: QueryHistoryEntry[] = [
  {
    branch: "production",
    command: "SELECT",
    database: "neondb",
    durationMs: 43,
    executedAt: "2026-07-24T14:52:00.000Z",
    id: "qry_01",
    query:
      "select id, email, plan, created_at\nfrom users\norder by created_at desc\nlimit 25;",
    rowCount: 25,
    saved: true,
    status: "success",
    timestamp: "2m ago",
  },
  {
    branch: "br-feature-billing",
    command: "SELECT",
    database: "neondb",
    durationMs: 118,
    executedAt: "2026-07-24T14:41:00.000Z",
    id: "qry_02",
    query:
      "select date_trunc('day', created_at) as day, sum(amount_cents) / 100.0 as revenue\nfrom invoices\nwhere status = 'paid'\ngroup by 1\norder by 1 desc;",
    rowCount: 30,
    status: "success",
    timestamp: "13m ago",
  },
  {
    branch: "production",
    command: "SELECT",
    database: "neondb",
    durationMs: 12,
    error: 'column "last_seen" does not exist (SQLSTATE 42703)',
    executedAt: "2026-07-24T14:22:00.000Z",
    id: "qry_03",
    query:
      "select id, email, last_seen\nfrom users\nwhere last_seen > now() - interval '7 days';",
    status: "error",
    timestamp: "32m ago",
  },
  {
    branch: "staging",
    command: "EXPLAIN",
    database: "neondb",
    durationMs: 2840,
    executedAt: "2026-07-24T13:09:00.000Z",
    id: "qry_04",
    query:
      "explain (analyze, buffers)\nselect *\nfrom events\nwhere organization_id = 'org_7f3a'\norder by occurred_at desc;",
    saved: true,
    status: "cancelled",
    timestamp: "1h ago",
  },
  {
    branch: "production",
    command: "UPDATE",
    database: "neondb",
    durationMs: 37,
    executedAt: "2026-07-24T11:36:00.000Z",
    id: "qry_05",
    query:
      "update subscriptions\nset plan = 'pro', updated_at = now()\nwhere id = 'sub_01J2K8YF6Q';",
    rowCount: 1,
    status: "success",
    timestamp: "3h ago",
  },
];
