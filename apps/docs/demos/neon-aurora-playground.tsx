"use client";

import { auroraPalettes } from "@neon-ui/registry/components/neon-aurora/fixtures";
import { NeonAurora } from "@neon-ui/registry/components/neon-aurora/neon-aurora";
import { useState } from "react";

import { OptionButton, OptionRow, ShaderDials, useDials } from "./shader-dials";

const DIALS = [
  { defaultValue: 0.7, key: "speed", max: 3, min: 0, step: 0.1 },
  { defaultValue: 0.2, key: "density", max: 1, min: 0, step: 0.05 },
  { defaultValue: 2, key: "intensity", max: 2, min: 0, step: 0.1 },
  { defaultValue: 1, key: "blur", max: 1, min: 0, step: 0.05 },
  { defaultValue: 0.2, key: "glare", max: 1, min: 0, step: 0.05 },
  { defaultValue: 0.75, key: "flare", max: 1, min: 0, step: 0.05 },
  { defaultValue: 0, key: "thickness", max: 1, min: 0, step: 0.05 },
  {
    defaultValue: 0.6,
    key: "whiteFlare",
    label: "white flare",
    max: 1,
    min: 0,
    step: 0.05,
  },
] as const;

const DEFAULT_PALETTE = "neon" as const;

export default function NeonAuroraPlayground() {
  const { dirty, reset, set, values } = useDials(DIALS);
  const [palette, setPalette] =
    useState<keyof typeof auroraPalettes>(DEFAULT_PALETTE);

  return (
    <div className="not-prose flex flex-col gap-3">
      <div className="relative isolate h-56 overflow-hidden rounded-lg border border-border/60 bg-black">
        <NeonAurora
          blur={values.blur}
          className="absolute inset-0"
          colors={auroraPalettes[palette]}
          density={values.density}
          flare={values.flare}
          glare={values.glare}
          intensity={values.intensity}
          speed={values.speed}
          thickness={values.thickness}
          whiteFlare={values.whiteFlare}
        />
      </div>
      <ShaderDials
        config={DIALS}
        dirty={dirty || palette !== DEFAULT_PALETTE}
        onChange={set}
        onReset={() => {
          reset();
          setPalette(DEFAULT_PALETTE);
        }}
        values={values}
      >
        <OptionRow label="palette">
          {(Object.keys(auroraPalettes) as (keyof typeof auroraPalettes)[]).map(
            (option) => (
              <OptionButton
                active={palette === option}
                key={option}
                onClick={() => setPalette(option)}
              >
                {option}
              </OptionButton>
            )
          )}
        </OptionRow>
      </ShaderDials>
    </div>
  );
}
