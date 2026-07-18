"use client";

import { auroraPalettes } from "@neon-ui/registry/components/neon-aurora/fixtures";
import { NeonAurora } from "@neon-ui/registry/components/neon-aurora/neon-aurora";
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

export default function NeonAuroraPlayground() {
  const [speed, setSpeed] = useState(0.7);
  const [density, setDensity] = useState(0.2);
  const [intensity, setIntensity] = useState(2);
  const [blur, setBlur] = useState(1);
  const [glare, setGlare] = useState(0.2);
  const [flare, setFlare] = useState(0.75);
  const [thickness, setThickness] = useState(0);
  const [whiteFlare, setWhiteFlare] = useState(0.6);
  const [palette, setPalette] = useState<keyof typeof auroraPalettes>("neon");

  return (
    <div className="not-prose flex flex-col gap-3">
      <div className="relative isolate h-56 overflow-hidden border border-border/60 bg-black">
        <NeonAurora
          blur={blur}
          className="absolute inset-0"
          colors={auroraPalettes[palette]}
          density={density}
          flare={flare}
          glare={glare}
          thickness={thickness}
          whiteFlare={whiteFlare}
          intensity={intensity}
          key={`${speed}-${density}-${intensity}-${blur}-${glare}-${flare}-${thickness}-${whiteFlare}-${palette}`}
          speed={speed}
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
          label="density"
          max={1}
          min={0}
          onChange={setDensity}
          step={0.05}
          value={density}
        />
        <Slider
          label="intensity"
          max={2}
          min={0}
          onChange={setIntensity}
          step={0.1}
          value={intensity}
        />
        <Slider
          label="blur"
          max={1}
          min={0}
          onChange={setBlur}
          step={0.05}
          value={blur}
        />
        <Slider
          label="glare"
          max={1}
          min={0}
          onChange={setGlare}
          step={0.05}
          value={glare}
        />
        <Slider
          label="flare"
          max={1}
          min={0}
          onChange={setFlare}
          step={0.05}
          value={flare}
        />
        <Slider
          label="thickness"
          max={1}
          min={0}
          onChange={setThickness}
          step={0.05}
          value={thickness}
        />
        <Slider
          label="white flare"
          max={1}
          min={0}
          onChange={setWhiteFlare}
          step={0.05}
          value={whiteFlare}
        />
        <div className="mt-1 flex items-center gap-1.5">
          <span className="w-16 shrink-0 font-mono text-muted-foreground text-xs">
            palette
          </span>
          {(Object.keys(auroraPalettes) as (keyof typeof auroraPalettes)[]).map(
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
