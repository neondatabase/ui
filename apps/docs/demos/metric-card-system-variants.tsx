import { MetricCard } from "@neon-ui/registry/components/metric-card/metric-card";

export default function MetricCardSystemVariants() {
  return (
    <div className="grid gap-px border border-border/60 bg-border/60 lg:grid-cols-3">
      <MetricCard
        className="w-full max-w-none border-0 bg-card"
        isLoading
        label="Active connections"
        value={0}
      />
      <MetricCard
        className="w-full max-w-none border-0 bg-card"
        error="Unable to load connection data."
        label="Active connections"
        value={0}
      />
      <MetricCard
        className="w-full max-w-none border-0 bg-card"
        comparisonLabel="vs yesterday"
        delta={3}
        label="Projects"
        trend={[]}
        value={12}
      />
    </div>
  );
}
