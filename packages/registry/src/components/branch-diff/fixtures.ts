import type {
  BranchDiffBranch,
  SchemaChange,
  TableDataDiff,
} from "./branch-diff";

export const branchDiffFrom: BranchDiffBranch = {
  id: "br-main",
  name: "main",
};

export const branchDiffTo: BranchDiffBranch = {
  id: "br-feature-billing",
  name: "br-feature-billing",
};

export const branchDiffSchemaChanges: SchemaChange[] = [
  {
    after: "table",
    ddl: "create table public.invoices (\n  id uuid primary key default gen_random_uuid(),\n  account_id uuid not null references public.accounts (id),\n  amount_cents integer not null,\n  created_at timestamptz not null default now()\n);",
    id: "sc-1",
    kind: "added",
    objectType: "table",
    path: ["public", "invoices"],
  },
  {
    after: "numeric(12,2)",
    before: "integer",
    breaking: true,
    ddl: "alter table public.accounts\n  alter column balance type numeric(12,2);",
    id: "sc-2",
    kind: "modified",
    objectType: "column",
    path: ["public", "accounts", "balance"],
  },
  {
    after: "not null",
    before: "null",
    ddl: "alter table public.users\n  alter column email set not null;",
    id: "sc-3",
    kind: "modified",
    objectType: "column",
    path: ["public", "users", "email"],
  },
  {
    after: "btree (account_id, created_at desc)",
    ddl: "create index invoices_account_created_idx\n  on public.invoices (account_id, created_at desc);",
    id: "sc-4",
    kind: "added",
    objectType: "index",
    path: ["public", "invoices", "invoices_account_created_idx"],
  },
  {
    before: "btree (legacy_ref)",
    breaking: true,
    ddl: "drop index public.accounts_legacy_ref_idx;",
    id: "sc-5",
    kind: "removed",
    objectType: "index",
    path: ["public", "accounts", "accounts_legacy_ref_idx"],
  },
  {
    after: "check (amount_cents >= 0)",
    id: "sc-6",
    kind: "added",
    objectType: "constraint",
    path: ["public", "invoices", "invoices_amount_positive"],
  },
];

export const branchDiffDataDiffs: TableDataDiff[] = [
  {
    addedCount: 2,
    hasMore: true,
    id: "td-plans",
    modifiedCount: 1,
    primaryKey: ["id"],
    removedCount: 1,
    rows: [
      {
        after: { id: "pro", monthly_cents: 4900, name: "Pro", seats: 10 },
        id: "row-plans-1",
        kind: "added",
        primaryKey: { id: "pro" },
      },
      {
        after: { id: "scale", monthly_cents: 19_900, name: "Scale", seats: 50 },
        id: "row-plans-2",
        kind: "added",
        primaryKey: { id: "scale" },
      },
      {
        after: { id: "free", monthly_cents: 0, name: "Free", seats: 3 },
        before: { id: "free", monthly_cents: 0, name: "Free", seats: 1 },
        id: "row-plans-3",
        kind: "modified",
        primaryKey: { id: "free" },
      },
      {
        before: { id: "legacy", monthly_cents: 900, name: "Legacy", seats: 5 },
        id: "row-plans-4",
        kind: "removed",
        primaryKey: { id: "legacy" },
      },
    ],
    schema: "public",
    table: "plans",
    unchangedCount: 3,
  },
  {
    addedCount: 1,
    id: "td-feature-flags",
    modifiedCount: 2,
    primaryKey: ["key"],
    removedCount: 0,
    rows: [
      {
        after: { enabled: true, key: "usage_alerts", rollout: 25 },
        id: "row-flags-1",
        kind: "added",
        primaryKey: { key: "usage_alerts" },
      },
      {
        after: { enabled: true, key: "billing_v2", rollout: 100 },
        before: { enabled: false, key: "billing_v2", rollout: 10 },
        id: "row-flags-2",
        kind: "modified",
        primaryKey: { key: "billing_v2" },
      },
      {
        after: { enabled: true, key: "invoice_pdf", rollout: null },
        before: { enabled: true, key: "invoice_pdf", rollout: 5 },
        id: "row-flags-3",
        kind: "modified",
        primaryKey: { key: "invoice_pdf" },
      },
    ],
    schema: "public",
    table: "feature_flags",
    unchangedCount: 11,
  },
];
