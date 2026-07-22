"use client";

import { meshPalettes } from "@neon-ui/registry/components/mesh-gradient/fixtures";
import { MeshGradient } from "@neon-ui/registry/components/mesh-gradient/mesh-gradient";
import { useState } from "react";

import { OptionButton, OptionRow, ShaderDials, useDials } from "./shader-dials";

const DIALS = [
  { defaultValue: 0.6, key: "speed", max: 3, min: 0, step: 0.1 },
  { defaultValue: 0.4, key: "warp", max: 1, min: 0, step: 0.05 },
  { defaultValue: 0.5, key: "grain", max: 1, min: 0, step: 0.05 },
  { defaultValue: 1, key: "glow", max: 1.5, min: 0.5, step: 0.05 },
] as const;

const DEFAULT_PALETTE = "brand" as const;

export default function MeshGradientPlayground() {
  const { dirty, reset, set, values } = useDials(DIALS);
  const [palette, setPalette] =
    useState<keyof typeof meshPalettes>(DEFAULT_PALETTE);

  return (
    <div className="not-prose flex flex-col gap-3">
      <div className="relative isolate aspect-video overflow-hidden rounded-lg border border-border/60 bg-black">
        <MeshGradient
          className="absolute inset-0"
          colors={meshPalettes[palette]}
          glow={values.glow}
          grain={values.grain}
          speed={values.speed}
          warp={values.warp}
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
          {(Object.keys(meshPalettes) as (keyof typeof meshPalettes)[]).map(
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
