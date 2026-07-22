"use client";

import { meshPalettes } from "@neon-ui/registry/components/mesh-gradient/fixtures";
import { MeshGradient } from "@neon-ui/registry/components/mesh-gradient/mesh-gradient";
import { useState } from "react";

const Slider = ({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) => (
  <label className="flex items-center gap-3 font-mono text-muted-foreground text-xs">
    <span className="w-16 shrink-0">{label}</span>
    <input
      className="h-1 min-w-0 flex-1 cursor-pointer appearance-none bg-border accent-[var(--primary)]"
      max={max}
      min={min}
      onChange={(event) => onChange(Number(event.target.value))}
      step={step}
      type="range"
      value={value}
    />
    <span className="w-10 shrink-0 text-right tabular-nums">
      {value.toFixed(2)}
    </span>
  </label>
);

export default function MeshGradientPlayground() {
  const [speed, setSpeed] = useState(0.6);
  const [warp, setWarp] = useState(0.4);
  const [grain, setGrain] = useState(0.5);
  const [glow, setGlow] = useState(1);
  const [palette, setPalette] = useState<keyof typeof meshPalettes>("brand");

  return (
    <div className="not-prose flex flex-col gap-3">
      <div className="relative isolate aspect-video overflow-hidden border border-border/60 bg-black">
        <MeshGradient
          className="absolute inset-0"
          colors={meshPalettes[palette]}
          glow={glow}
          grain={grain}
          key={`${speed}-${warp}-${grain}-${glow}-${palette}`}
          speed={speed}
          warp={warp}
        />
      </div>
      <div className="flex flex-col gap-2 border border-border/60 p-4">
        <Slider
          label="speed"
          max={3}
          min={0}
          onChange={setSpeed}
          step={0.1}
          value={speed}
        />
        <Slider
          label="warp"
          max={1}
          min={0}
          onChange={setWarp}
          step={0.05}
          value={warp}
        />
        <Slider
          label="grain"
          max={1}
          min={0}
          onChange={setGrain}
          step={0.05}
          value={grain}
        />
        <Slider
          label="glow"
          max={1.5}
          min={0.5}
          onChange={setGlow}
          step={0.05}
          value={glow}
        />
        <div className="mt-1 flex items-center gap-1.5">
          <span className="w-16 shrink-0 font-mono text-muted-foreground text-xs">
            palette
          </span>
          {(Object.keys(meshPalettes) as (keyof typeof meshPalettes)[]).map(
            (option) => (
              <button
                className={`border px-2 py-1 font-mono text-xs transition-colors ${
                  palette === option
                    ? "border-primary/50 text-foreground"
                    : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
                key={option}
                onClick={() => setPalette(option)}
                type="button"
              >
                {option}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
