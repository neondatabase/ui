"use client";

import { curveMonotoneX } from "@visx/curve";
import { scaleLinear } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import {
  MinusIcon,
  TriangleAlertIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import type {
  ComponentProps,
  KeyboardEvent,
  PointerEvent,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { NeonLoader } from "@/components/neon-loader/neon-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type MetricFormat =
  | "number"
  | "bytes"
  | "percent"
  | "currency"
  | "duration";

export interface MetricTrendPoint {
  label: string;
  value: number;
}

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");
const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});
const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;
const BYTE_STEP = 1024;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

const formatBytes = (bytes: number) => {
  if (bytes === 0) {
    return "0 B";
  }

  const exponent = Math.min(
    Math.floor(Math.log(Math.abs(bytes)) / Math.log(BYTE_STEP)),
    BYTE_UNITS.length - 1
  );
  const value = bytes / BYTE_STEP ** exponent;

  return `${value.toFixed(value >= 100 || exponent === 0 ? 0 : 1)} ${BYTE_UNITS[exponent]}`;
};

const formatDuration = (seconds: number) => {
  if (seconds < SECONDS_PER_MINUTE) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < SECONDS_PER_HOUR) {
    return `${Math.floor(seconds / SECONDS_PER_MINUTE)}m ${Math.round(seconds % SECONDS_PER_MINUTE)}s`;
  }

  return `${Math.floor(seconds / SECONDS_PER_HOUR)}h ${Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)}m`;
};

const formatValue = (value: number | string, format: MetricFormat) => {
  if (typeof value === "string") {
    return value;
  }

  switch (format) {
    case "bytes": {
      return formatBytes(value);
    }
    case "percent": {
      return `${NUMBER_FORMAT.format(value)}%`;
    }
    case "currency": {
      return CURRENCY_FORMAT.format(value);
    }
    case "duration": {
      return formatDuration(value);
    }
    default: {
      return NUMBER_FORMAT.format(value);
    }
  }
};

const deltaDirection = (delta: number | undefined): "up" | "down" | "flat" => {
  if (delta === undefined || delta === 0) {
    return "flat";
  }

  return delta > 0 ? "up" : "down";
};

const DeltaBadge = ({ delta }: { delta: number }) => {
  const direction = deltaDirection(delta);

  return (
    <Badge
      className={cn(
        "h-5 border-0 px-1.5 py-0 text-[11px] tabular-nums shadow-none",
        direction === "up" && "bg-primary/10 text-primary",
        direction === "down" && "bg-destructive/10 text-destructive",
        direction === "flat" && "bg-muted text-muted-foreground"
      )}
      variant="secondary"
    >
      {direction === "up" ? <TrendingUpIcon /> : null}
      {direction === "down" ? <TrendingDownIcon /> : null}
      {direction === "flat" ? <MinusIcon /> : null}
      {direction === "up" ? "+" : ""}
      {NUMBER_FORMAT.format(Math.abs(delta))}%
    </Badge>
  );
};

const CHART_HEIGHT = 56;
const CHART_WIDTH = 240;
const CHART_PADDING = 3;

interface TrendPoint extends MetricTrendPoint {
  index: number;
}

const normalizeTrend = (trend: (number | MetricTrendPoint)[]): TrendPoint[] =>
  trend.map((point, index) => ({
    index,
    label: typeof point === "number" ? `Point ${index + 1}` : point.label,
    value: typeof point === "number" ? point : point.value,
  }));

const keyboardTrendIndex = (
  key: string,
  current: number,
  last: number
): number | null => {
  if (key === "ArrowLeft") {
    return Math.max(0, current - 1);
  }
  if (key === "ArrowRight") {
    return Math.min(last, current + 1);
  }
  if (key === "Home") {
    return 0;
  }
  if (key === "End") {
    return last;
  }

  return null;
};

