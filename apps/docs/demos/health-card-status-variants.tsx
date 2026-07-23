import {
  healthDegraded,
  healthDown,
  healthHealthy,
} from "@neon-ui/registry/components/health-card/fixtures";
import { HealthCard } from "@neon-ui/registry/components/health-card/health-card";

const statusVariants = [healthHealthy, healthDegraded, healthDown];

export default function HealthCardStatusVariants() {
  return (
    <div className="grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2">
      {statusVariants.map((health) => (
        <HealthCard
          className="w-full max-w-none border-0 bg-card"
          key={health.status}
          {...health}
        />
      ))}
    </div>
  );
}
