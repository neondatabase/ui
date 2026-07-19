import type { UsageMetric } from "./usage-panel";

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

/** The free-plan view: branch compute is locked. */
export const gatedMetrics: UsageMetric[] = [
  ...sampleMetrics,
  {
    format: "number",
    gated: true,
    id: "branch_compute_unit_seconds",
    label: "Branch compute",
    value: 0,
  },
];

export const samplePeriod = "Jul 1 – Jul 18";

export const sampleLag = "metered through 21:40 UTC · ~15m behind";
