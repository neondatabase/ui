"use client";

import { AnimatedWash } from "@neon-ui/registry/components/animated-wash/animated-wash";
import { ColorPicker } from "@neon-ui/registry/components/color-picker/color-picker";
import { useState } from "react";

const TINTS: { label: string; tint: string }[] = [
  { label: "primary", tint: "text-primary" },
  { label: "destructive", tint: "text-destructive" },
  { label: "muted", tint: "text-muted-foreground" },
];

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

export default function AnimatedWashPlayground() {
  const [speed, setSpeed] = useState(1);
  const [intensity, setIntensity] = useState(0.2);
  const [noise, setNoise] = useState(0.35);
  const [grainSize, setGrainSize] = useState(3);
  const [tint, setTint] = useState("text-primary");
  const [customColor, setCustomColor] = useState<string | null>(null);

  return (
    <div className="not-prose flex flex-col gap-3">
      <div
        className={`relative isolate h-48 overflow-hidden border border-border/60 bg-card ${customColor ? "" : tint}`}
        data-wash-hover
        style={customColor ? { color: customColor } : undefined}
      >
        <AnimatedWash
          className="absolute inset-0"
          grainSize={grainSize}
          intensity={intensity}
          key={`${speed}-${intensity}-${noise}-${grainSize}-${tint}-${customColor ?? ""}`}
          noise={noise}
          speed={speed}
        />
        <span className="absolute top-3 left-3 font-mono text-[10px] text-muted-foreground">
          hover to lift
        </span>
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
          label="intensity"
          max={1}
          min={0}
          onChange={setIntensity}
          step={0.05}
          value={intensity}
        />
        <Slider
          label="noise"
          max={1}
          min={0}
          onChange={setNoise}
          step={0.05}
          value={noise}
        />
        <Slider
          label="grain"
          max={12}
          min={1}
          onChange={setGrainSize}
          step={1}
          value={grainSize}
        />
        <div className="mt-1 flex items-center gap-1.5">
          <span className="w-16 shrink-0 font-mono text-muted-foreground text-xs">
            tint
          </span>
          {TINTS.map((option) => (
            <button
              className={`border px-2 py-1 font-mono text-xs transition-colors ${
                !customColor && tint === option.tint
                  ? "border-primary/50 text-foreground"
                  : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
              key={option.label}
              onClick={() => {
                setCustomColor(null);
                setTint(option.tint);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
          <ColorPicker
            className="h-[26px]"
            label="Custom wash tint"
            onValueChange={setCustomColor}
            swatches={["#00e599", "#ff4c8b", "#7c9cf5", "#f0f075"]}
            value={customColor ?? "#00e599"}
          />
        </div>
      </div>
    </div>
  );
}
