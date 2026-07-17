import { ConsumptionHistoryGranularity } from "@neondatabase/api-client";

import { createNeonClient } from "@/lib/neon-client";

import { MetricCard } from "./metric-card";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 14;

/**
 * Server component: pull daily compute consumption for a project from the Neon
 * API and render it as a MetricCard. The API key stays server-side; the
 * presentational component only ever sees plain data.
 */
export const MetricCardExample = async ({
  projectId,
}: {
  projectId: string;
}) => {
  const client = createNeonClient(process.env.NEON_API_KEY ?? "");

  const now = new Date();
  const from = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);

  const { data } = await client.getConsumptionHistoryPerProject({
    from: from.toISOString(),
    granularity: ConsumptionHistoryGranularity.Daily,
    project_ids: [projectId],
    to: now.toISOString(),
  });

  const timeframes =
    data.projects[0]?.periods.flatMap((period) => period.consumption) ?? [];
  const trend = timeframes.map((frame) => frame.compute_time_seconds / 3600);
  const total = trend.reduce((sum, hours) => sum + hours, 0);

  return (
    <MetricCard
      format="duration"
      label="Compute (14d)"
      trend={trend}
      unit="hrs"
      value={Math.round(total * 3600)}
    />
  );
};
