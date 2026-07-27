import type { BranchUsageColumn, BranchUsageRow } from "./branch-usage-table";

/** The three metrics that explain most branch bills. */
export const branchColumns: BranchUsageColumn[] = [
  { id: "compute", label: "Compute", unit: "CU-hrs" },
  { id: "storage", label: "Storage", unit: "GB-mo" },
  { id: "transfer", label: "Transfer", unit: "GB" },
];

/**
 * A fortnight of branch consumption on a project with a CI fleet: main
 * carries the storage, but the ephemeral PR branches carry the compute —
 * the case the per-branch endpoint exists to make visible.
 */
export const branchRows: BranchUsageRow[] = [
  {
    hint: "root branch",
    id: "br-quiet-field-a1b2c3d4",
    isDefault: true,
    isProtected: true,
    metrics: { compute: 84.2, storage: 18.4, transfer: 121.6 },
    name: "main",
  },
  {
    hint: "from main · always on",
    id: "br-still-dawn-b2c3d4e5",
    metrics: { compute: 61.7, storage: 3.2, transfer: 44.1 },
    name: "staging",
  },
  {
    hint: "from main · 18 runs",
    id: "br-bold-sun-c3d4e5f6",
    metrics: { compute: 38.4, storage: 1.1, transfer: 6.2 },
    name: "ci/pr-4821",
  },
  {
    hint: "from staging",
    id: "br-lucky-sky-d4e5f6a7",
    metrics: { compute: 22.9, storage: 0.9, transfer: 3.8 },
    name: "dev/justin",
  },
  {
    hint: "from main · 11 runs",
    id: "br-plain-moon-e5f6a7b8",
    metrics: { compute: 17.3, storage: 0.7, transfer: 2.4 },
    name: "ci/pr-4830",
  },
  {
    hint: "from main · nightly",
    id: "br-eager-leaf-f6a7b8c9",
    metrics: { compute: 12.1, storage: 2.6, transfer: 1.9 },
    name: "preview/analytics",
  },
  {
    hint: "from main · 6 runs",
    id: "br-tidy-rain-a7b8c9d0",
    metrics: { compute: 9.4, storage: 0.5, transfer: 1.1 },
    name: "ci/pr-4833",
  },
  {
    hint: "from main",
    id: "br-calm-wave-b8c9d0e1",
    metrics: { compute: 4.8, storage: 0.4, transfer: 0.6 },
    name: "dev/aisha",
  },
];
