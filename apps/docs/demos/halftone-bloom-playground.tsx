"use client";

import { bloomScenes } from "@neon-ui/registry/components/halftone-bloom/fixtures";
import { HalftoneBloom } from "@neon-ui/registry/components/halftone-bloom/halftone-bloom";
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

export default function HalftoneBloomPlayground() {
  const [speed, setSpeed] = useState(1);
  const [gap, setGap] = useState(12);
  const [holeSize, setHoleSize] = useState(0.22);
  const [intensity, setIntensity] = useState(1);
  const [scene, setScene] = useState<keyof typeof bloomScenes>("heritage");
  const [surface, setSurface] = useState<"black" | "white">("black");

  return (
    <div className="not-prose flex flex-col gap-3">
      <div
        className={`relative isolate h-56 overflow-hidden border border-border/60 ${surface === "black" ? "bg-black" : "bg-white"}`}
      >
        <HalftoneBloom
          className="absolute inset-0"
          gap={gap}
          highlight={bloomScenes[scene].highlight}
          holeSize={holeSize}
          intensity={intensity}
          key={`${speed}-${gap}-${holeSize}-${intensity}-${scene}`}
          lights={bloomScenes[scene].lights}
          speed={speed}
        />
      </div>
      <div className="flex flex-col gap-2 border border-border/60 p-4">
        <Slider
          label="speed"
          max={4}
          min={0}
          onChange={setSpeed}
          step={0.1}
          value={speed}
        />
        <Slider
          label="gap"
          max={28}
          min={6}
          onChange={setGap}
          step={1}
          value={gap}
        />
        <Slider
          label="hole"
          max={0.4}
          min={0}
          onChange={setHoleSize}
          step={0.02}
          value={holeSize}
        />
        <Slider
          label="intensity"
          max={2}
          min={0}
          onChange={setIntensity}
          step={0.05}
          value={intensity}
        />
        <div className="mt-1 flex items-center gap-1.5">
          <span className="w-16 shrink-0 font-mono text-muted-foreground text-xs">
            scene
          </span>
          {(Object.keys(bloomScenes) as (keyof typeof bloomScenes)[]).map(
            (option) => (
              <button
                className={`border px-2 py-1 font-mono text-xs transition-colors ${
                  scene === option
                    ? "border-primary/50 text-foreground"
                    : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
                key={option}
                onClick={() => setScene(option)}
                type="button"
              >
                {option}
              </button>
            )
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-16 shrink-0 font-mono text-muted-foreground text-xs">
            surface
          </span>
          {(["black", "white"] as const).map((option) => (
            <button
              className={`border px-2 py-1 font-mono text-xs transition-colors ${
                surface === option
                  ? "border-primary/50 text-foreground"
                  : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
              key={option}
              onClick={() => setSurface(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
