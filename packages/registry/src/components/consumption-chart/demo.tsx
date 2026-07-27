"use client";

import { useState } from "react";

import type { ConsumptionGranularityOption } from "./consumption-chart";
import { ConsumptionChart } from "./consumption-chart";
import { dailyConsumption, hourlyConsumption, series } from "./fixtures";

export const ConsumptionChartDemo = () => {
  const [granularity, setGranularity] =
    useState<ConsumptionGranularityOption>("daily");

  return (
    <ConsumptionChart
      className="w-full max-w-3xl"
      data={granularity === "hourly" ? hourlyConsumption : dailyConsumption}
      granularities={["hourly", "daily"]}
      granularity={granularity}
      meteredThrough="metered through 21:40 UTC · ~15m behind"
      onGranularityChange={setGranularity}
      series={series}
      title="storage"
    />
  );
};

export default ConsumptionChartDemo;
