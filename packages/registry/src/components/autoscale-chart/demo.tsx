"use client";

import { AutoscaleChart } from "./autoscale-chart";
import { bounds, usage } from "./fixtures";

export const AutoscaleChartDemo = () => (
  <AutoscaleChart
    className="w-full max-w-2xl"
    data={usage}
    max={bounds.max}
    min={bounds.min}
  />
);

export default AutoscaleChartDemo;
