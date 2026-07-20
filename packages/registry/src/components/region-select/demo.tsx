"use client";

import { useState } from "react";

import { sampleLatencies } from "@/components/region-globe/fixtures";

import { neonAwsRegions } from "./fixtures";
import { RegionSelect } from "./region-select";

export const RegionSelectDemo = () => {
  const [region, setRegion] = useState("aws-eu-central-1");

  return (
    <div className="flex w-full max-w-xl flex-col gap-1.5">
      <p className="font-medium text-foreground text-sm">Region</p>
      <RegionSelect
        latencies={sampleLatencies}
        onValueChange={setRegion}
        regions={neonAwsRegions}
        value={region}
      />
      <p className="text-muted-foreground text-xs">
        Select the region closest to your application.
      </p>
    </div>
  );
};

export default RegionSelectDemo;
