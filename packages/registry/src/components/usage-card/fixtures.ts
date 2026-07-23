import type { UsageCardProps } from "./usage-card";

const HOUR_S = 3600;
const GB = 1_000_000_000;

/** Daily compute, native seconds — a fortnight trending up. */
export const usageCompute: UsageCardProps = {
  comparisonLabel: "vs previous 14 days",
  data: [
    { label: "Jul 3", value: 3.1 * HOUR_S },
    { label: "Jul 4", value: 2.6 * HOUR_S },
    { label: "Jul 5", value: 3.4 * HOUR_S },
    { label: "Jul 6", value: 3.9 * HOUR_S },
    { label: "Jul 7", value: 4.2 * HOUR_S },
    { label: "Jul 8", value: 3.7 * HOUR_S },
    { label: "Jul 9", value: 4.6 * HOUR_S },
    { label: "Jul 10", value: 5.1 * HOUR_S },
    { label: "Jul 11", value: 4.8 * HOUR_S },
    { label: "Jul 12", value: 5.4 * HOUR_S },
  ],
  metric: "compute",
  previousTotal: 36 * HOUR_S,
  windowLabel: "14d",
};

/** Storage is a level, not a total — the card reads the latest sample. */
export const usageStorage: UsageCardProps = {
  comparisonLabel: "vs 14 days ago",
  data: [
    { label: "Jul 3", value: 3.1 * GB },
    { label: "Jul 4", value: 3.2 * GB },
    { label: "Jul 5", value: 3.25 * GB },
    { label: "Jul 6", value: 3.3 * GB },
    { label: "Jul 7", value: 3.4 * GB },
    { label: "Jul 8", value: 3.45 * GB },
    { label: "Jul 9", value: 3.5 * GB },
    { label: "Jul 10", value: 3.55 * GB },
    { label: "Jul 11", value: 3.6 * GB },
    { label: "Jul 12", value: 3.68 * GB },
  ],
  metric: "storage",
  previousTotal: 3.1 * GB,
  windowLabel: "14d",
};

/** Daily bytes written, summed across the window. */
export const usageWritten: UsageCardProps = {
  comparisonLabel: "vs previous 14 days",
  data: [
    { label: "Jul 3", value: 1.2 * GB },
    { label: "Jul 4", value: 0.9 * GB },
    { label: "Jul 5", value: 1.4 * GB },
    { label: "Jul 6", value: 1.1 * GB },
    { label: "Jul 7", value: 1.6 * GB },
    { label: "Jul 8", value: 1.3 * GB },
    { label: "Jul 9", value: 1.5 * GB },
    { label: "Jul 10", value: 1.8 * GB },
    { label: "Jul 11", value: 1.7 * GB },
    { label: "Jul 12", value: 2 * GB },
  ],
  metric: "written-data",
  previousTotal: 12.4 * GB,
  windowLabel: "14d",
};

export const usageCards: UsageCardProps[] = [
  usageCompute,
  usageStorage,
  usageWritten,
];
