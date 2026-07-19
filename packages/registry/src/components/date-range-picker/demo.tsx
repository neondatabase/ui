"use client";

import { useState } from "react";

import type { DateRange } from "./date-range-picker";
import { DateRangePicker } from "./date-range-picker";
import { billingPresets, sampleRange } from "./fixtures";

export const DateRangePickerDemo = () => {
  const [range, setRange] = useState<DateRange>(sampleRange);

  return (
    <DateRangePicker
      onValueChange={setRange}
      presets={billingPresets}
      value={range}
    />
  );
};

export default DateRangePickerDemo;
