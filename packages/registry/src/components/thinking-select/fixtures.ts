import type { ThinkingEffort } from "./thinking-select";

export const defaultEffort: ThinkingEffort = "medium";

export const effortDescriptions: Record<ThinkingEffort, string> = {
  high: "Extended reasoning for complex, multi-step work.",
  low: "Brief reasoning for straightforward requests.",
  max: "Everything the model has; longest and most expensive turns.",
  medium: "Balanced reasoning for everyday agent turns.",
  off: "No extended thinking; fastest responses.",
  xhigh: "Deep reasoning for the hardest problems.",
};
