import type {
  MetricCardProps,
  MetricFormat,
  MetricTrendPoint,
} from "@/components/metric-card/metric-card";
import { MetricCard } from "@/components/metric-card/metric-card";

/**
 * The Neon per-project consumption metrics UsageCard understands. Each maps to
 * a field on the consumption-history timeframe returned by
 * `getConsumptionHistoryPerProject`.
 */
export type UsageMetric =
  | "compute"
  | "active-time"
  | "storage"
  | "written-data";

/** One consumption sample, in the metric's native unit (seconds or bytes). */
export interface UsagePoint {
  /** Axis label for the sparkline, e.g. a short date or hour. */
  label: string;
  /** Native value: seconds for time metrics, bytes for data metrics. */
  value: number;
}

interface UsageMetricConfig {
  label: string;
  format: MetricFormat;
  unit?: string;
  /**
   * Cumulative metrics (compute, writes) sum across the window; level metrics
   * (storage) read the latest sample.
   */
  aggregate: "sum" | "last";
  /** Native unit → displayed value (seconds → hours, bytes stay bytes). */
  toDisplay: (native: number) => number;
}

const SECONDS_PER_HOUR = 3600;
const secondsToHours = (seconds: number) => seconds / SECONDS_PER_HOUR;
const identity = (value: number) => value;

const USAGE_METRICS: Record<UsageMetric, UsageMetricConfig> = {
  "active-time": {
    aggregate: "sum",
    format: "number",
    label: "Active time",
    toDisplay: secondsToHours,
    unit: "hrs",
  },
  compute: {
    aggregate: "sum",
    format: "number",
    label: "Compute",
    toDisplay: secondsToHours,
    unit: "hrs",
  },
  storage: {
    aggregate: "last",
    format: "bytes",
    label: "Storage",
    toDisplay: identity,
  },
  "written-data": {
    aggregate: "sum",
    format: "bytes",
    label: "Data written",
    toDisplay: identity,
  },
};

const PERCENT = 100;

/** Aggregate the window in native units per the metric's rule. */
const aggregateNative = (data: UsagePoint[], aggregate: "sum" | "last") => {
  if (aggregate === "last") {
    return data.at(-1)?.value ?? 0;
  }

  return data.reduce((sum, point) => sum + point.value, 0);
};

export type UsageCardProps = Omit<
  MetricCardProps,
  "value" | "format" | "unit" | "trend" | "label" | "delta"
> & {
  /** Which consumption metric this card reads. */
  metric: UsageMetric;
  /** The window's samples, newest last, in native units. */
  data: UsagePoint[];
  /** Previous-window total (native units); when set, drives the signed delta. */
  previousTotal?: number;
  /** Overrides the metric's default label. */
  label?: string;
  /** Appended to the label as quiet context, e.g. "14d". */
  windowLabel?: string;
};

/**
 * A single Neon consumption metric on the MetricCard shell. Hand it the raw
 * per-project samples in their native units and the metric kind; it derives the
 * label, formatting, unit, total, sparkline, and (with `previousTotal`) the
 * signed delta. Presentational: data comes from a server component or the Data
 * API — see example.tsx.
 */
export const UsageCard = ({
  metric,
  data,
  previousTotal,
  label,
  windowLabel,
  comparisonLabel,
  ...props
}: UsageCardProps) => {
  const config = USAGE_METRICS[metric];
  const currentNative = aggregateNative(data, config.aggregate);

  const trend: MetricTrendPoint[] | undefined =
    data.length > 0
      ? data.map((point) => ({
          label: point.label,
          value: config.toDisplay(point.value),
        }))
      : undefined;

  const hasDelta =
    previousTotal !== undefined && previousTotal !== 0 && data.length > 0;
  const delta = hasDelta
    ? Math.round(((currentNative - previousTotal) / previousTotal) * PERCENT)
    : undefined;

  const fullLabel = windowLabel
    ? `${label ?? config.label} · ${windowLabel}`
    : (label ?? config.label);

  return (
    <MetricCard
      comparisonLabel={comparisonLabel}
      data-slot="usage-card"
      delta={delta}
      format={config.format}
      label={fullLabel}
      trend={trend}
      unit={config.unit}
      value={config.toDisplay(currentNative)}
      {...props}
    />
  );
};
