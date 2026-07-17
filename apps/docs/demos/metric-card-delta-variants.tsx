import {
  metricCacheHit,
  metricComputeHours,
  metricConnections,
} from "@neon-ui/registry/components/metric-card/fixtures";
import { MetricCard } from "@neon-ui/registry/components/metric-card/metric-card";

const deltaVariants = [metricConnections, metricComputeHours, metricCacheHit];

export default function MetricCardDeltaVariants() {
  return (
    <div className="grid gap-px border border-border/60 bg-border/60 lg:grid-cols-3">
      {deltaVariants.map((metric) => (
        <MetricCard
          className="w-full max-w-none border-0 bg-card"
          key={metric.label}
          {...metric}
        />
      ))}
    </div>
  );
}
