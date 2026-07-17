import type { MetricCardProps } from "./metric-card";

/** Realistic metric snapshots for docs previews and tests. */
export const metricConnections: MetricCardProps = {
  comparisonLabel: "vs yesterday",
  delta: 12,
  format: "number",
  label: "Active connections",
  trend: [
    { label: "8 AM", value: 18 },
    { label: "9 AM", value: 22 },
    { label: "10 AM", value: 20 },
    { label: "11 AM", value: 27 },
    { label: "12 PM", value: 31 },
    { label: "1 PM", value: 29 },
    { label: "2 PM", value: 34 },
    { label: "3 PM", value: 38 },
    { label: "4 PM", value: 36 },
    { label: "5 PM", value: 42 },
  ],
  value: 42,
};

export const metricStorage: MetricCardProps = {
  comparisonLabel: "vs previous 10 days",
  delta: 4,
  format: "bytes",
  label: "Storage used",
  trend: [
    { label: "Jul 7", value: 2_900_000_000 },
    { label: "Jul 8", value: 3_020_000_000 },
    { label: "Jul 9", value: 3_100_000_000 },
    { label: "Jul 10", value: 3_150_000_000 },
    { label: "Jul 11", value: 3_300_000_000 },
    { label: "Jul 12", value: 3_400_000_000 },
    { label: "Jul 13", value: 3_450_000_000 },
    { label: "Jul 14", value: 3_500_000_000 },
    { label: "Jul 15", value: 3_600_000_000 },
    { label: "Jul 16", value: 3_650_000_000 },
  ],
  value: 3_650_000_000,
};

export const metricComputeHours: MetricCardProps = {
  comparisonLabel: "vs previous 10 days",
  delta: -8,
  format: "number",
  label: "Compute this month",
  trend: [
    { label: "Jul 7", value: 14 },
    { label: "Jul 8", value: 12 },
    { label: "Jul 9", value: 16 },
    { label: "Jul 10", value: 11 },
    { label: "Jul 11", value: 9 },
    { label: "Jul 12", value: 13 },
    { label: "Jul 13", value: 10 },
    { label: "Jul 14", value: 8 },
    { label: "Jul 15", value: 9 },
    { label: "Jul 16", value: 7 },
  ],
  unit: "hrs",
  value: 128,
};

export const metricCacheHit: MetricCardProps = {
  comparisonLabel: "vs yesterday",
  delta: 0,
  format: "percent",
  label: "Cache hit ratio",
  trend: [
    { label: "8 AM", value: 98.7 },
    { label: "9 AM", value: 98.9 },
    { label: "10 AM", value: 99.1 },
    { label: "11 AM", value: 99.05 },
    { label: "12 PM", value: 99.2 },
    { label: "1 PM", value: 99.1 },
    { label: "2 PM", value: 99.3 },
    { label: "3 PM", value: 99.2 },
    { label: "4 PM", value: 99.2 },
    { label: "5 PM", value: 99.2 },
  ],
  value: 99.2,
};

export const metricSpend: MetricCardProps = {
  comparisonLabel: "vs last month",
  delta: 19,
  format: "currency",
  label: "Estimated spend",
  trend: [
    { label: "Jul 7", value: 180 },
    { label: "Jul 8", value: 195 },
    { label: "Jul 9", value: 210 },
    { label: "Jul 10", value: 224 },
    { label: "Jul 11", value: 236 },
    { label: "Jul 12", value: 248 },
    { label: "Jul 13", value: 259 },
    { label: "Jul 14", value: 268 },
    { label: "Jul 15", value: 277 },
    { label: "Jul 16", value: 284 },
  ],
  value: 284.5,
};

export const metricCards: MetricCardProps[] = [
  metricConnections,
  metricStorage,
  metricComputeHours,
  metricCacheHit,
];
