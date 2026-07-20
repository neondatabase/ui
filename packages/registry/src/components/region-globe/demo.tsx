"use client";

import { useState } from "react";

import { pingTone } from "@/components/region-card/region-card";

import { neonAwsRegions, sampleLatencies } from "./fixtures";
import type { RegionGlobeVariant } from "./region-globe";
import { RegionGlobe } from "./region-globe";

const VARIANTS: RegionGlobeVariant[] = ["relief", "dots", "outlines"];

export const RegionGlobeDemo = () => {
  const [region, setRegion] = useState("aws-eu-central-1");
  const [touched, setTouched] = useState(false);
  const [variant, setVariant] = useState<RegionGlobeVariant>("relief");
  const ping = sampleLatencies[region];

  const choose = (next: string) => {
    setRegion(next);
    setTouched(true);
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <div className="flex gap-1.5">
        {VARIANTS.map((option) => (
          <button
            className={
              option === variant
                ? "rounded-md bg-primary px-2 py-1 font-mono text-[11px] text-primary-foreground"
                : "rounded-md border border-border/60 px-2 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
            }
            key={option}
            onClick={() => setVariant(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
      <RegionGlobe
        key={variant}
        latencies={sampleLatencies}
        onValueChange={choose}
        regions={neonAwsRegions}
        spin={!touched}
        value={region}
        variant={variant}
      />
      <p aria-live="polite" className="font-mono text-muted-foreground text-xs">
        {typeof ping === "number" ? (
          <span className={pingTone(ping)}>ping: {ping} ms</span>
        ) : (
          "\u00A0"
        )}
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {neonAwsRegions.map((option) => (
          <button
            className={
              option.id === region
                ? "rounded-md bg-primary px-2 py-1 font-mono text-[11px] text-primary-foreground"
                : "rounded-md border border-border/60 px-2 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
            }
            key={option.id}
            onClick={() => choose(option.id)}
            type="button"
          >
            {option.id.replace("aws-", "")}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RegionGlobeDemo;
