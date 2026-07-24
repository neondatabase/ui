"use client";

import { curveMonotoneX } from "@visx/curve";
import { scaleLinear } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { useId, useRef, useState } from "react";
import type { ComponentProps, KeyboardEvent, PointerEvent } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface AutoscalePoint {
  /** Short time label, e.g. "12:00". */
  label: string;
  /** Compute units in use at this moment. */
  cu: number;
}

interface Plotted extends AutoscalePoint {
  index: number;
}

const CHART_W = 600;
const CHART_H = 150;
const PAD_X = 10;
const PAD_TOP = 14;
const PAD_BOTTOM = 10;

const formatCu = (cu: number) => {
  const rounded = Math.round(cu * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
};

/** Where a reading sits against its bounds: at the ceiling, at the floor, or scaling between. */
const zoneOf = (cu: number, min: number, max: number) => {
  if (cu >= max) {
    return "ceiling" as const;
  }
  if (cu <= min) {
    return "floor" as const;
  }
  return "scaling" as const;
};

const ZONE_COLOR: Record<ReturnType<typeof zoneOf>, string> = {
  ceiling: "var(--status-scaling)",
  floor: "var(--status-sleeping)",
  scaling: "var(--status-active)",
};

const BoundLabel = ({
  kind,
  cu,
  top,
}: {
  kind: string;
  cu: number;
  top: number;
}) => (
  <div
    className="-translate-y-1/2 absolute right-2 flex items-center gap-1 font-mono text-[10px] text-muted-foreground/80 tabular-nums"
    style={{ top: `${top}%` }}
  >
    <span className="text-muted-foreground/50">{kind}</span>
    <span>{formatCu(cu)} CU</span>
  </div>
);

export type AutoscaleChartProps = Omit<ComponentProps<"div">, "children"> & {
  /** Compute-unit readings over time, oldest first. */
  data: AutoscalePoint[];
  /** Autoscale lower bound (CU); the compute never scales below it. */
  min: number;
  /** Autoscale upper bound (CU); the compute never scales above it. */
  max: number;
  /** Panel heading. */
  title?: string;
  isLoading?: boolean;
};

export const AutoscaleChart = ({
  data,
  min,
  max,
  title = "Autoscaling",
  isLoading = false,
  className,
  ...props
}: AutoscaleChartProps) => {
  const chartId = useId().replaceAll(":", "");
  const gradientId = `autoscale-fill-${chartId}`;
  const chartRef = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border/60 bg-card p-4",
          className
        )}
        data-slot="autoscale-chart"
        {...props}
      >
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-[150px] w-full" />
      </div>
    );
  }

  const points: Plotted[] = data.map((point, index) => ({ ...point, index }));
  const values = points.map((point) => point.cu);
  const ceiling = Math.max(max, ...values);
  const headroom = ceiling * 1.08 || 1;

  const xScale = scaleLinear<number>({
    domain: [0, Math.max(points.length - 1, 1)],
    range: [PAD_X, CHART_W - PAD_X],
  });
  const yScale = scaleLinear<number>({
    domain: [0, headroom],
    range: [CHART_H - PAD_BOTTOM, PAD_TOP],
  });

  const yPct = (cu: number) => (yScale(cu) / CHART_H) * 100;
  const current = points.at(-1)?.cu ?? 0;
  const active = activeIndex === null ? null : points[activeIndex];
  const readout = active ?? points.at(-1) ?? { cu: 0, index: 0, label: "" };

  const selectFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - bounds.left) / bounds.width)
    );
    setActiveIndex(Math.round(ratio * (points.length - 1)));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = points.length - 1;
    const from = activeIndex ?? last;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveIndex(Math.max(0, from - 1));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveIndex(Math.min(last, from + 1));
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card p-4",
        className
      )}
      data-slot="autoscale-chart"
      {...props}
    >
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <span className="font-mono text-muted-foreground text-xs">{title}</span>
        <span className="flex items-baseline gap-1.5 font-mono tabular-nums">
          <span className="font-medium text-foreground text-sm">
            {formatCu(current)}
          </span>
          <span className="text-muted-foreground text-xs">CU</span>
          <span className="text-muted-foreground/50 text-[10px]">
            / {formatCu(min)}–{formatCu(max)}
          </span>
        </span>
      </header>

      <div className="relative">
        <BoundLabel cu={max} kind="max" top={yPct(max)} />
        <BoundLabel cu={min} kind="min" top={yPct(min)} />

        <button
          aria-label={`${title}: ${formatCu(current)} compute units, autoscaling between ${formatCu(min)} and ${formatCu(max)}. Use arrow keys to inspect.`}
          className="block w-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onBlur={() => setActiveIndex(null)}
          onFocus={() => setActiveIndex(points.length - 1)}
          onKeyDown={handleKeyDown}
          onPointerLeave={() => setActiveIndex(null)}
          onPointerMove={selectFromPointer}
          ref={chartRef}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="block h-40 w-full overflow-visible"
            preserveAspectRatio="none"
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--primary)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor="var(--primary)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            {/* Autoscale envelope: the band the compute may move within. */}
            <rect
              fill="var(--muted-foreground)"
              height={Math.max(yScale(min) - yScale(max), 0)}
              opacity={0.06}
              width={CHART_W - 2 * PAD_X}
              x={PAD_X}
              y={yScale(max)}
            />
            {[max, min].map((bound) => (
              <line
                key={bound}
                stroke="var(--border)"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
                x1={PAD_X}
                x2={CHART_W - PAD_X}
                y1={yScale(bound)}
                y2={yScale(bound)}
              />
            ))}

            <AreaClosed<Plotted>
              curve={curveMonotoneX}
              data={points}
              fill={`url(#${gradientId})`}
              pointerEvents="none"
              x={(point) => xScale(point.index)}
              y={(point) => yScale(point.cu)}
              y0={CHART_H}
              yScale={yScale}
            />
            <LinePath<Plotted>
              curve={curveMonotoneX}
              data={points}
              fill="none"
              pointerEvents="none"
              stroke="var(--primary)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              vectorEffect="non-scaling-stroke"
              x={(point) => xScale(point.index)}
              y={(point) => yScale(point.cu)}
            />

            {active ? (
              <g pointerEvents="none">
                <line
                  stroke="var(--border)"
                  strokeDasharray="2 3"
                  vectorEffect="non-scaling-stroke"
                  x1={xScale(active.index)}
                  x2={xScale(active.index)}
                  y1={PAD_TOP}
                  y2={CHART_H - PAD_BOTTOM}
                />
                <circle
                  cx={xScale(active.index)}
                  cy={yScale(active.cu)}
                  fill="var(--card)"
                  r={3.5}
                  stroke={ZONE_COLOR[zoneOf(active.cu, min, max)]}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ) : null}
          </svg>
        </button>

        {active ? (
          <div
            className="-translate-x-1/2 -translate-y-full pointer-events-none absolute z-10 mt-[-8px] inline-flex w-max items-center gap-1.5 rounded-md border border-border/70 bg-popover px-2.5 py-1 font-mono text-popover-foreground text-xs tabular-nums"
            style={{
              left: `${(xScale(readout.index) / CHART_W) * 100}%`,
              top: `${yPct(readout.cu)}%`,
            }}
          >
            <span className="text-muted-foreground">{readout.label}</span>
            <span className="font-medium">{formatCu(readout.cu)} CU</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
