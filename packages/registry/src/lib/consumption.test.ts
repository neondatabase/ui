import { describe, expect, it } from "vitest";

import type { ConsumptionPeriod } from "@/lib/consumption";
import {
  billableBranchHours,
  billableTransferGb,
  estimateCost,
  flattenConsumption,
  hoursBetween,
  sumBuckets,
  toAverageGb,
  toBillingUnit,
  toBranchMonths,
  toCuHours,
  toGbMonths,
} from "@/lib/consumption";

const periods: ConsumptionPeriod[] = [
  {
    consumption: [
      {
        metrics: [
          { metric_name: "compute_unit_seconds", value: 236 },
          { metric_name: "root_branch_bytes_month", value: 200 },
        ],
        timeframe_end: "2026-02-06T00:00:00Z",
        timeframe_start: "2026-02-05T00:00:00Z",
      },
      {
        metrics: [{ metric_name: "compute_unit_seconds", value: 84 }],
        timeframe_end: "2026-02-05T00:00:00Z",
        timeframe_start: "2026-02-04T00:00:00Z",
      },
    ],
    period_id: "p1",
    period_plan: "launch",
    period_start: "2026-02-02T18:04:52Z",
  },
];

describe("unit conversion", () => {
  it("converts CU-seconds to CU-hours", () => {
    expect(toCuHours(500_000)).toBeCloseTo(138.89, 2);
  });

  it("converts byte-hours to GB-months on the 744-hour month", () => {
    expect(toGbMonths(2_500_000_000_000)).toBeCloseTo(3.36, 2);
  });

  it("converts byte-hours to the average GB the Console shows", () => {
    // 2 GB held for a full 31-day month.
    expect(toAverageGb(1_488_000_000_000, 744)).toBeCloseTo(2, 5);
  });

  it("returns zero average GB for an empty window", () => {
    expect(toAverageGb(1000, 0)).toBe(0);
  });

  it("converts branch-hours to branch-months", () => {
    expect(toBranchMonths(72)).toBeCloseTo(0.0968, 4);
  });

  it("picks the right conversion per metric", () => {
    expect(toBillingUnit("compute_unit_seconds", 3600)).toBe(1);
    expect(toBillingUnit("public_network_transfer_bytes", 2e9)).toBe(2);
    expect(toBillingUnit("private_network_transfer_bytes", 1e9)).toBe(1);
    expect(toBillingUnit("extra_branches_month", 744)).toBe(1);
    expect(toBillingUnit("snapshot_storage_bytes_month", 744e9)).toBe(1);
  });

  it("counts hours between timestamps", () => {
    expect(hoursBetween("2026-02-01T00:00:00Z", "2026-02-02T00:00:00Z")).toBe(
      24
    );
  });

  it("never reports negative hours for a reversed range", () => {
    expect(hoursBetween("2026-02-02T00:00:00Z", "2026-02-01T00:00:00Z")).toBe(
      0
    );
  });
});

describe("flattenConsumption", () => {
  it("flattens periods into buckets ordered oldest first", () => {
    const buckets = flattenConsumption(periods);

    expect(buckets).toHaveLength(2);
    expect(buckets[0]?.start).toBe("2026-02-04T00:00:00Z");
    expect(buckets[0]?.values.compute_unit_seconds).toBe(84);
  });

  it("omits metrics the API left out rather than inventing zeroes", () => {
    const [first] = flattenConsumption(periods);

    expect(first?.values.root_branch_bytes_month).toBeUndefined();
  });
});

describe("sumBuckets", () => {
  it("sums each metric across buckets", () => {
    const totals = sumBuckets(flattenConsumption(periods));

    expect(totals.compute_unit_seconds).toBe(320);
    expect(totals.root_branch_bytes_month).toBe(200);
  });

  it("leaves absent metrics absent", () => {
    expect(sumBuckets([]).compute_unit_seconds).toBeUndefined();
  });
});

describe("allowances", () => {
  it("charges only public transfer past the 500 GB allowance", () => {
    expect(billableTransferGb(620)).toBe(120);
    expect(billableTransferGb(400)).toBe(0);
  });

  it("subtracts the included child branches per hour", () => {
    // 12 child branches on Launch for one day: (10 - 1) x 24 = 216 free.
    expect(billableBranchHours(288, "launch", 24)).toBe(72);
  });

  it("never bills below zero when under the branch allowance", () => {
    expect(billableBranchHours(100, "scale", 24)).toBe(0);
  });
});

describe("estimateCost", () => {
  it("prices compute at the plan rate", () => {
    const { items, total } = estimateCost(
      { compute_unit_seconds: 500_000 },
      "scale"
    );

    expect(items[0]?.quantity).toBeCloseTo(138.89, 2);
    expect(total).toBeCloseTo(30.83, 2);
  });

  it("bills the Agent plan compute at the Launch rate", () => {
    const agent = estimateCost({ compute_unit_seconds: 3600 }, "agent");
    const launch = estimateCost({ compute_unit_seconds: 3600 }, "launch");

    expect(agent.total).toBe(launch.total);
  });

  it("applies the transfer allowance before charging", () => {
    const { items } = estimateCost(
      { public_network_transfer_bytes: 620e9 },
      "launch"
    );

    expect(items[0]?.quantity).toBeCloseTo(120, 5);
    expect(items[0]?.included).toBeCloseTo(500, 5);
    expect(items[0]?.cost).toBeCloseTo(12, 5);
  });

  it("applies the branch allowance using the period length", () => {
    const { items } = estimateCost({ extra_branches_month: 288 }, "launch", {
      hoursInPeriod: 24,
    });

    expect(items[0]?.quantity).toBeCloseTo(0.0968, 4);
    expect(items[0]?.cost).toBeCloseTo(0.145, 3);
  });

  it("keeps zero lines by default and drops them on request", () => {
    const totals = { compute_unit_seconds: 0, root_branch_bytes_month: 744e9 };

    expect(estimateCost(totals, "launch").items).toHaveLength(2);
    expect(
      estimateCost(totals, "launch", { omitZero: true }).items
    ).toHaveLength(1);
  });

  it("sums line items into the total", () => {
    const { items, total } = estimateCost(
      { compute_unit_seconds: 3600, root_branch_bytes_month: 744e9 },
      "launch"
    );

    expect(total).toBeCloseTo(
      items.reduce((sum, item) => sum + item.cost, 0),
      10
    );
  });
});