const TrendChart = ({
  direction,
  format,
  label,
  trend,
  unit,
}: {
  direction: "up" | "down" | "flat";
  format: MetricFormat;
  label: string;
  trend: (number | MetricTrendPoint)[];
  unit?: ReactNode;
}) => {
  const chartId = useId().replaceAll(":", "");
  const gradientId = `metric-trend-gradient-${chartId}`;
  const noiseId = `metric-trend-noise-${chartId}`;
  const stripeId = `metric-trend-stripes-${chartId}`;
  const chartRef = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const data = normalizeTrend(trend);
  const values = data.map((point) => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const domainPadding = (maximum - minimum || 1) * 0.12;
  const color = direction === "down" ? "var(--destructive)" : "var(--primary)";
  const xScale = scaleLinear<number>({
    domain: [0, Math.max(data.length - 1, 1)],
    range: [CHART_PADDING, CHART_WIDTH - CHART_PADDING],
  });
  const yScale = scaleLinear<number>({
    domain: [minimum - domainPadding, maximum + domainPadding],
    range: [CHART_HEIGHT - CHART_PADDING, CHART_PADDING],
  });
  const activePoint = activeIndex === null ? null : data[activeIndex];
  const anchorPoint = activePoint ??
    data.at(-1) ?? { index: 0, label: "", value: 0 };
  const firstLabel = data[0]?.label ?? "";
  const middleLabel = data[Math.round((data.length - 1) / 2)]?.label ?? "";
  const lastLabel = data.at(-1)?.label ?? "";
  const unitText = typeof unit === "string" ? ` ${unit}` : "";

  const selectPoint = (index: number, bounds?: DOMRect) => {
    const point = data[index];
    const chartBounds = bounds ?? chartRef.current?.getBoundingClientRect();

    if (!(point && chartBounds)) {
      return;
    }

    setActiveIndex(index);
    setTooltipPosition({
      left:
        chartBounds.left +
        (xScale(point.index) / CHART_WIDTH) * chartBounds.width,
      top:
        chartBounds.top +
        (yScale(point.value) / CHART_HEIGHT) * chartBounds.height,
    });
  };

  const clearActivePoint = () => {
    setActiveIndex(null);
    setTooltipPosition(null);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - bounds.left) / bounds.width)
    );
    selectPoint(Math.round(ratio * (data.length - 1)), bounds);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const nextIndex = keyboardTrendIndex(
      event.key,
      activeIndex ?? data.length - 1,
      data.length - 1
    );

    if (nextIndex !== null) {
      event.preventDefault();
      selectPoint(nextIndex);
    }
  };

  return (
    <div className="relative">
      {typeof document !== "undefined" && tooltipPosition
        ? createPortal(
            <div
              className="pointer-events-none fixed z-50 inline-flex w-max items-center gap-1.5 rounded-md border border-border/70 bg-popover px-3 py-1.5 text-xs text-popover-foreground tabular-nums"
              role="tooltip"
              style={{
                left: tooltipPosition.left,
                top: tooltipPosition.top,
                transform: "translate(-50%, calc(-100% - 8px))",
              }}
            >
              <span className="opacity-70">{anchorPoint.label}</span>
              <span className="font-medium">
                {formatValue(anchorPoint.value, format)}
                {unitText}
              </span>
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 rounded-[2px] bg-popover"
              />
            </div>,
            document.body
          )
        : null}

      <button
        aria-label={`${label} trend from ${firstLabel} to ${lastLabel}. Use left and right arrow keys to inspect data points.`}
        className="block w-full touch-none text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        onBlur={clearActivePoint}
        onFocus={() => selectPoint(data.length - 1)}
        onKeyDown={handleKeyDown}
        onPointerLeave={clearActivePoint}
        onPointerMove={handlePointerMove}
        ref={chartRef}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="block h-14 w-full overflow-visible"
          preserveAspectRatio="none"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <pattern
              height={CHART_HEIGHT}
              id={stripeId}
              patternUnits="userSpaceOnUse"
              width="8"
            >
              <line
                stroke={color}
                strokeOpacity={0.16}
                strokeWidth={0.75}
                vectorEffect="non-scaling-stroke"
                x1="0.5"
                x2="0.5"
                y1="0"
                y2={CHART_HEIGHT}
              />
            </pattern>
            <filter
              colorInterpolationFilters="sRGB"
              height="100%"
              id={noiseId}
              width="100%"
              x="0"
              y="0"
            >
              <feTurbulence
                baseFrequency="0.7"
                numOctaves="2"
                seed="7"
                type="fractalNoise"
              />
            </filter>
          </defs>
          <rect
            fill="white"
            filter={`url(#${noiseId})`}
            height={CHART_HEIGHT}
            opacity={0.055}
            pointerEvents="none"
            width={CHART_WIDTH}
          />
          <AreaClosed<TrendPoint>
            curve={curveMonotoneX}
            data={data}
            fill={`url(#${gradientId})`}
            pointerEvents="none"
            x={(point) => xScale(point.index)}
            y={(point) => yScale(point.value)}
            y0={CHART_HEIGHT}
            yScale={yScale}
          />
          <AreaClosed<TrendPoint>
            curve={curveMonotoneX}
            data={data}
            fill={`url(#${stripeId})`}
            pointerEvents="none"
            x={(point) => xScale(point.index)}
            y={(point) => yScale(point.value)}
            y0={CHART_HEIGHT}
            yScale={yScale}
          />
          <LinePath<TrendPoint>
            curve={curveMonotoneX}
            data={data}
            fill="none"
            pointerEvents="none"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            x={(point) => xScale(point.index)}
            y={(point) => yScale(point.value)}
          />
          {activePoint ? (
            <g pointerEvents="none">
              <line
                stroke="var(--border)"
                strokeDasharray="2 3"
                x1={xScale(activePoint.index)}
                x2={xScale(activePoint.index)}
                y1={CHART_PADDING}
                y2={CHART_HEIGHT}
              />
              <circle
                cx={xScale(activePoint.index)}
                cy={yScale(activePoint.value)}
                fill="var(--card)"
                r={3}
                stroke={color}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ) : null}
        </svg>
      </button>

      <div
        aria-hidden="true"
        className="mt-1 grid grid-cols-3 px-[3px] text-[9px] text-muted-foreground/70 leading-none tabular-nums"
      >
        <span>{firstLabel}</span>
        <span className="text-center">{middleLabel}</span>
        <span className="text-right">{lastLabel}</span>
      </div>

      <span aria-live="polite" className="sr-only">
        {activePoint
          ? `${activePoint.label}: ${formatValue(activePoint.value, format)}${unitText}`
          : ""}
      </span>
    </div>
  );
};

