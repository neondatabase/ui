import { createNeonClient } from "@/lib/neon-client";

import type { AutoscalePoint } from "./autoscale-chart";
import { AutoscaleChart } from "./autoscale-chart";

/**
 * Server component: read the endpoint's autoscaling bounds from Neon, and
 * plot a CU series you gather from your metrics store. The control plane
 * exposes the min/max bounds; the per-interval CU timeseries comes from
 * your own monitoring (Datadog, Grafana, a metrics table, etc.).
 */
export const AutoscaleChartExample = async ({
  projectId,
  branchId,
  data,
}: {
  projectId: string;
  branchId: string;
  data: AutoscalePoint[];
}) => {
  const neon = createNeonClient(process.env.NEON_API_KEY ?? "");
  const { data: endpoints } = await neon.postgres.endpoints.listByBranch(
    projectId,
    branchId
  );
  const [endpoint] = endpoints ?? [];

  return (
    <AutoscaleChart
      data={data}
      max={endpoint?.autoscaling_limit_max_cu ?? 4}
      min={endpoint?.autoscaling_limit_min_cu ?? 0.25}
    />
  );
};
