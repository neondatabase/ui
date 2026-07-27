import { METRIC_COLORS, PLAN_RATES } from "@/lib/consumption";

import type { StorageSegment } from "./storage-breakdown";

const rates = PLAN_RATES.scale;

/**
 * The four storage metrics from the v2 project endpoint, converted from
 * byte-hours to GB-months, each carrying its Scale-plan rate. A project
 * with a busy CI branch fleet and a seven-day restore window.
 *
 * The rates are the point: instant restore holds 15.3% of the volume but
 * bills at $0.20 against storage's $0.35, so it is only 9.7% of the cost.
 */
export const storageSegments: StorageSegment[] = [
  {
    color: METRIC_COLORS.root_branch_bytes_month,
    hint: "main and other root branches",
    id: "root_branch_bytes_month",
    label: "Root branches",
    rate: rates.root_branch_bytes_month,
    value: 18.42,
  },
  {
    color: METRIC_COLORS.child_branch_bytes_month,
    hint: "delta from each branch's parent",
    id: "child_branch_bytes_month",
    label: "Child branches",
    rate: rates.child_branch_bytes_month,
    value: 7.13,
  },
  {
    color: METRIC_COLORS.instant_restore_bytes_month,
    hint: "7-day point-in-time restore window",
    id: "instant_restore_bytes_month",
    label: "Instant restore",
    rate: rates.instant_restore_bytes_month,
    value: 4.86,
  },
  {
    color: METRIC_COLORS.snapshot_storage_bytes_month,
    hint: "1 manual, 6 scheduled",
    id: "snapshot_storage_bytes_month",
    label: "Snapshots",
    rate: rates.snapshot_storage_bytes_month,
    value: 1.27,
  },
];
