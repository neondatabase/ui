import {
  metricCacheHit,
  metricComputeHours,
  metricSpend,
  metricStorage,
} from "@neon-ui/registry/components/metric-card/fixtures";
import { MetricCard } from "@neon-ui/registry/components/metric-card/metric-card";

const formatVariants = [
  metricStorage,
  metricComputeHours,
  metricCacheHit,
  metricSpend,
];

export default function MetricCardFormatVariants() {
  return (
    <div className="grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2">
      {formatVariants.map((metric) => (
        <MetricCard
          className="w-full max-w-none border-0 bg-card"
          key={metric.label}
          {...metric}
        />
      ))}
    </div>
  );
}
