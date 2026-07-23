import { healthHealthy } from "./fixtures";
import { HealthCard } from "./health-card";

export const HealthCardDemo = () => (
  <HealthCard className="w-full max-w-sm" {...healthHealthy} />
);

export default HealthCardDemo;
