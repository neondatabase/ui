/**
 * Consumption metrics: shapes, unit conversion, and cost math for the Neon
 * v2 consumption API (`/consumption_history/v2/projects` and `/branches`).
 *
 * The API reports raw units — CU-seconds, byte-hours, branch-hours — which
 * are not what an invoice or a dashboard shows. Every conversion Neon
 * documents lives here once, so a chart, a breakdown, and a cost estimate
 * can't drift from each other or from the bill.
 *
 * See https://neon.com/docs/introduction/usage-calculations.
 */

/** The eight billable metrics returned by the per-project endpoint. */
export const CONSUMPTION_METRICS = [
  "compute_unit_seconds",
  "root_branch_bytes_month",
  "child_branch_bytes_month",
  "instant_restore_bytes_month",
  "snapshot_storage_bytes_month",
  "public_network_transfer_bytes",
  "private_network_transfer_bytes",
  "extra_branches_month",
] as const;

export type ConsumptionMetricName = (typeof CONSUMPTION_METRICS)[number];

/** The six metrics the per-branch endpoint supports. */
export const BRANCH_CONSUMPTION_METRICS = [
  "compute_unit_seconds",
  "root_branch_bytes_month",
  "child_branch_bytes_month",
  "instant_restore_bytes_month",
  "public_network_transfer_bytes",
  "private_network_transfer_bytes",
] as const;

export type BranchConsumptionMetricName =
  (typeof BRANCH_CONSUMPTION_METRICS)[number];

export type ConsumptionGranularity = "hourly" | "daily" | "monthly";

export type ConsumptionPlan = "launch" | "scale" | "agent" | "enterprise";

/**
 * Shapes mirror the SDK's response types, optional fields and all: the API
 * omits a metric whose value was zero, and omits timeframe bounds on empty
 * buckets. Accepting that here means an SDK response drops straight in.
 */
export interface ConsumptionMetricValue {
  metric_name: string;
  value: number;
}

export interface ConsumptionTimeframe {
  timeframe_start?: string;
  timeframe_end?: string;
  metrics?: ConsumptionMetricValue[];
}

export interface ConsumptionPeriod {
  period_id?: string;
  period_plan?: string;
  period_start?: string;
  consumption?: ConsumptionTimeframe[];
}

export interface ConsumptionProject {
  project_id: string;
  periods: ConsumptionPeriod[];
}

export interface ConsumptionBranch {
  branch_id: string;
  project_id: string;
  periods: ConsumptionPeriod[];
}

/** One timeframe flattened to a metric-name -> value map. */
export interface ConsumptionBucket {
  start: string;
  end: string;
  values: Partial<Record<ConsumptionMetricName, number>>;
}

/** Metric totals over a range, in raw API units. */
export type ConsumptionTotals = Partial<Record<ConsumptionMetricName, number>>;

/* ── Constants ───────────────────────────────────────────── */

/** Neon bills a fixed 744-hour month (31 x 24), whatever the calendar says. */
export const BILLING_HOURS_PER_MONTH = 744;
/** Neon counts decimal gigabytes (10^9 bytes), not gibibytes. */
export const BYTES_PER_GB = 1_000_000_000;
const SECONDS_PER_HOUR = 3600;
const MS_PER_HOUR = 3_600_000;

/** Free public-transfer allowance per project, in GB, on paid plans. */
export const PUBLIC_TRANSFER_FREE_GB = 500;

/** Included branches per project, by plan; the root branch is one of them. */
export const BRANCHES_PER_PROJECT: Record<ConsumptionPlan, number> = {
  agent: 25,
  enterprise: 25,
  launch: 10,
  scale: 25,
};

/** Human labels for the raw metric names. */
export const METRIC_LABELS: Record<ConsumptionMetricName, string> = {
  child_branch_bytes_month: "Child branch storage",
  compute_unit_seconds: "Compute",
  extra_branches_month: "Extra branches",
  instant_restore_bytes_month: "Instant restore",
  private_network_transfer_bytes: "Private transfer",
  public_network_transfer_bytes: "Public transfer",
  root_branch_bytes_month: "Root branch storage",
  snapshot_storage_bytes_month: "Snapshots",
};

/** The unit a metric is billed in, once converted. */
export const METRIC_BILLING_UNIT: Record<ConsumptionMetricName, string> = {
  child_branch_bytes_month: "GB-mo",
  compute_unit_seconds: "CU-hr",
  extra_branches_month: "branch-mo",
  instant_restore_bytes_month: "GB-mo",
  private_network_transfer_bytes: "GB",
  public_network_transfer_bytes: "GB",
  root_branch_bytes_month: "GB-mo",
  snapshot_storage_bytes_month: "GB-mo",
};

/** The four storage metrics, in the order a breakdown should stack them. */
export const STORAGE_METRICS = [
  "root_branch_bytes_month",
  "child_branch_bytes_month",
  "instant_restore_bytes_month",
  "snapshot_storage_bytes_month",
] as const satisfies readonly ConsumptionMetricName[];

