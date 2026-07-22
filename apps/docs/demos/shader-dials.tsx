"use client";

/*
 * The shared control panel for shader playgrounds, shaped after
 * DialKit: an ordered config of dials, a `useDials` hook holding the
 * values, and a panel with a reset action. Option rows (palettes,
 * scenes, tints) ride along as children and hook into the same reset
 * via `onReset` / `dirty`.
 *
 * ─────────────────────────────────────────────────────────
 * DIALS STORYBOARD
 *
 *  drag     the thumb grows under the pointer and the row's
 *           readout sharpens to foreground; the number ticks
 *           live as the value changes
 *  release  thumb and readout settle back (150ms)
 *  reset    press the reload icon: every dial glides back to
 *           its default (350ms ease-out) — the shader glides
 *           home with them — while the icon backspins one
 *           turn; snaps instantly under reduced motion
 * ───────────────────────────────────────────────────────── */

import { Tooltip } from "@base-ui/react/tooltip";
import { ArrowReloadHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

const TIMING = {
  /** The reload icon's backspin. */
  resetSpin: 500,
  /** Dials glide back to their defaults. */
  resetTween: 350,
  /** Hover/drag states settle back (mirrored in the CSS classes). */
  settle: 150,
};

/** Ease-out cubic — decelerating into the default, like a snap-back. */
const easeOut = (t: number) => 1 - (1 - t) ** 3;

export interface DialSpec {
  /** The prop name on the shader component; also the row label. */
  key: string;
  /** Row label override when the key reads poorly. */
  label?: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
}

/** An ordered list — dials render top to bottom exactly as written. */
export type DialConfig = readonly DialSpec[];

export const useDials = (config: DialConfig) => {
  const defaults = Object.fromEntries(
    config.map((spec) => [spec.key, spec.defaultValue])
  );

  const [values, setValues] = useState(defaults);
  const valuesRef = useRef(defaults);
  const tweenRef = useRef(0);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  // Leave no animation frame behind on unmount.
  useEffect(() => () => cancelAnimationFrame(tweenRef.current), []);

  const set = (key: string, value: number) => {
    cancelAnimationFrame(tweenRef.current);
    setValues((current) => ({ ...current, [key]: value }));
  };

  /** Glide every dial back to its default; snap under reduced motion. */
  const reset = () => {
    cancelAnimationFrame(tweenRef.current);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValues(defaults);
      return;
    }

    const from = { ...valuesRef.current };
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / TIMING.resetTween);
      const eased = easeOut(t);

      setValues(
        Object.fromEntries(
          config.map((spec) => {
            const origin = from[spec.key] ?? spec.defaultValue;
            const target = spec.defaultValue;
            return [
              spec.key,
              t === 1 ? target : origin + (target - origin) * eased,
            ];
          })
        )
      );

      if (t < 1) {
        tweenRef.current = requestAnimationFrame(tick);
      }
    };

    tweenRef.current = requestAnimationFrame(tick);
  };

  const dirty = config.some((spec) => values[spec.key] !== spec.defaultValue);

  return { dirty, reset, set, values };
};

/** One row of small bordered choices (palettes, scenes, tints). */
export const OptionRow = ({
  children,
  label,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="mt-1 flex flex-wrap items-center gap-1.5">
    <span className="w-20 shrink-0 font-mono text-muted-foreground text-xs">
      {label}
    </span>
    {children}
  </div>
);

export const OptionButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) => (
  <button
    className={`rounded-sm border px-2 py-1 font-mono text-xs transition-colors ${
      active
        ? "border-primary/50 text-foreground"
        : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
    }`}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
);

/* The slider row: a hairline track with a primary fill, a square
   house thumb that grows under the pointer, and a readout that
   sharpens while dragging. All state speaks through CSS :has. */
const THUMB = [
  "[&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-[3px]",
  "[&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary",
  "[&::-webkit-slider-thumb]:bg-background",
  "[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150",
  "[&::-webkit-slider-thumb]:motion-reduce:transition-none",
  "[&:hover::-webkit-slider-thumb]:scale-110 [&:active::-webkit-slider-thumb]:scale-125",
  "[&:active::-webkit-slider-thumb]:bg-primary",
  "[&:focus-visible::-webkit-slider-thumb]:outline-2 [&:focus-visible::-webkit-slider-thumb]:outline-ring/60",
  "[&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-[3px]",
  "[&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background",
  "[&::-moz-range-progress]:bg-primary/60 [&::-moz-range-progress]:h-px",
].join(" ");

const Dial = ({
  label,
  onChange,
  spec,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  spec: DialSpec;
  value: number;
}) => {
  const fill = ((value - spec.min) / (spec.max - spec.min)) * 100;

  return (
    <label className="group/dial flex select-none items-center gap-3 font-mono text-muted-foreground text-xs">
      <span className="w-20 shrink-0 whitespace-nowrap transition-colors duration-150 group-hover/dial:text-foreground/80 group-has-[input:active]/dial:text-foreground">
        {label}
      </span>
      <input
        className={`h-px min-w-0 flex-1 cursor-ew-resize appearance-none outline-none ${THUMB}`}
        max={spec.max}
        min={spec.min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={spec.step}
        style={{
          background: `linear-gradient(to right, var(--primary) ${fill}%, var(--border) ${fill}%)`,
        }}
        type="range"
        value={value}
      />
      <span className="w-10 shrink-0 text-right tabular-nums transition-colors duration-150 group-has-[input:active]/dial:text-foreground">
        {spec.step >= 1 ? Math.round(value).toFixed(0) : value.toFixed(2)}
      </span>
    </label>
  );
};

export const ShaderDials = ({
  children,
  config,
  dirty,
  onChange,
  onReset,
  values,
}: {
  config: DialConfig;
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  /** Restores every dial and option row to its default. */
  onReset: () => void;
  /** Anything off its default — gates the reset action. */
  dirty: boolean;
  /** Extra rows: palettes, scenes, tints, gradient editors. */
  children?: ReactNode;
}) => {
  const [spins, setSpins] = useState(0);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="select-none font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
          dials
        </span>
        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <button
                aria-disabled={!dirty}
                aria-label="Reset dials"
                className={`-m-1.5 p-1.5 transition-colors duration-150 ${
                  dirty
                    ? "text-muted-foreground hover:text-foreground"
                    : "cursor-default text-muted-foreground/30"
                }`}
                onClick={() => {
                  if (!dirty) {
                    return;
                  }

                  setSpins((count) => count + 1);
                  onReset();
                }}
                type="button"
              >
                <HugeiconsIcon
                  aria-hidden
                  className="size-3.5 transition-transform ease-out motion-reduce:transition-none"
                  icon={ArrowReloadHorizontalIcon}
                  strokeWidth={2}
                  style={{
                    rotate: `${spins * -360}deg`,
                    transitionDuration: `${TIMING.resetSpin}ms`,
                  }}
                />
              </button>
            }
          />
          <Tooltip.Portal>
            <Tooltip.Positioner side="left" sideOffset={6}>
              <Tooltip.Popup className="fade-in-0 z-50 animate-in rounded-md border border-border/60 bg-card px-2 py-1 font-mono text-muted-foreground text-xs duration-150 motion-reduce:animate-none">
                reset dials
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
      {config.map((spec) => (
        <Dial
          key={spec.key}
          label={spec.label ?? spec.key}
          onChange={(value) => onChange(spec.key, value)}
          spec={spec}
          value={values[spec.key] ?? spec.defaultValue}
        />
      ))}
      {children}
    </div>
  );
};
