"use client";

import { useState } from "react";

import { useRegionPing } from "@/hooks/use-region-ping";

import { neonAwsRegions } from "./fixtures";
import { RegionGlobe } from "./region-globe";

/**
 * The live wiring: measure real round-trips with useRegionPing and
 * caption the globe with the selected region's number. Endpoints
 * just need to be reachable — the opaque no-cors response is never
 * read, so any health URL per region works.
 */
export const RegionGlobeExample = () => {
  const [region, setRegion] = useState("aws-us-east-1");
  const { pings, status } = useRegionPing({
    "aws-eu-central-1": "https://eu-central-1.aws.example.com/health",
    "aws-us-east-1": "https://us-east-1.aws.example.com/health",
  });
  const ping = pings[region];

  return (
    <div className="flex flex-col items-center gap-2">
      <RegionGlobe
        onValueChange={setRegion}
        regions={neonAwsRegions}
        value={region}
      />
      <p aria-live="polite" className="font-mono text-muted-foreground text-xs">
        {status === "measuring" && "measuring\u2026"}
        {typeof ping === "number" && `ping: ${ping} ms`}
      </p>
    </div>
  );
};
