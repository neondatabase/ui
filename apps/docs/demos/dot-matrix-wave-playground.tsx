"use client";

import { ColorPicker } from "@neon-ui/registry/components/color-picker/color-picker";
import { DotMatrixWave } from "@neon-ui/registry/components/dot-matrix-wave/dot-matrix-wave";
import { waveGradients } from "@neon-ui/registry/components/dot-matrix-wave/fixtures";
import { useState } from "react";

const MAX_STOPS = 6;

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

export default function DotMatrixWavePlayground() {
  const [speed, setSpeed] = useState(1);
  const [gap, setGap] = useState(14);
  const [dotSize, setDotSize] = useState(0.35);
  const [amplitude, setAmplitude] = useState(0.8);
  const [floor, setFloor] = useState(0.08);
  const [stops, setStops] = useState<string[]>(waveGradients.neonFade);

  const setStop = (index: number, color: string) => {
    setStops((current) =>
      current.map((stop, i) => (i === index ? color : stop))
    );
  };

  return (
    <div className="not-prose flex flex-col gap-3">
      <div className="relative isolate h-56 overflow-hidden border border-border/60 bg-black">
        <DotMatrixWave
          amplitude={amplitude}
          className="absolute inset-0"
          colors={stops}
          dotSize={dotSize}
          floor={floor}
          gap={gap}
          key={`${speed}-${gap}-${dotSize}-${amplitude}-${floor}-${stops.join("|")}`}
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
          max={32}
          min={6}
          onChange={setGap}
          step={1}
          value={gap}
        />
        <Slider
          label="dot"
          max={1}
          min={0.1}
          onChange={setDotSize}
          step={0.05}
          value={dotSize}
        />
        <Slider
          label="amplitude"
          max={1}
          min={0}
          onChange={setAmplitude}
          step={0.05}
          value={amplitude}
        />
        <Slider
          label="floor"
          max={0.5}
          min={0}
          onChange={setFloor}
          step={0.01}
          value={floor}
        />
        <div className="mt-1 flex items-center gap-1.5">
          <span className="w-16 shrink-0 font-mono text-muted-foreground text-xs">
            preset
          </span>
          {(Object.keys(waveGradients) as (keyof typeof waveGradients)[]).map(
            (option) => (
              <button
                className={`border px-2 py-1 font-mono text-xs transition-colors ${
                  stops.join("|") === waveGradients[option].join("|")
                    ? "border-primary/50 text-foreground"
                    : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
                key={option}
                onClick={() => setStops(waveGradients[option])}
                type="button"
              >
                {option}
              </button>
            )
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-16 shrink-0 font-mono text-muted-foreground text-xs">
            gradient
          </span>
          {stops.map((stop, index) => (
            <span
              className="flex items-center gap-0.5"
              // oxlint-disable-next-line react/no-array-index-key -- stops are positional
              key={`stop-${index}`}
            >
              <ColorPicker
                className="h-[26px]"
                label={`Gradient stop ${index + 1}`}
                onValueChange={(color) => setStop(index, color)}
                swatches={waveGradients.neonFade}
                value={stop}
              />
              {stops.length > 1 && (
                <button
                  aria-label={`Remove stop ${index + 1}`}
                  className="border border-border/60 px-1.5 py-1 font-mono text-muted-foreground text-xs transition-colors hover:border-border hover:text-foreground"
                  onClick={() =>
                    setStops((current) => current.filter((_, i) => i !== index))
                  }
                  type="button"
                >
                  ×
                </button>
              )}
            </span>
          ))}
          {stops.length < MAX_STOPS && (
            <button
              aria-label="Add gradient stop"
              className="border border-border/60 px-2 py-1 font-mono text-muted-foreground text-xs transition-colors hover:border-border hover:text-foreground"
              onClick={() =>
                setStops((current) => [...current, current.at(-1) ?? "#00e599"])
              }
              type="button"
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
