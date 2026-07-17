import { metricConnections } from "./fixtures";
import { MetricCard } from "./metric-card";

export const MetricCardDemo = () => (
  <MetricCard className="w-full max-w-sm" {...metricConnections} />
);

export default MetricCardDemo;
