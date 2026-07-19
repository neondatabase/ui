import type { UsageMetric } from "./usage-panel";

const DAY_MS = 86_400_000;
const POINT_LABEL = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
});

/** Deterministic pseudo-noise so demo charts look alive but stable. */
const drift = (seed: number, index: number) =>
  Math.sin(seed * 7.13 + index * 1.7) * 0.5 +
  Math.sin(seed * 3.7 + index * 0.53) * 0.5;

const series = (
  seed: number,
  base: number,
  slope: number,
  from: Date,
  to: Date
) => {
  const days = Math.max(
    1,
    Math.round((to.getTime() - from.getTime()) / DAY_MS)
  );
  // Daily points up to a month, then weekly buckets.
  const step = days > 31 ? 7 : 1;
  const count = Math.max(2, Math.floor(days / step) + 1);

  return Array.from({ length: count }, (_, index) => {
    const at = new Date(from.getTime() + index * step * DAY_MS);
    const progress = index / (count - 1);
    return {
      label: POINT_LABEL.format(at),
      value: Math.max(
        0,
        base * (1 + slope * progress + 0.12 * drift(seed, index))
      ),
    };
  });
};

/**
 * Synthesizes the consumption metrics for a date range — the demo's
 * stand-in for refetching GET /consumption_history/projects with
 * from/to. Deterministic per range, so charts shift with the picker
 * without flickering between renders.
 */
const last = (points: { value: number }[]) => points.at(-1)?.value ?? 0;

const deltaOf = (points: { value: number }[]) => {
  const first = points[0]?.value ?? 1;
  return Math.round(((last(points) - first) / first) * 100);
};

export const metricsForRange = (from: Date, to: Date): UsageMetric[] => {
  const compute = series(1, 19, 0.18, from, to);
  const storage = series(2, 3_100_000_000, 0.09, from, to);
  const egress = series(3, 760_000_000, -0.08, from, to);

  return [
    {
      comparisonLabel: "over this period",
      delta: deltaOf(compute),
      format: "number",
      id: "compute_unit_seconds",
      label: "Compute",
      trend: compute,
      unit: "CU-hrs",
      value: Number(last(compute).toFixed(1)),
    },
    {
      comparisonLabel: "over this period",
      delta: deltaOf(storage),
      format: "bytes",
      id: "storage_bytes",
      label: "Storage",
      trend: storage,
      value: Math.round(last(storage)),
    },
    {
      comparisonLabel: "over this period",
      delta: deltaOf(egress),
      format: "bytes",
      id: "egress_bytes",
      label: "Egress",
      trend: egress,
      value: Math.round(last(egress)),
    },
  ];
};

/**
 * The v2 per-project consumption metrics the way the API reports them:
 * compute_unit_seconds shown as CU-hours, storage and egress as bytes.
 */
export const sampleMetrics: UsageMetric[] = [
  {
    comparisonLabel: "vs last week",
    delta: 9,
    format: "number",
    id: "compute_unit_seconds",
    label: "Compute",
    trend: [
      { label: "Jul 12", value: 14.2 },
      { label: "Jul 13", value: 16.8 },
      { label: "Jul 14", value: 15.1 },
      { label: "Jul 15", value: 18.4 },
      { label: "Jul 16", value: 21 },
      { label: "Jul 17", value: 19.6 },
      { label: "Jul 18", value: 22.3 },
    ],
    unit: "CU-hrs",
    value: 22.3,
  },
  {
    comparisonLabel: "vs last week",
    delta: 4,
    format: "bytes",
    id: "storage_bytes",
    label: "Storage",
    trend: [
      { label: "Jul 12", value: 2_950_000_000 },
      { label: "Jul 13", value: 3_010_000_000 },
      { label: "Jul 14", value: 3_090_000_000 },
      { label: "Jul 15", value: 3_180_000_000 },
      { label: "Jul 16", value: 3_260_000_000 },
      { label: "Jul 17", value: 3_310_000_000 },
      { label: "Jul 18", value: 3_380_000_000 },
    ],
    value: 3_380_000_000,
  },
  {
    comparisonLabel: "vs last week",
    delta: -6,
    format: "bytes",
    id: "egress_bytes",
    label: "Egress",
    trend: [
      { label: "Jul 12", value: 812_000_000 },
      { label: "Jul 13", value: 774_000_000 },
      { label: "Jul 14", value: 901_000_000 },
      { label: "Jul 15", value: 688_000_000 },
      { label: "Jul 16", value: 745_000_000 },
      { label: "Jul 17", value: 702_000_000 },
      { label: "Jul 18", value: 731_000_000 },
    ],
    value: 731_000_000,
  },
];

export const sampleLag = "metered through 21:40 UTC · ~15m behind";
