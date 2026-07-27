import { estimateCost } from "@/lib/consumption";

import type { CostLine } from "./cost-estimate-card";

/**
 * Two weeks of raw metric totals from the v2 project endpoint, straight
 * off the wire: CU-seconds, byte-hours, bytes, branch-hours.
 */
export const rawTotals = {
  child_branch_bytes_month: 5_304_000_000_000,
  compute_unit_seconds: 486_000,
  extra_branches_month: 4032,
  instant_restore_bytes_month: 3_616_000_000_000,
  private_network_transfer_bytes: 0,
  public_network_transfer_bytes: 604_000_000_000,
  root_branch_bytes_month: 13_704_000_000_000,
  snapshot_storage_bytes_month: 944_000_000_000,
};

const HOURS_IN_PERIOD = 336;

/** The same totals priced on Scale, allowances applied. */
export const costLines: CostLine[] = estimateCost(rawTotals, "scale", {
  hoursInPeriod: HOURS_IN_PERIOD,
}).items;

export const spendingLimit = 100;
