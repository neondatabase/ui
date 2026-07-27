"use client";

import { useConsumptionHistory } from "@/hooks/use-consumption-history";
import { METRIC_COLORS, toBillingUnit } from "@/lib/consumption";

import type { ConsumptionPoint } from "./consumption-chart";
import { ConsumptionChart } from "./consumption-chart";

/**
 * Units matter: compute is CU-hours and storage is GB-months, so the
 * chart overlays these rather than stacking them, and totals each unit
 * separately. Colors come from the shared metric map so root storage is
 * the same blue here as in a StorageBreakdown beside it.
 */
const SERIES = [
  {
    color: METRIC_COLORS.compute_unit_seconds,
    id: "compute_unit_seconds",
    label: "Compute",
    unit: "CU-hrs",
  },
  {
    color: METRIC_COLORS.root_branch_bytes_month,
    id: "root_branch_bytes_month",
    label: "Root storage",
    unit: "GB-mo",
  },
  {
    color: METRIC_COLORS.child_branch_bytes_month,
    id: "child_branch_bytes_month",
    label: "Child storage",
    unit: "GB-mo",
  },
] as const;

const DAY_LABEL = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/**
 * Client wiring: the hook calls your own route handler, which forwards to
 * GET /consumption_history/v2/projects with the server-side API key. The
 * API answers in raw units, so convert at the display edge — CU-seconds to
 * CU-hours, byte-hours to GB-months — using the same helpers the cost
 * estimate uses, so the chart and the bill can't disagree.
 */
export const ConsumptionChartExample = ({
  projectId,
  from,
  to,
}: {
  projectId: string;
  from: string;
  to: string;
}) => {
  const { buckets, error, isLoading, updatedAt } = useConsumptionHistory({
    from,
    granularity: "daily",
    metrics: SERIES.map((item) => item.id),
    projectIds: [projectId],
    to,
  });

  const data: ConsumptionPoint[] = buckets.map((bucket) => ({
    label: DAY_LABEL.format(new Date(bucket.start)),
    values: Object.fromEntries(
      SERIES.map((item) => [
        item.id,
        toBillingUnit(item.id, bucket.values[item.id] ?? 0),
      ])
    ),
  }));

  return (
    <ConsumptionChart
      data={data}
      error={error}
      granularities={["hourly", "daily", "monthly"]}
      isLoading={isLoading}
      meteredThrough={
        updatedAt
          ? `metered through ${updatedAt.toISOString().slice(11, 16)} UTC · ~15m behind`
          : undefined
      }
      series={[...SERIES]}
    />
  );
};
