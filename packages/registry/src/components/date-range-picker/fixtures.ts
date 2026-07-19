import type { DateRange, DateRangePreset } from "./date-range-picker";

const DAY_MS = 86_400_000;

const today = new Date(new Date().setHours(0, 0, 0, 0));

/** The current billing period the demos start on. */
export const sampleRange: DateRange = {
  from: new Date(today.getTime() - 17 * DAY_MS),
  to: today,
};

export const billingPresets: DateRangePreset[] = [
  { days: 7, label: "last 7 days" },
  { days: 14, label: "last 14 days" },
  { days: 30, label: "last 30 days" },
  { days: 90, label: "last 90 days" },
];
