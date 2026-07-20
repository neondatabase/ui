"use client";

import { RegionCard } from "./region-card";

/**
 * The overlay wiring: the card ships unpositioned, so anchor it
 * with className wherever it floats — over a map, a globe, or in
 * a plain list. Pass `ping` from useRegionPing for the color-coded
 * round-trip line.
 */
export const RegionCardExample = () => (
  <div className="relative h-48 w-full max-w-lg rounded-lg border border-border/60 bg-card/40">
    <RegionCard
      className="absolute bottom-3 left-3"
      ping={92}
      regionId="aws-eu-central-1"
      title="AWS Europe Central 1 (Frankfurt)"
    />
  </div>
);
