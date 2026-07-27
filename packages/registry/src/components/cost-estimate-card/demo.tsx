"use client";

import { CostEstimateCard } from "./cost-estimate-card";
import { costLines, spendingLimit } from "./fixtures";

export const CostEstimateCardDemo = () => (
  <CostEstimateCard
    className="w-full max-w-md"
    lines={costLines}
    period="Feb 1 – Feb 14"
    plan="scale"
    spendingLimit={spendingLimit}
  />
);

export default CostEstimateCardDemo;
