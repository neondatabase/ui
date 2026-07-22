"use client";

import { BannerPattern } from "@neon-ui/registry/components/banner-pattern/banner-pattern";
import { bannerPalettes } from "@neon-ui/registry/components/banner-pattern/fixtures";
import { useState } from "react";

import { OptionButton, OptionRow, ShaderDials, useDials } from "./shader-dials";

const DIALS = [
  { defaultValue: 0.5, key: "speed", max: 3, min: 0, step: 0.1 },
  { defaultValue: 8, key: "cell", max: 24, min: 4, step: 1 },
  {
    defaultValue: 0.14,
    key: "dotSize",
    label: "dot size",
    max: 0.3,
    min: 0.05,
    step: 0.01,
  },
  { defaultValue: 0.5, key: "haze", max: 1, min: 0, step: 0.05 },
  { defaultValue: 0.35, key: "jitter", max: 1, min: 0, step: 0.05 },
] as const;

const DEFAULT_PALETTE = "brand" as const;

export default function BannerPatternPlayground() {
  const { dirty, reset, set, values } = useDials(DIALS);
  const [palette, setPalette] =
    useState<keyof typeof bannerPalettes>(DEFAULT_PALETTE);

  return (
    <div className="not-prose flex flex-col gap-3">
      <div className="relative isolate aspect-video overflow-hidden rounded-lg border border-border/60 bg-black">
        <BannerPattern
          cell={values.cell}
          className="absolute inset-0"
          colors={bannerPalettes[palette]}
          dotSize={values.dotSize}
          haze={values.haze}
          jitter={values.jitter}
          speed={values.speed}
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
          {(Object.keys(bannerPalettes) as (keyof typeof bannerPalettes)[]).map(
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
