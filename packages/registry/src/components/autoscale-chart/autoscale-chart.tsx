"use client";

import { useId } from "react";
import type { ComponentProps } from "react";
import {
  Area,
  AreaChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface AutoscalePoint {
  /** Short time label, e.g. "12:00". */
  label: string;
  /** Compute units in use at this moment. */
  cu: number;
}

const HEADROOM = 1.08;
const NICE_STEPS = [1, 2, 2.5, 5, 10] as const;

/**
 * Rounds the top of the scale to a readable number. Left at peak x 1.08
 * the axis reads 4.32, which is a number nobody asked for.
 */
const niceCeiling = (peak: number) => {
  const raw = peak * HEADROOM;

  if (raw <= 0) {
    return 1;
  }

  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const step = NICE_STEPS.find((candidate) => normalized <= candidate) ?? 10;

  return step * magnitude;
};

const formatCu = (cu: number) => {
  const rounded = Math.round(cu * 100) / 100;

  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
};

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

/* ─────────────────────────────────────────────────────────
 * AUTOSCALE STORYBOARD
 *
 *  envelope  the band between min and max is drawn first,
 *            so the reading is always seen against the
 *            room it has to move in
 *  bounds    dashed lines with mono labels at both edges;
 *            a ceiling you can't see is a ceiling you'll
 *            hit without knowing
 *  scrub     Recharts' accessibility layer gives the plot
 *            focus and arrow keys; the tooltip names the
 *            moment and its CU
 * ───────────────────────────────────────────────────────── */

const cuTooltipFormatter = (
  value: unknown,
  _name: unknown,
  entry: { color?: string }
) => (
  <>
    <span
      aria-hidden="true"
      className="size-2.5 shrink-0 translate-y-[1px] rounded-[2px]"
      style={{ background: String(entry?.color ?? "var(--primary)") }}
    />
    <div className="flex flex-1 items-center justify-between gap-3 leading-none">
      <span className="text-muted-foreground">Compute</span>
      <span className="font-medium font-mono text-foreground tabular-nums">
        {formatCu(Number(value))}
        <span className="ml-1 font-normal text-muted-foreground/70">CU</span>
      </span>
    </div>
  </>
);

export const AutoscaleChart = ({
  className,
  data,
  isLoading = false,
  max,
  min,
  title = "Autoscaling",
  ...props
}: AutoscaleChartProps) => {
  const gradientId = `autoscale-fill-${useId().replaceAll(":", "")}`;

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

  const current = data.at(-1)?.cu ?? 0;
  const ceiling = niceCeiling(Math.max(max, ...data.map((point) => point.cu)));

  const config: ChartConfig = {
    cu: { color: "var(--primary)", label: "Compute units" },
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

      <ChartContainer className="aspect-auto h-[170px] w-full" config={config}>
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{ left: 4, right: 76, top: 4 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* The band the compute may move within. */}
          <ReferenceArea
            fill="var(--muted-foreground)"
            fillOpacity={0.06}
            ifOverflow="extendDomain"
            y1={min}
            y2={max}
          />
          <ReferenceLine
            label={{
              className: "fill-muted-foreground/80 font-mono text-[10px]",
              position: "right",
              value: `max ${formatCu(max)} CU`,
            }}
            stroke="var(--border)"
            strokeDasharray="3 3"
            y={max}
          />
          <ReferenceLine
            label={{
              className: "fill-muted-foreground/80 font-mono text-[10px]",
              position: "right",
              value: `min ${formatCu(min)} CU`,
            }}
            stroke="var(--border)"
            strokeDasharray="3 3"
            y={min}
          />

          <XAxis
            axisLine={false}
            dataKey="label"
            interval="preserveStartEnd"
            minTickGap={24}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            axisLine={false}
            domain={[0, ceiling]}
            tickFormatter={formatCu}
            tickLine={false}
            width={36}
          />
          <ChartTooltip
            content={<ChartTooltipContent formatter={cuTooltipFormatter} />}
            cursor={{ stroke: "var(--border)", strokeDasharray: "2 3" }}
          />

          <Area
            dataKey="cu"
            fill={`url(#${gradientId})`}
            stroke="var(--primary)"
            strokeWidth={1.75}
            type="monotone"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};
