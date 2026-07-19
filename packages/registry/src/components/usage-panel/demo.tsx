"use client";

import { useState } from "react";

import type { DateRange } from "@/components/date-range-picker/date-range-picker";
import { DateRangePicker } from "@/components/date-range-picker/date-range-picker";
import { sampleRange } from "@/components/date-range-picker/fixtures";

import { gatedMetrics, sampleLag, sampleMetrics } from "./fixtures";
import { UsagePanel } from "./usage-panel";

export const UsagePanelDemo = () => {
  const [plan, setPlan] = useState<"free" | "paid">("free");
  const [range, setRange] = useState<DateRange>(sampleRange);

  return (
    <div className="flex w-full flex-col gap-3">
      <UsagePanel
        filter={<DateRangePicker onValueChange={setRange} value={range} />}
        meteredThrough={sampleLag}
        metrics={plan === "free" ? gatedMetrics : sampleMetrics}
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
