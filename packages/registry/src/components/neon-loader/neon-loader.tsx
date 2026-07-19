"use client";

import { useEffect, useRef } from "react";
import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/utils";

export type NeonLoaderSize = "sm" | "md" | "lg";

export interface LoaderMark {
  /** SVG path data for the mark, in the mark's own coordinate space. */
  path: string;
  /** ViewBox width of the path. */
  width: number;
  /** ViewBox height of the path. */
  height: number;
}

export type NeonLoaderProps = Omit<ComponentProps<"div">, "children"> & {
  /** Accessible status text and, by default, the visible label. */
  label?: string;
  /** Preset or exact pixel size of the Neon mark. */
  size?: NeonLoaderSize | number;
  /** Hide the visible label while retaining it for assistive technology. */
  showLabel?: boolean;
  /** Remove status semantics when the loader is purely decorative. */
  decorative?: boolean;
  /** Duration of one noise-resolve loop in milliseconds. */
  duration?: number;
  /** Swap the Neon mark for your own logo path. */
  mark?: LoaderMark;
};

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD (one loop, canvas-rendered)
 *
 *   0%   pure grain, logo fully hidden
 *  20%   grain starts collapsing into the mark
 *  45%   mark fully resolved, grain gone
 *  78%   mark holds solid
 * 100%   mark dissolved back into grain; loop restarts
 * ───────────────────────────────────────────────────────── */
const LOADER_TIMING = {
  /** One full noise → logo → noise loop. */
  durationMs: 4000,
  /** Mark begins dissolving. */
  holdEnd: 0.78,
  /** Mark fully resolved. */
  holdStart: 0.45,
  /** Grain refresh rate in frames per second. */
  noiseFps: 20,
  /** Grain begins collapsing into the mark. */
  resolveStart: 0.2,
};

const LOADER_SIZE: Record<NeonLoaderSize, number> = {
  lg: 48,
  md: 32,
  sm: 24,
};

/** Official Neon mark, from the published brand SVG (viewBox 0 0 31.3 31.6). */
const NEON_MARK_PATH =
  "M31.3,0v31.6l-12.2-10.6v10.6H0V0h31.3ZM3.8,27.7h11.4v-15.2l12.2,10.8V3.8H3.8s0,23.9,0,23.9Z";

const MARK_WIDTH = 31.3;
const MARK_HEIGHT = 31.6;

/** Default mark: the official Neon logo. */
const NEON_MARK: LoaderMark = {
  height: MARK_HEIGHT,
  path: NEON_MARK_PATH,
  width: MARK_WIDTH,
};

