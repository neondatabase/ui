"use client";

import {
  Alert02Icon,
  MinusSignIcon,
  TradeDownIcon,
  TradeUpIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";

import { NeonLoader } from "@/components/neon-loader/neon-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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
      {direction === "up" ? (
        <HugeiconsIcon icon={TradeUpIcon} strokeWidth={2} />
      ) : null}
      {direction === "down" ? (
        <HugeiconsIcon icon={TradeDownIcon} strokeWidth={2} />
      ) : null}
      {direction === "flat" ? (
        <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} />
      ) : null}
      {direction === "up" ? "+" : ""}
      {NUMBER_FORMAT.format(Math.abs(delta))}%
    </Badge>
  );
};

const CHART_HEIGHT = 56;

interface TrendPoint extends MetricTrendPoint {
  index: number;
}

const normalizeTrend = (trend: (number | MetricTrendPoint)[]): TrendPoint[] =>
  trend.map((point, index) => ({
    index,
    label: typeof point === "number" ? `Point ${index + 1}` : point.label,
    value: typeof point === "number" ? point : point.value,
  }));

/** Row renderer for the sparkline tooltip: the metric's own name and value. */
const trendTooltipFormatter = (
  label: string,
  format: MetricFormat,
  unitText: string
) =>
  function TrendTooltipRow(value: unknown) {
    return (
      <div className="flex flex-1 items-center justify-between gap-3 leading-none">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium font-mono text-foreground tabular-nums">
          {formatValue(Number(value), format)}
          {unitText}
        </span>
      </div>
    );
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
  const stripeId = `metric-trend-stripes-${chartId}`;
  const data = normalizeTrend(trend);
  const values = data.map((point) => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const domainPadding = (maximum - minimum || 1) * 0.12;
  const color = direction === "down" ? "var(--destructive)" : "var(--primary)";
  const unitText = typeof unit === "string" ? ` ${unit}` : "";
  const firstLabel = data[0]?.label ?? "";
  const middleLabel = data[Math.round((data.length - 1) / 2)]?.label ?? "";
  const lastLabel = data.at(-1)?.label ?? "";

  const config: ChartConfig = {
    value: { color, label },
  };

  return (
    <div className="relative">
      <ChartContainer className="aspect-auto h-14 w-full" config={config}>
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{ bottom: 2, left: 0, right: 0, top: 2 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            {/* House texture: a hairline rule every 8px under the fill. */}
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
                x1="0.5"
                x2="0.5"
                y1="0"
                y2={CHART_HEIGHT}
              />
            </pattern>
          </defs>

          <XAxis dataKey="label" hide />
          <YAxis
            domain={[minimum - domainPadding, maximum + domainPadding]}
            hide
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={trendTooltipFormatter(label, format, unitText)}
                hideIndicator
                labelKey="label"
              />
            }
            cursor={{ stroke: "var(--border)", strokeDasharray: "2 3" }}
          />

          <Area
            dataKey="value"
            fill={`url(#${gradientId})`}
            stroke="none"
            type="monotone"
          />
          <Area
            dataKey="value"
            fill={`url(#${stripeId})`}
            stroke={color}
            strokeWidth={1.75}
            type="monotone"
          />
        </AreaChart>
      </ChartContainer>

      <div
        aria-hidden="true"
        className="mt-1 grid grid-cols-3 px-[3px] text-[9px] text-muted-foreground/70 leading-none tabular-nums"
      >
        <span>{firstLabel}</span>
        <span className="text-center">{middleLabel}</span>
        <span className="text-right">{lastLabel}</span>
      </div>
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
          <CardTitle
            className="truncate font-mono font-medium text-muted-foreground text-xs"
            title={label}
          >
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
          <CardTitle
            className="truncate font-mono font-medium text-muted-foreground text-xs"
            title={label}
          >
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-auto px-4 pt-3 pb-3">
          <div className="rounded-md border border-destructive/20 bg-destructive/[0.045] p-3">
            <div className="flex items-center gap-2 text-destructive">
              <HugeiconsIcon
                aria-hidden="true"
                className="size-3.5"
                icon={Alert02Icon}
                strokeWidth={2}
              />
              <p className="font-medium text-xs">Data unavailable</p>
            </div>
            <p className="mt-2 text-pretty text-muted-foreground text-xs leading-relaxed">
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
        <CardTitle
          className="truncate font-mono font-medium text-muted-foreground text-xs"
          title={label}
        >
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
                <HugeiconsIcon
                  aria-hidden="true"
                  className="size-3.5"
                  icon={MinusSignIcon}
                  strokeWidth={2}
                />
                <span className="text-[11px]">No trend data</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
