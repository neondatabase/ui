import {
  usageCompute,
  usageStorage,
  usageWritten,
} from "@neon-ui/registry/components/usage-card/fixtures";
import { UsageCard } from "@neon-ui/registry/components/usage-card/usage-card";

const metricVariants = [usageCompute, usageStorage, usageWritten];

export default function UsageCardMetricVariants() {
  return (
    <div className="grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2">
      {metricVariants.map((usage) => (
        <UsageCard
          className="w-full max-w-none border-0 bg-card"
          key={usage.metric}
          {...usage}
        />
      ))}
    </div>
  );
}
