import { usageCompute } from "./fixtures";
import { UsageCard } from "./usage-card";

export const UsageCardDemo = () => (
  <UsageCard className="w-full max-w-sm" {...usageCompute} />
);

export default UsageCardDemo;
