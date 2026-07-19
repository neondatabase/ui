"use client";

import type { ComponentProps } from "react";
import { useEffect, useRef } from "react";

import { ElasticSlider } from "@/components/ui/elastic-slider";
import { cn } from "@/lib/utils";

export type ThinkingEffort =
  | "off"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

export type ThinkingSelectSize = "sm" | "md" | "lg";

export type ThinkingSelectProps = Omit<
  ComponentProps<"div">,
  "onChange" | "children"
> & {
  /** Controlled effort level. */
  value?: ThinkingEffort;
  /** Uncontrolled initial effort level. */
  defaultValue?: ThinkingEffort;
  onValueChange?: (value: ThinkingEffort) => void;
  disabled?: boolean;
  /** Track size: compact, default, or roomy. */
  size?: ThinkingSelectSize;
};

/* ─────────────────────────────────────────────────────────
 * SPARKLE STORYBOARD (per effort level, looping)
 *
 *  off     fill clean, no sparkle
 *  low     a few pixels twinkle slowly
 *  medium  more frequent twinkles
 *  high    lively, quick sparkle
 *
 *  Each sparkle is one pixel cell fading in and out on its
 *  own sine phase — a glint, not static. The layer rides the
 *  elastic fill: it reads the fill's live width every frame,
 *  so it stretches and springs with drag and snap-back.
 * ───────────────────────────────────────────────────────── */
const EFFORTS: ThinkingEffort[] = [
  "off",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
];

const EFFORT_LABELS: Record<ThinkingEffort, string> = {
  high: "high",
  low: "low",
  max: "max",
  medium: "med",
  off: "off",
  xhigh: "xhigh",
};

const SPARKLE: Record<ThinkingEffort, { density: number; speed: number }> = {
  high: { density: 0.1, speed: 24 },
  low: { density: 0.04, speed: 8 },
  max: { density: 0.2, speed: 48 },
  medium: { density: 0.07, speed: 14 },
  off: { density: 0, speed: 0 },
  xhigh: { density: 0.14, speed: 34 },
};

const GRAIN_CELL = 3;

const SIZE_CLASSES: Record<ThinkingSelectSize, string> = {
  lg: "[--elastic-slider-height:--spacing(11)]",
  md: "",
  sm: "[--elastic-slider-height:--spacing(7)] [&_[data-slot=elastic-slider-label]]:text-xs/none [&_[data-slot=elastic-slider-value]]:text-xs/none",
};

const SIZE_MIN_WIDTH: Record<ThinkingSelectSize, string> = {
  lg: "min-w-52",
  md: "min-w-44",
  sm: "min-w-36",
};

/** Deterministic pseudo-random noise, stable for a given cell and tick. */
const hashNoise = (cell: number, tick: number) => {
  const raw = Math.sin(cell * 127.1 + tick * 311.7) * 43_758.5453;
  return raw - Math.floor(raw);
};

/**
 * Loader-style pixel sparkle confined to the slider's fill. Reads the fill's
 * live width each frame so the glints stretch with the elastic drag and
 * spring with the snap-back.
 */
const GrainFill = ({ effort }: { effort: ThinkingEffort }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effortRef = useRef(effort);

  useEffect(() => {
    effortRef.current = effort;
  }, [effort]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let frame = 0;

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);

      // Skip canvas work while hidden — the loop stays alive for free.
      if (!(canvas.checkVisibility?.() ?? true)) {
        return;
      }

      const host = canvas.parentElement;
      const fill = host?.querySelector<HTMLElement>(
        '[data-slot="elastic-slider-fill"]'
      );

      if (!(host && fill)) {
        return;
      }

      const hostRect = host.getBoundingClientRect();
      const fillRect = fill.getBoundingClientRect();
      const width = Math.round(hostRect.width * dpr);
      const height = Math.round(hostRect.height * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      context.clearRect(0, 0, width, height);

      const { density, speed } = SPARKLE[effortRef.current];

      if (density === 0) {
        return;
      }

      const fillLeft = (fillRect.left - hostRect.left) * dpr;
      const fillWidth = fillRect.width * dpr;
      const cell = GRAIN_CELL * dpr;
      const columns = Math.ceil(fillWidth / cell);
      const rows = Math.ceil(height / cell);
      const seconds = now / 1000;
      const primary = getComputedStyle(canvas).color;

      context.fillStyle = primary;

      for (let index = 0; index < columns * rows; index += 1) {
        // Sparse, stable subset of cells may ever sparkle.
        if (hashNoise(index, 1) > density) {
          continue;
        }

        // Each sparkle breathes on its own sine phase; it spends most
        // of the cycle dark and glints briefly at the crest.
        const phase = hashNoise(index, 2) * Math.PI * 2;
        const twinkle = Math.sin(seconds * (speed / 4) + phase);

        if (twinkle < 0.75) {
          continue;
        }

        const x = fillLeft + (index % columns) * cell;
        const y = Math.floor(index / columns) * cell;

        context.globalAlpha = ((twinkle - 0.75) / 0.25) * 0.45;
        context.fillRect(x, y, cell + 0.5, cell + 0.5);
      }

      context.globalAlpha = 1;
    };

    frame = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full text-primary"
      ref={canvasRef}
    />
  );
};

const effortFromIndex = (index: number): ThinkingEffort =>
  EFFORTS[Math.round(index)] ?? "off";

export const ThinkingSelect = ({
  className,
  defaultValue = "off",
  disabled = false,
  onValueChange,
  size = "md",
  value,
  ...props
}: ThinkingSelectProps) => {
  const current = value ?? defaultValue;

  return (
    <div
      aria-disabled={disabled || undefined}
      className={cn(
        "relative",
        SIZE_MIN_WIDTH[size],
        disabled && "pointer-events-none opacity-50",
        className
      )}
      data-effort={current}
      data-slot="thinking-select"
      {...props}
    >
      <GrainFill effort={current} />
      <ElasticSlider
        aria-label="Thinking effort"
        className={cn(
          "w-full",
          SIZE_CLASSES[size],
          "[--elastic-slider-bg:var(--muted)]",
          "[--elastic-slider-fill:color-mix(in_srgb,var(--primary)_14%,transparent)]",
          "[--elastic-slider-fill-active:color-mix(in_srgb,var(--primary)_24%,transparent)]",
          "[--elastic-slider-focus:var(--primary)]",
          "[--elastic-slider-handle:var(--primary)]",
          "[--elastic-slider-hash:color-mix(in_srgb,var(--primary)_45%,transparent)]",
          "[--elastic-slider-radius:0px]",
          disabled && "pointer-events-none"
        )}
        formatValue={(index) => EFFORT_LABELS[effortFromIndex(index)]}
        label="Thinking"
        max={EFFORTS.length - 1}
        min={0}
        onValueChange={(index) => onValueChange?.(effortFromIndex(index))}
        step={1}
        value={EFFORTS.indexOf(current)}
      />
    </div>
  );
};
