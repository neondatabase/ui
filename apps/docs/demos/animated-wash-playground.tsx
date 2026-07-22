"use client";

import { AnimatedWash } from "@neon-ui/registry/components/animated-wash/animated-wash";
import { ColorPicker } from "@neon-ui/registry/components/color-picker/color-picker";
import { useState } from "react";

import { OptionButton, OptionRow, ShaderDials, useDials } from "./shader-dials";

const TINTS: { label: string; tint: string }[] = [
  { label: "primary", tint: "text-primary" },
  { label: "destructive", tint: "text-destructive" },
  { label: "muted", tint: "text-muted-foreground" },
];

const DIALS = [
  { defaultValue: 1, key: "speed", max: 4, min: 0, step: 0.1 },
  { defaultValue: 0.2, key: "intensity", max: 1, min: 0, step: 0.05 },
  { defaultValue: 0.35, key: "noise", max: 1, min: 0, step: 0.05 },
  {
    defaultValue: 3,
    key: "grainSize",
    label: "grain",
    max: 12,
    min: 1,
    step: 1,
  },
] as const;

const DEFAULT_TINT = "text-primary";

export default function AnimatedWashPlayground() {
  const { dirty, reset, set, values } = useDials(DIALS);
  const [tint, setTint] = useState(DEFAULT_TINT);
  const [customColor, setCustomColor] = useState<string | null>(null);

  return (
    <div className="not-prose flex flex-col gap-3">
      <div
        className={`relative isolate h-48 overflow-hidden rounded-lg border border-border/60 bg-card ${customColor ? "" : tint}`}
        data-wash-hover
        style={customColor ? { color: customColor } : undefined}
      >
        <AnimatedWash
          className="absolute inset-0"
          grainSize={values.grainSize}
          intensity={values.intensity}
          noise={values.noise}
          speed={values.speed}
        />
        <span className="absolute top-3 left-3 font-mono text-[10px] text-muted-foreground">
          hover to lift
        </span>
      </div>
      <ShaderDials
        config={DIALS}
        dirty={dirty || tint !== DEFAULT_TINT || customColor !== null}
        onChange={set}
        onReset={() => {
          reset();
          setTint(DEFAULT_TINT);
          setCustomColor(null);
        }}
        values={values}
      >
        <OptionRow label="tint">
          {TINTS.map((option) => (
            <OptionButton
              active={!customColor && tint === option.tint}
              key={option.label}
              onClick={() => {
                setCustomColor(null);
                setTint(option.tint);
              }}
            >
              {option.label}
            </OptionButton>
          ))}
          <ColorPicker
            className="h-[26px]"
            label="Custom wash tint"
            onValueChange={setCustomColor}
            swatches={["#00e599", "#ff4c8b", "#7c9cf5", "#f0f075"]}
            value={customColor ?? "#00e599"}
          />
        </OptionRow>
      </ShaderDials>
    </div>
  );
}
