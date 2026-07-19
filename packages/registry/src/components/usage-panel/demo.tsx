"use client";

import { useMemo, useState } from "react";

import type { DateRange } from "@/components/date-range-picker/date-range-picker";
import { DateRangePicker } from "@/components/date-range-picker/date-range-picker";
import { sampleRange } from "@/components/date-range-picker/fixtures";

import { metricsForRange, sampleLag } from "./fixtures";
import type { UsageMetric } from "./usage-panel";
import { UsagePanel } from "./usage-panel";

const BRANCH_COMPUTE_GATE: UsageMetric = {
  format: "number",
  gated: true,
  id: "branch_compute_unit_seconds",
  label: "Branch compute",
  value: 0,
};

export const UsagePanelDemo = () => {
  const [plan, setPlan] = useState<"free" | "paid">("free");
  const [range, setRange] = useState<DateRange>(sampleRange);

  // The picker drives the data — the demo's stand-in for refetching
  // the consumption API with from/to.
  const metrics = useMemo(() => {
    const base = metricsForRange(range.from, range.to);
    return plan === "free" ? [...base, BRANCH_COMPUTE_GATE] : base;
  }, [range, plan]);

  return (
    <div className="flex w-full flex-col gap-3">
      <UsagePanel
        filter={<DateRangePicker onValueChange={setRange} value={range} />}
        meteredThrough={sampleLag}
        metrics={metrics}
        onUpgrade={() => setPlan("paid")}
      />
      <div className="flex gap-1.5">
        {(["free", "paid"] as const).map((option) => (
          <button
            className={
              option === plan
                ? "border border-primary/60 px-2.5 py-1 font-mono text-foreground text-xs"
                : "border border-border/60 px-2.5 py-1 font-mono text-muted-foreground text-xs transition-colors hover:border-border hover:text-foreground"
            }
            key={option}
            onClick={() => setPlan(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UsagePanelDemo;
