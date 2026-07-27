import { METRIC_COLORS } from "@/lib/consumption";

import type { ConsumptionPoint, ConsumptionSeries } from "./consumption-chart";

/**
 * The three storage metrics, all in GB-months, so the stack is a real
 * quantity and the total means something. Colors come from the shared
 * metric map, so root storage is the same blue here as in a breakdown.
 */
export const series: ConsumptionSeries[] = [
  {
    color: METRIC_COLORS.root_branch_bytes_month,
    id: "root_storage",
    label: "Root storage",
    unit: "GB-mo",
  },
  {
    color: METRIC_COLORS.child_branch_bytes_month,
    id: "child_storage",
    label: "Child storage",
    unit: "GB-mo",
  },
  {
    color: METRIC_COLORS.instant_restore_bytes_month,
    id: "instant_restore",
    label: "Instant restore",
    unit: "GB-mo",
  },
];

/**
 * Compute, in CU-hours. Add it to the series above and the chart stops
 * stacking, because CU-hours and GB-months are not the same quantity.
 */
export const computeSeries: ConsumptionSeries = {
  color: METRIC_COLORS.compute_unit_seconds,
  id: "compute",
  label: "Compute",
  unit: "CU-hrs",
};

/**
 * Fourteen daily buckets from a project that runs a nightly job, branches
 * hard midweek for CI, and settles over the weekend. Values are already
 * converted: CU-seconds to CU-hours, byte-hours to GB-months.
 */
export const dailyConsumption: ConsumptionPoint[] = [
  {
    label: "Feb 1",
    values: {
      child_storage: 0.4,
      compute: 3.1,
      instant_restore: 0.6,
      root_storage: 2.2,
    },
  },
  {
    label: "Feb 2",
    values: {
      child_storage: 0.5,
      compute: 2.8,
      instant_restore: 0.6,
      root_storage: 2.3,
    },
  },
  {
    label: "Feb 3",
    values: {
      child_storage: 1.2,
      compute: 6.4,
      instant_restore: 0.7,
      root_storage: 2.3,
    },
  },
  {
    label: "Feb 4",
    values: {
      child_storage: 1.9,
      compute: 8.2,
      instant_restore: 0.7,
      root_storage: 2.4,
    },
  },
  {
    label: "Feb 5",
    values: {
      child_storage: 2.6,
      compute: 9.7,
      instant_restore: 0.8,
      root_storage: 2.4,
    },
  },
  {
    label: "Feb 6",
    values: {
      child_storage: 3.4,
      compute: 11.3,
      instant_restore: 0.9,
      root_storage: 2.5,
    },
  },
  {
    label: "Feb 7",
    values: {
      child_storage: 2.1,
      compute: 5.2,
      instant_restore: 0.9,
      root_storage: 2.5,
    },
  },
  {
    label: "Feb 8",
    values: {
      child_storage: 1.1,
      compute: 3.4,
      instant_restore: 1,
      root_storage: 2.6,
    },
  },
  {
    label: "Feb 9",
    values: {
      child_storage: 1.3,
      compute: 4.1,
      instant_restore: 1,
      root_storage: 2.6,
    },
  },
  {
    label: "Feb 10",
    values: {
      child_storage: 2.4,
      compute: 7.9,
      instant_restore: 1.1,
      root_storage: 2.7,
    },
  },
  {
    label: "Feb 11",
    values: {
      child_storage: 3.1,
      compute: 12.6,
      instant_restore: 1.2,
      root_storage: 2.8,
    },
  },
  {
    label: "Feb 12",
    values: {
      child_storage: 3.8,
      compute: 14.1,
      instant_restore: 1.2,
      root_storage: 2.9,
    },
  },
  {
    label: "Feb 13",
    values: {
      child_storage: 2.9,
      compute: 9.4,
      instant_restore: 1.3,
      root_storage: 2.9,
    },
  },
  {
    label: "Feb 14",
    values: {
      child_storage: 1.4,
      compute: 4.6,
      instant_restore: 1.3,
      root_storage: 3,
    },
  },
];

/** The same project at hourly granularity: a nightly batch window. */
export const hourlyConsumption: ConsumptionPoint[] = [
  {
    label: "00:00",
    values: { child_storage: 1.1, instant_restore: 1.2, root_storage: 3 },
  },
  {
    label: "02:00",
    values: { child_storage: 1.3, instant_restore: 1.2, root_storage: 3 },
  },
  {
    label: "04:00",
    values: { child_storage: 1.6, instant_restore: 1.2, root_storage: 3.1 },
  },
  {
    label: "06:00",
    values: { child_storage: 1.4, instant_restore: 1.3, root_storage: 3.1 },
  },
  {
    label: "08:00",
    values: { child_storage: 1.9, instant_restore: 1.3, root_storage: 3.1 },
  },
  {
    label: "10:00",
    values: { child_storage: 2.4, instant_restore: 1.3, root_storage: 3.2 },
  },
  {
    label: "12:00",
    values: { child_storage: 2.8, instant_restore: 1.3, root_storage: 3.2 },
  },
  {
    label: "14:00",
    values: { child_storage: 3.1, instant_restore: 1.4, root_storage: 3.2 },
  },
  {
    label: "16:00",
    values: { child_storage: 2.7, instant_restore: 1.4, root_storage: 3.3 },
  },
  {
    label: "18:00",
    values: { child_storage: 2.2, instant_restore: 1.4, root_storage: 3.3 },
  },
  {
    label: "20:00",
    values: { child_storage: 1.7, instant_restore: 1.4, root_storage: 3.3 },
  },
  {
    label: "22:00",
    values: { child_storage: 1.3, instant_restore: 1.5, root_storage: 3.3 },
  },
];
