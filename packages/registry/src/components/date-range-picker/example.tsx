"use client";

import { useState } from "react";

import { sampleMetrics } from "@/components/usage-panel/fixtures";
import { UsagePanel } from "@/components/usage-panel/usage-panel";

import type { DateRange } from "./date-range-picker";
import { DateRangePicker } from "./date-range-picker";
import { sampleRange } from "./fixtures";

/**
 * The usage-tab wiring: the picker rides UsagePanel's filter slot and
 * the selected range drives the consumption query.
 */
export const DateRangePickerExample = () => {
  const [range, setRange] = useState<DateRange>(sampleRange);

  const handleRangeChange = (next: DateRange) => {
    setRange(next);
    // Refetch: GET /consumption_history/projects?from=...&to=...
  };

  return (
    <UsagePanel
      filter={
        <DateRangePicker onValueChange={handleRangeChange} value={range} />
      }
      metrics={sampleMetrics}
    />
  );
};
