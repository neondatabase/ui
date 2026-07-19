"use client";

import { useEffect, useState } from "react";

import type { UsageMetric } from "./usage-panel";
import { UsagePanel } from "./usage-panel";

/**
 * The workspace wiring: fetch the v2 per-project consumption metrics
 * (GET /consumption_history/projects) and map them into the grid. The
 * API meters with a lag — surface it through meteredThrough instead of
 * pretending the numbers are live.
 */
export const UsagePanelExample = () => {
  const [metrics, setMetrics] = useState<UsageMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Stand-in for the consumption API round trip.
    const timer = window.setTimeout(() => {
      setMetrics([
        {
          format: "number",
          id: "compute_unit_seconds",
          label: "Compute",
          unit: "CU-hrs",
          value: 22.3,
        },
        {
          format: "bytes",
          id: "storage_bytes",
          label: "Storage",
          value: 3_380_000_000,
        },
        {
          format: "bytes",
          id: "egress_bytes",
          label: "Egress",
          value: 731_000_000,
        },
      ]);
      setIsLoading(false);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <UsagePanel
      isLoading={isLoading}
      meteredThrough="metered through 21:40 UTC · ~15m behind"
      metrics={
        metrics.length > 0
          ? metrics
          : [
              { format: "number", id: "compute", label: "Compute", value: 0 },
              { format: "bytes", id: "storage", label: "Storage", value: 0 },
              { format: "bytes", id: "egress", label: "Egress", value: 0 },
            ]
      }
      period="Jul 1 – Jul 18"
    />
  );
};
