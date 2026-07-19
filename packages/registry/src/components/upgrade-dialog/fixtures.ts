import type { UpgradePlan } from "./upgrade-dialog";

/** The paid tier the platform sells. */
export const launchPlan: UpgradePlan = {
  features: [
    "Dedicated Neon project",
    "Always-on compute, no cold starts",
    "Database branching and snapshots",
    "10 GB storage, 100 GB egress",
    "Priority builds",
  ],
  name: "Launch",
  note: "billing starts today · cancel anytime",
  price: 19,
};