export type MetricCardProps = Omit<ComponentProps<typeof Card>, "children"> & {
  label: string;
  value: number | string;
  /** Signed percentage change versus the previous period. */
  delta?: number;
  /** Human-readable context for the delta (for example, "vs yesterday"). */
  comparisonLabel?: string;
  /** Series driving the trend chart; needs at least two points to render. */
  trend?: (number | MetricTrendPoint)[];
  format?: MetricFormat;
  /** Unit suffix rendered after the value (for example, "hrs"). */
  unit?: ReactNode;
  isLoading?: boolean;
  error?: Error | string | null;
};

const metricCardClassName =
  "min-h-[168px] gap-0 overflow-hidden rounded-lg border border-border/60 bg-card py-0 shadow-none ring-0 transition-colors hover:border-border";

export const MetricCard = ({
  label,
  value,
  delta,
  comparisonLabel,
  trend,
  format = "number",
  unit,
  isLoading = false,
  error = null,
  className,
  ...props
}: MetricCardProps) => {
  if (isLoading) {
    return (
      <Card
        aria-busy="true"
        aria-label={`Loading ${label}`}
        className={cn(metricCardClassName, className)}
        {...props}
      >
        <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pt-4">
          <CardTitle className="truncate font-mono font-medium text-muted-foreground text-xs">
            {label}
          </CardTitle>
          <NeonLoader
            className="shrink-0"
            label="Loading metric data"
            size={16}
          />
        </CardHeader>
        <CardContent className="mt-auto px-4 pt-3 pb-3">
          <Skeleton aria-hidden="true" className="h-8 w-24" />
          <Skeleton
            aria-hidden="true"
            className="mt-3 h-[72px] w-full bg-muted/60"
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const message = typeof error === "string" ? error : error.message;

    return (
      <Card
        className={cn(metricCardClassName, className)}
        role="alert"
        {...props}
      >
        <CardHeader className="px-4 pt-4">
          <CardTitle className="truncate font-mono font-medium text-muted-foreground text-xs">
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-auto px-4 pt-3 pb-3">
          <div className="border border-destructive/20 bg-destructive/[0.045] p-3">
            <div className="flex items-center gap-2 text-destructive">
              <TriangleAlertIcon aria-hidden="true" className="size-3.5" />
              <p className="font-medium text-xs">Data unavailable</p>
            </div>
            <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
              {message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const direction = deltaDirection(delta);

  return (
    <Card className={cn(metricCardClassName, className)} {...props}>
      <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-4 pt-4">
        <CardTitle className="truncate font-mono font-medium text-muted-foreground text-xs">
          {label}
        </CardTitle>
        {delta === undefined ? null : (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <DeltaBadge delta={delta} />
            {comparisonLabel ? (
              <span className="whitespace-nowrap text-[10px] text-muted-foreground leading-none">
                {comparisonLabel}
              </span>
            ) : null}
          </div>
        )}
      </CardHeader>

      <CardContent className="mt-auto px-4 pt-3 pb-3">
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold text-3xl tracking-tight tabular-nums">
            {formatValue(value, format)}
          </span>
          {unit ? (
            <span className="text-muted-foreground text-sm">{unit}</span>
          ) : null}
        </div>

        {trend === undefined ? null : (
          <div
            className={cn(
              "relative -mx-1 mt-3 overflow-hidden bg-gradient-to-b to-transparent px-1 pt-1",
              trend.length <= 1 && "from-muted/20",
              trend.length > 1 && direction === "up" && "from-primary/[0.045]",
              trend.length > 1 &&
                direction === "down" &&
                "from-destructive/[0.07]",
              trend.length > 1 && direction === "flat" && "from-muted/20"
            )}
          >
            {trend.length > 1 ? (
              <TrendChart
                direction={direction}
                format={format}
                label={label}
                trend={trend}
                unit={unit}
              />
            ) : (
              <div className="flex h-[72px] items-center justify-center gap-2 text-muted-foreground">
                <MinusIcon aria-hidden="true" className="size-3.5" />
                <span className="text-[11px]">No trend data</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
