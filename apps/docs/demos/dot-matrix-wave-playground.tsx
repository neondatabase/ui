"use client";

import { ColorPicker } from "@neon-ui/registry/components/color-picker/color-picker";
import { DotMatrixWave } from "@neon-ui/registry/components/dot-matrix-wave/dot-matrix-wave";
import { waveGradients } from "@neon-ui/registry/components/dot-matrix-wave/fixtures";
import { useState } from "react";

import { OptionButton, OptionRow, ShaderDials, useDials } from "./shader-dials";

const MAX_STOPS = 6;

const DIALS = [
  { defaultValue: 1, key: "speed", max: 4, min: 0, step: 0.1 },
  { defaultValue: 14, key: "gap", max: 32, min: 6, step: 1 },
  {
    defaultValue: 0.35,
    key: "dotSize",
    label: "dot",
    max: 1,
    min: 0.1,
    step: 0.05,
  },
  { defaultValue: 0.8, key: "amplitude", max: 1, min: 0, step: 0.05 },
  { defaultValue: 0.08, key: "floor", max: 0.5, min: 0, step: 0.01 },
] as const;

export default function DotMatrixWavePlayground() {
  const { dirty, reset, set, values } = useDials(DIALS);
  const [stops, setStops] = useState<string[]>(waveGradients.neonFade);

  const setStop = (index: number, color: string) => {
    setStops((current) =>
      current.map((stop, i) => (i === index ? color : stop))
    );
  };

  const stopsDirty = stops.join("|") !== waveGradients.neonFade.join("|");

  return (
    <div className="not-prose flex flex-col gap-3">
      <div className="relative isolate h-56 overflow-hidden rounded-lg border border-border/60 bg-black">
        <DotMatrixWave
          amplitude={values.amplitude}
          className="absolute inset-0"
          colors={stops}
          dotSize={values.dotSize}
          floor={values.floor}
          gap={values.gap}
          speed={values.speed}
        />
      </div>
      <ShaderDials
        config={DIALS}
        dirty={dirty || stopsDirty}
        onChange={set}
        onReset={() => {
          reset();
          setStops(waveGradients.neonFade);
        }}
        values={values}
      >
        <OptionRow label="preset">
          {(Object.keys(waveGradients) as (keyof typeof waveGradients)[]).map(
            (option) => (
              <OptionButton
                active={stops.join("|") === waveGradients[option].join("|")}
                key={option}
                onClick={() => setStops(waveGradients[option])}
              >
                {option}
              </OptionButton>
            )
          )}
        </OptionRow>
        <OptionRow label="gradient">
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
                  className="rounded-sm border border-border/60 px-1.5 py-1 font-mono text-muted-foreground text-xs transition-colors hover:border-border hover:text-foreground"
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
              className="rounded-sm border border-border/60 px-2 py-1 font-mono text-muted-foreground text-xs transition-colors hover:border-border hover:text-foreground"
              onClick={() =>
                setStops((current) => [...current, current.at(-1) ?? "#00e599"])
              }
              type="button"
            >
              +
            </button>
          )}
        </OptionRow>
      </ShaderDials>
    </div>
  );
}
