import type { ConsumptionPlan } from "@/lib/consumption";
import {
  flattenConsumption,
  METRIC_COLORS,
  METRIC_LABELS,
  PLAN_RATES,
  STORAGE_METRICS,
  sumBuckets,
  toGbMonths,
} from "@/lib/consumption";
import { createNeonClient } from "@/lib/neon-client";

import type { StorageSegment } from "./storage-breakdown";
import { StorageBreakdown } from "./storage-breakdown";

/**
 * Server component: pull the four storage metrics for the billing window
 * and convert byte-hours to GB-months, the unit the invoice charges in.
 *
 * A metric the API omitted is zero, not missing, so seed every segment at
 * zero and let the totals overwrite it. Otherwise a quiet month looks like
 * a broken request.
 *
 * Pass the plan's rate on every segment. The four storage metrics bill at
 * four different prices, so ranking by volume points at a different lever
 * than ranking by cost. With rates present the card can show both, and
 * the reader trying to cut a bill sees the truthful one.
 */
export const StorageBreakdownExample = async ({
  orgId,
  projectId,
  plan,
  from,
  to,
}: {
  orgId: string;
  projectId: string;
  plan: ConsumptionPlan;
  from: string;
  to: string;
}) => {
  const neon = createNeonClient(process.env.NEON_API_KEY ?? "");
  const { data } = await neon.consumption
    .perProjectV2({
      from,
      granularity: "daily",
      metrics: [...STORAGE_METRICS],
      org_id: orgId,
      project_ids: [projectId],
      to,
    })
    .all();

  const periods = data?.[0]?.periods ?? [];
  const totals = sumBuckets(flattenConsumption(periods));

  const segments: StorageSegment[] = STORAGE_METRICS.map((metric) => ({
    color: METRIC_COLORS[metric],
    id: metric,
    label: METRIC_LABELS[metric],
    rate: PLAN_RATES[plan][metric],
    value: toGbMonths(totals[metric] ?? 0),
  }));

  return <StorageBreakdown segments={segments} unit="GB-mo" />;
};
