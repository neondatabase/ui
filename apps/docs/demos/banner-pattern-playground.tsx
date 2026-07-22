"use client";

import { BannerPattern } from "@neon-ui/registry/components/banner-pattern/banner-pattern";
import { bannerPalettes } from "@neon-ui/registry/components/banner-pattern/fixtures";
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

export default function BannerPatternPlayground() {
  const [speed, setSpeed] = useState(0.5);
  const [cell, setCell] = useState(8);
  const [dotSize, setDotSize] = useState(0.14);
  const [haze, setHaze] = useState(0.5);
  const [jitter, setJitter] = useState(0.35);
  const [palette, setPalette] = useState<keyof typeof bannerPalettes>("brand");

  return (
    <div className="not-prose flex flex-col gap-3">
      <div className="relative isolate aspect-video overflow-hidden border border-border/60 bg-black">
        <BannerPattern
          cell={cell}
          className="absolute inset-0"
          colors={bannerPalettes[palette]}
          dotSize={dotSize}
          haze={haze}
          jitter={jitter}
          key={`${speed}-${cell}-${dotSize}-${haze}-${jitter}-${palette}`}
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
          label="cell"
          max={24}
          min={4}
          onChange={setCell}
          step={1}
          value={cell}
        />
        <Slider
          label="dot size"
          max={0.3}
          min={0.05}
          onChange={setDotSize}
          step={0.01}
          value={dotSize}
        />
        <Slider
          label="haze"
          max={1}
          min={0}
          onChange={setHaze}
          step={0.05}
          value={haze}
        />
        <Slider
          label="jitter"
          max={1}
          min={0}
          onChange={setJitter}
          step={0.05}
          value={jitter}
        />
        <div className="mt-1 flex items-center gap-1.5">
          <span className="w-16 shrink-0 font-mono text-muted-foreground text-xs">
            palette
          </span>
          {(Object.keys(bannerPalettes) as (keyof typeof bannerPalettes)[]).map(
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
