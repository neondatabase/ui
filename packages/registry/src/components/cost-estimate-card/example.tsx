import {
  CONSUMPTION_METRICS,
  estimateCost,
  flattenConsumption,
  hoursBetween,
  sumBuckets,
} from "@/lib/consumption";
import type { ConsumptionPlan } from "@/lib/consumption";
import { createNeonClient } from "@/lib/neon-client";

import { CostEstimateCard } from "./cost-estimate-card";

/**
 * Server component: sum the billing period's raw metrics, then price them
 * with `estimateCost`, which applies the 500 GB transfer allowance and the
 * per-hour branch allowance before multiplying by the plan rate.
 *
 * Neon evaluates the branch allowance hourly, so `granularity: "hourly"`
 * tracks the invoice most closely inside the 168-hour window; daily is the
 * right call for a full month. Either way this is an estimate — say so in
 * the UI rather than presenting it as the bill.
 */
export const CostEstimateCardExample = async ({
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
  const { data, error } = await neon.consumption
    .perProjectV2({
      from,
      granularity: "daily",
      metrics: [...CONSUMPTION_METRICS],
      org_id: orgId,
      project_ids: [projectId],
      to,
    })
    .all();

  const totals = sumBuckets(flattenConsumption(data?.[0]?.periods ?? []));
  const { items, total } = estimateCost(totals, plan, {
    hoursInPeriod: hoursBetween(from, to),
  });

  return (
    <CostEstimateCard
      error={error ? "Could not load consumption for this period." : null}
      lines={items}
      plan={plan}
      total={total}
    />
  );
};
