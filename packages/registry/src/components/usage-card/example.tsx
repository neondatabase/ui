import { createNeonClient } from "@/lib/neon-client";

import type { UsagePoint } from "./usage-card";
import { UsageCard } from "./usage-card";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 14;

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });

/**
 * Server component: pull daily compute consumption for a project from the Neon
 * API and render one UsageCard. The API key stays server-side; UsageCard only
 * ever sees plain samples. Compare against the prior window for the delta.
 */
export const UsageCardExample = async ({
  projectId,
}: {
  projectId: string;
}) => {
  const neon = createNeonClient(process.env.NEON_API_KEY ?? "");

  const now = new Date();
  const from = new Date(now.getTime() - 2 * WINDOW_DAYS * DAY_MS);
  const windowStart = now.getTime() - WINDOW_DAYS * DAY_MS;

  const { data } = await neon.consumption
    .perProject({
      from: from.toISOString(),
      granularity: "daily",
      project_ids: [projectId],
      to: now.toISOString(),
    })
    .all();

  const timeframes =
    data?.[0]?.periods.flatMap((period) => period.consumption) ?? [];

  const current: UsagePoint[] = [];
  let previousTotal = 0;

  for (const frame of timeframes) {
    if (new Date(frame.timeframe_start).getTime() >= windowStart) {
      current.push({
        label: shortDate(frame.timeframe_start),
        value: frame.compute_time_seconds,
      });
    } else {
      previousTotal += frame.compute_time_seconds;
    }
  }

  return (
    <UsageCard
      comparisonLabel="vs previous 14 days"
      data={current}
      metric="compute"
      previousTotal={previousTotal}
      windowLabel="14d"
    />
  );
};
