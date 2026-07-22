"use client";

import { bloomScenes } from "@neon-ui/registry/components/halftone-bloom/fixtures";
import { HalftoneBloom } from "@neon-ui/registry/components/halftone-bloom/halftone-bloom";
import { useState } from "react";

import { OptionButton, OptionRow, ShaderDials, useDials } from "./shader-dials";

const DIALS = [
  { defaultValue: 1, key: "speed", max: 4, min: 0, step: 0.1 },
  { defaultValue: 12, key: "gap", max: 28, min: 6, step: 1 },
  {
    defaultValue: 0.22,
    key: "holeSize",
    label: "hole",
    max: 0.4,
    min: 0,
    step: 0.02,
  },
  { defaultValue: 1, key: "intensity", max: 2, min: 0, step: 0.05 },
] as const;

const DEFAULT_SCENE = "heritage" as const;
const DEFAULT_SURFACE = "black" as const;

export default function HalftoneBloomPlayground() {
  const { dirty, reset, set, values } = useDials(DIALS);
  const [scene, setScene] = useState<keyof typeof bloomScenes>(DEFAULT_SCENE);
  const [surface, setSurface] = useState<"black" | "white">(DEFAULT_SURFACE);

  return (
    <div className="not-prose flex flex-col gap-3">
      <div
        className={`relative isolate h-56 overflow-hidden rounded-lg border border-border/60 ${surface === "black" ? "bg-black" : "bg-white"}`}
      >
        <HalftoneBloom
          className="absolute inset-0"
          gap={values.gap}
          highlight={bloomScenes[scene].highlight}
          holeSize={values.holeSize}
          intensity={values.intensity}
          lights={bloomScenes[scene].lights}
          speed={values.speed}
        />
      </div>
      <ShaderDials
        config={DIALS}
        dirty={dirty || scene !== DEFAULT_SCENE || surface !== DEFAULT_SURFACE}
        onChange={set}
        onReset={() => {
          reset();
          setScene(DEFAULT_SCENE);
          setSurface(DEFAULT_SURFACE);
        }}
        values={values}
      >
        <OptionRow label="scene">
          {(Object.keys(bloomScenes) as (keyof typeof bloomScenes)[]).map(
            (option) => (
              <OptionButton
                active={scene === option}
                key={option}
                onClick={() => setScene(option)}
              >
                {option}
              </OptionButton>
            )
          )}
        </OptionRow>
        <OptionRow label="surface">
          {(["black", "white"] as const).map((option) => (
            <OptionButton
              active={surface === option}
              key={option}
              onClick={() => setSurface(option)}
            >
              {option}
            </OptionButton>
          ))}
        </OptionRow>
      </ShaderDials>
    </div>
  );
}