/**
 * One color per metric, so a hue means the same thing in every component.
 * Positional palettes drift: green is the first series in one card and a
 * different series in the next, and the reader learns the wrong lesson.
 * Pass these to a chart's `series` or a breakdown's `segments`.
 *
 * Eight metrics share five chart tokens. The assignment deliberately
 * avoids giving neighbouring steps of the ramp to metrics that stack
 * next to each other: root, child, instant restore, and snapshots read
 * mid, pale, deep, brand, so every boundary in a storage stack is a
 * large jump in lightness. A chart plotting storage and transfer at once
 * should pass its own colors.
 */
export const METRIC_COLORS: Record<ConsumptionMetricName, string> = {
  child_branch_bytes_month: "var(--chart-1)",
  compute_unit_seconds: "var(--chart-2)",
  extra_branches_month: "var(--chart-5)",
  instant_restore_bytes_month: "var(--chart-4)",
  private_network_transfer_bytes: "var(--chart-4)",
  public_network_transfer_bytes: "var(--chart-5)",
  root_branch_bytes_month: "var(--chart-3)",
  snapshot_storage_bytes_month: "var(--chart-2)",
};

/* ── Unit conversion ─────────────────────────────────────── */

/** CU-seconds -> CU-hours. */
export const toCuHours = (cuSeconds: number) => cuSeconds / SECONDS_PER_HOUR;

/** byte-hours -> GB-months, the billing unit. */
export const toGbMonths = (byteHours: number) =>
  byteHours / BILLING_HOURS_PER_MONTH / BYTES_PER_GB;

/**
 * byte-hours -> average GB held over the window, which is what the Neon
 * Console shows. Use this for "how big is my database", not for cost.
 */
export const toAverageGb = (byteHours: number, hoursInPeriod: number) =>
  hoursInPeriod > 0 ? byteHours / hoursInPeriod / BYTES_PER_GB : 0;

/** bytes -> GB. */
export const toGigabytes = (bytes: number) => bytes / BYTES_PER_GB;

/** branch-hours -> branch-months. */
export const toBranchMonths = (branchHours: number) =>
  branchHours / BILLING_HOURS_PER_MONTH;

/** Whole hours between two RFC 3339 timestamps; the divisor for average GB. */
export const hoursBetween = (from: string | Date, to: string | Date) => {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();

  return Math.max(0, (end - start) / MS_PER_HOUR);
};

/** Raw value -> billing unit, picked by metric. */
export const toBillingUnit = (
  metric: ConsumptionMetricName,
  value: number
): number => {
  if (metric === "compute_unit_seconds") {
    return toCuHours(value);
  }
  if (metric === "extra_branches_month") {
    return toBranchMonths(value);
  }
  if (metric.endsWith("_network_transfer_bytes")) {
    return toGigabytes(value);
  }

  return toGbMonths(value);
};

/* ── Shaping the response ────────────────────────────────── */

/**
 * Flattens the API's nested periods into one bucket per timeframe, ordered
 * oldest first. Metrics that were zero are omitted from the response, so a
 * missing key means zero, not missing data.
 */
export const flattenConsumption = (
  periods: readonly ConsumptionPeriod[]
): ConsumptionBucket[] =>
  periods
    .flatMap((period) => period.consumption ?? [])
    .map((timeframe) => ({
      end: timeframe.timeframe_end ?? "",
      start: timeframe.timeframe_start ?? "",
      values: Object.fromEntries(
        (timeframe.metrics ?? []).map((metric) => [
          metric.metric_name,
          metric.value,
        ])
      ) as ConsumptionBucket["values"],
    }))
    .sort((a, b) => a.start.localeCompare(b.start));

/** Sums each metric across buckets, in raw API units. */
export const sumBuckets = (
  buckets: readonly ConsumptionBucket[]
): ConsumptionTotals => {
  const totals: ConsumptionTotals = {};

  for (const bucket of buckets) {
    for (const metric of CONSUMPTION_METRICS) {
      const value = bucket.values[metric];

      if (value !== undefined) {
        totals[metric] = (totals[metric] ?? 0) + value;
      }
    }
  }

  return totals;
};

/* ── Allowances ──────────────────────────────────────────── */

/** Public transfer past the per-project free allowance, in GB. */
export const billableTransferGb = (
  projectGb: number,
  allowanceGb: number = PUBLIC_TRANSFER_FREE_GB
) => Math.max(0, projectGb - allowanceGb);

/**
 * `extra_branches_month` counts every child branch, not just the ones past
 * the allowance, so subtract the included branches per bucket before
 * summing. Bucket length matters: allowance is per hour.
 */
export const billableBranchHours = (
  reportedBranchHours: number,
  plan: ConsumptionPlan,
  hoursInBucket: number
) => {
  const freeChildBranches = BRANCHES_PER_PROJECT[plan] - 1;

  return Math.max(0, reportedBranchHours - freeChildBranches * hoursInBucket);
};

/* ── Cost ────────────────────────────────────────────────── */

/** Per-plan rates in USD per billing unit. */
export const PLAN_RATES: Record<
  ConsumptionPlan,
  Record<ConsumptionMetricName, number>