/** Encode any mark as an SVG data URI for use as a CSS mask. */
const markUri = (mark: LoaderMark) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${mark.width} ${mark.height}"><path d="${mark.path}"/></svg>`
  )}`;
/** Mask cells per row: fine enough to read as grain over the crisp mark. */
const GRID = 40;

/** Deterministic pseudo-random noise, stable for a given cell and tick. */
const hashNoise = (cell: number, tick: number) => {
  const raw = Math.sin(cell * 127.1 + tick * 311.7) * 43_758.5453;
  return raw - Math.floor(raw);
};

/** Smoothstep ease-in-out: slow start, fast middle, slow settle. */
const easeInOut = (x: number) => x * x * (3 - 2 * x);

/** 0 → all grain, 1 → fully resolved mark. */
const resolveProgress = (t: number) => {
  const { holdEnd, holdStart, resolveStart } = LOADER_TIMING;

  if (t < resolveStart) {
    return 0;
  }
  if (t < holdStart) {
    return easeInOut((t - resolveStart) / (holdStart - resolveStart));
  }
  if (t < holdEnd) {
    return 1;
  }

  return 1 - easeInOut((t - holdEnd) / (1 - holdEnd));
};

export const NeonLoader = ({
  className,
  decorative = false,
  duration = LOADER_TIMING.durationMs,
  label = "Loading",
  mark = NEON_MARK,
  showLabel = false,
  size = "md",
  ...props
}: NeonLoaderProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolvedSize = typeof size === "number" ? size : LOADER_SIZE[size];

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelSize = resolvedSize * dpr;
    canvas.width = pixelSize;
    canvas.height = pixelSize;

    const cellSize = pixelSize / GRID;
    const scale = pixelSize / Math.max(mark.width, mark.height);
    const markShape = new Path2D(mark.path);

    const styles = getComputedStyle(canvas);
    const primary = styles.color;
    const mono =
      styles.getPropertyValue("--muted-foreground").trim() || "#9ca3af";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const drawResolvedMark = () => {
      context.clearRect(0, 0, pixelSize, pixelSize);
      context.save();
      context.fillStyle = primary;
      context.scale(scale, scale);
      // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- canvas path fill, not Array#fill
      context.fill(markShape, "nonzero");
      context.restore();
    };

    const draw = (now: number) => {
      // Skip canvas work while hidden — keep the loop alive, drop the cost.
      if (!(canvas.checkVisibility?.() ?? true)) {
        frame = requestAnimationFrame(draw);
        return;
      }

      const t = (now % duration) / duration;
      const progress = resolveProgress(t);
      const tick = Math.floor((now / 1000) * LOADER_TIMING.noiseFps);

      context.clearRect(0, 0, pixelSize, pixelSize);

      // 1. Draw the crisp vector mark: monochrome while grainy, easing
      // into the neon primary as it resolves. Never redrawn as blocks.
      context.save();
      context.scale(scale, scale);
      context.fillStyle = mono;
      // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- canvas path fill, not Array#fill
      context.fill(markShape, "nonzero");

      if (progress > 0) {
        context.globalAlpha = progress ** 1.5;
        context.fillStyle = primary;
        // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- canvas path fill, not Array#fill
        context.fill(markShape, "nonzero");
        context.globalAlpha = 1;
      }

      context.restore();

      // 2. Erode it with grain: cells whose noise exceeds the resolve
      // progress are punched out, so low progress = mostly static.
      context.globalCompositeOperation = "destination-out";

      for (let cell = 0; cell < GRID * GRID; cell += 1) {
        const noise = hashNoise(cell, tick);

        if (noise < progress) {
          continue;
        }

        const x = (cell % GRID) * cellSize;
        const y = Math.floor(cell / GRID) * cellSize;

        context.globalAlpha = 0.55 + noise * 0.45;
        context.fillRect(x, y, cellSize + 0.5, cellSize + 0.5);
      }

      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };

    if (reduced.matches) {
      drawResolvedMark();
      return;
    }

    frame = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(frame);
  }, [duration, resolvedSize, mark]);

  return (
    <div
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      aria-live={decorative ? undefined : "polite"}
      className={cn("inline-flex items-center gap-3", className)}
      data-slot="neon-loader"
      role={decorative ? undefined : "status"}
      {...props}
    >
      <canvas
        aria-hidden="true"
        className="shrink-0 text-primary"
        ref={canvasRef}
        style={{ height: resolvedSize, width: resolvedSize }}
      />
      {showLabel ? (
        <span className="font-mono text-[10px] text-muted-foreground">
          {label}
        </span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
};

export type NeonMarkShimmerProps = Omit<ComponentProps<"span">, "children"> & {
  /** Pixel height of the mark; width follows the mark's aspect ratio. */
  size?: number;
  /** Swap the Neon mark for your own logo path. */
  mark?: LoaderMark;
};

/**
 * The Neon mark painted with the shadcn `shimmer` gradient. Mount it next to
 * a `shimmer` text element and both sweep on the same clock; tune both at
 * once with `shimmer-duration-*` / `shimmer-color-*` on a shared parent.
 */
export const NeonMarkShimmer = ({
  className,
  mark = NEON_MARK,
  size = 16,
  style,
  ...props
}: NeonMarkShimmerProps) => (
  <span
    aria-hidden="true"
    className={cn("neon-mark-shimmer shrink-0", className)}
    data-slot="neon-mark-shimmer"
    style={
      {
        "--neon-mark-uri": `url("${markUri(mark)}")`,
        height: size,
        width: (size * mark.width) / mark.height,
        ...style,
      } as CSSProperties
    }
    {...props}
  />
);