> = {
  agent: {
    child_branch_bytes_month: 0.35,
    compute_unit_seconds: 0.106,
    extra_branches_month: 1.5,
    instant_restore_bytes_month: 0.2,
    private_network_transfer_bytes: 0.01,
    public_network_transfer_bytes: 0.1,
    root_branch_bytes_month: 0.35,
    snapshot_storage_bytes_month: 0.09,
  },
  enterprise: {
    child_branch_bytes_month: 0.35,
    compute_unit_seconds: 0.222,
    extra_branches_month: 1.5,
    instant_restore_bytes_month: 0.2,
    private_network_transfer_bytes: 0.01,
    public_network_transfer_bytes: 0.1,
    root_branch_bytes_month: 0.35,
    snapshot_storage_bytes_month: 0.09,
  },
  launch: {
    child_branch_bytes_month: 0.35,
    compute_unit_seconds: 0.106,
    extra_branches_month: 1.5,
    instant_restore_bytes_month: 0.2,
    private_network_transfer_bytes: 0,
    public_network_transfer_bytes: 0.1,
    root_branch_bytes_month: 0.35,
    snapshot_storage_bytes_month: 0.09,
  },
  scale: {
    child_branch_bytes_month: 0.35,
    compute_unit_seconds: 0.222,
    extra_branches_month: 1.5,
    instant_restore_bytes_month: 0.2,
    private_network_transfer_bytes: 0.01,
    public_network_transfer_bytes: 0.1,
    root_branch_bytes_month: 0.35,
    snapshot_storage_bytes_month: 0.09,
  },
};

export interface CostLineItem {
  /** The metric this line came from. */
  id: ConsumptionMetricName;
  label: string;
  /** Billable amount after allowances, in the billing unit. */
  quantity: number;
  /**
   * Total consumed before any allowance, in the same unit. Without it a
   * line reading "104 GB billable, 500 included" hides whether the account
   * is barely over its allowance or ten times over, which is the fact that
   * decides whether to act.
   */
  used: number;
  /** Amount the plan covers for free, in the same unit. */
  included: number;
  unit: string;
  /** USD per billing unit. */
  rate: number;
  /** quantity x rate, in USD. */
  cost: number;
}

export interface CostEstimate {
  items: CostLineItem[];
  /** Sum of every line, in USD. Usage only; no plan base fee. */
  total: number;
  plan: ConsumptionPlan;
}

export interface EstimateCostOptions {
  /** Hours covered by the totals; needed for the branch allowance. */
  hoursInPeriod?: number;
  /** Override the per-project public transfer allowance, in GB. */
  transferAllowanceGb?: number;
  /** Drop lines that cost nothing. Default false, so zeroes stay visible. */
  omitZero?: boolean;
}

/** Billable quantity for one metric, after the plan's allowance. */
const billableQuantity = (
  metric: ConsumptionMetricName,
  raw: number,
  plan: ConsumptionPlan,
  options: EstimateCostOptions
): { quantity: number; included: number; used: number } => {
  if (metric === "public_network_transfer_bytes") {
    const gb = toGigabytes(raw);
    const allowance = options.transferAllowanceGb ?? PUBLIC_TRANSFER_FREE_GB;

    return {
      included: Math.min(gb, allowance),
      quantity: billableTransferGb(gb, allowance),
      used: gb,
    };
  }

  if (metric === "extra_branches_month") {
    const hours = options.hoursInPeriod ?? 0;
    const billableHours = billableBranchHours(raw, plan, hours);

    return {
      included: toBranchMonths(raw - billableHours),
      quantity: toBranchMonths(billableHours),
      used: toBranchMonths(raw),
    };
  }

  const quantity = toBillingUnit(metric, raw);

  return { included: 0, quantity, used: quantity };
};

/**
 * Turns raw metric totals into invoice-shaped line items. Allowances are
 * applied per metric, so the quantity shown is the quantity charged.
 *
 * Branch allowance is evaluated per hour by Neon's billing system; pass
 * `hoursInPeriod` and prefer hourly totals for the closest match.
 */
export const estimateCost = (
  totals: ConsumptionTotals,
  plan: ConsumptionPlan,
  options: EstimateCostOptions = {}
): CostEstimate => {
  const rates = PLAN_RATES[plan];
  const items: CostLineItem[] = [];

  for (const metric of CONSUMPTION_METRICS) {
    const raw = totals[metric];

    if (raw === undefined) {
      continue;
    }

    const { included, quantity, used } = billableQuantity(
      metric,
      raw,
      plan,
      options
    );
    const rate = rates[metric];
    const cost = quantity * rate;

    if (options.omitZero && cost === 0) {
      continue;
    }

    items.push({
      cost,
      id: metric,
      included,
      label: METRIC_LABELS[metric],
      quantity,
      rate,
      unit: METRIC_BILLING_UNIT[metric],
      used,
    });
  }

  return {
    items,
    plan,
    total: items.reduce((sum, item) => sum + item.cost, 0),
  };
};
