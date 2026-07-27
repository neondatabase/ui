"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
import { useControllableState } from "@/hooks/use-controllable-state";
import { cn } from "@/lib/utils";

export type ConsumptionGranularityOption = "hourly" | "daily" | "monthly";

export interface ConsumptionSeries {
  /** Stable id, e.g. "compute_unit_seconds". Keys into each point's values. */
  id: string;
  /** Legend and tooltip label. */
  label: string;
  /** Any CSS color; defaults to the --chart-n token for its position. */
  color?: string;
  /**
   * Unit of the values, e.g. "CU-hrs" or "GB-mo". Series that don't share
   * a unit are never stacked or summed together — CU-hours plus GB-months
   * is not a quantity.
   */
  unit?: string;
}

export interface ConsumptionPoint {
  /** Axis and tooltip label, e.g. "Feb 4" or "14:00". */
  label: string;
  /** Series id -> value, already converted to the display unit. */
  values: Record<string, number>;
}

export type ConsumptionChartProps = Omit<
  ComponentProps<"section">,
  "children" | "onChange"
> & {
  /** Buckets, oldest first. */
  data: ConsumptionPoint[];
  /** Series to plot, in stacking order (first sits at the bottom). */
  series: ConsumptionSeries[];
  /** "area" reads as a trend, "bar" as discrete buckets. */
  variant?: "area" | "bar";
  /**
   * Stack series into a total. Ignored when the visible series carry more
   * than one unit, where stacking would be arithmetic on unlike things.
   */
  stacked?: boolean;
  /** Controlled visible series. */
  activeSeriesIds?: string[];
  /** Uncontrolled initial visible series; defaults to all of them. */
  defaultActiveSeriesIds?: string[];
  onActiveSeriesIdsChange?: (ids: string[]) => void;
  /** Controlled granularity; pair with `granularities` to show the switch. */
  granularity?: ConsumptionGranularityOption;
  defaultGranularity?: ConsumptionGranularityOption;
  onGranularityChange?: (granularity: ConsumptionGranularityOption) => void;
  /** Granularities to offer. Omit to hide the switch. */
  granularities?: ConsumptionGranularityOption[];
  /** Panel heading. */
  title?: string;
  /** Right-side header slot, e.g. a DateRangePicker. Sits before the switch. */
  action?: ReactNode;
  /** Value formatter for the axis, readout, and legend totals. */
  formatValue?: (value: number) => string;
  /** Quiet footer, e.g. a metering-lag notice. */
  meteredThrough?: string;
  isLoading?: boolean;
  error?: string | null;
  /** Shown when `data` is empty. */
  empty?: ReactNode;
};

/* ─────────────────────────────────────────────────────────
 * CHART STORYBOARD
 *
 *  rest      Recharts draws the plot; both axes are
 *            labelled, so the chart still answers questions
 *            in a screenshot
 *  color     one hue, five steps of lightness, and a
 *            hairline of --card between stacked bands.
 *            Bands separate by value and by that gap, which
 *            survives at any size — texture did not
 *  totals    the header sums per unit, never across them.
 *            CU-hours and GB-months don't add up, and one
 *            number pretending they do is worse than none
 *  stacking  only within a unit. Mixed units fall back to
 *            overlaid series and say so
 *  scrub     Recharts' accessibility layer gives the plot
 *            focus and arrow-key movement; the tooltip
 *            names the bucket and every visible series
 *  toggle    the legend is the filter. The last visible
 *            series won't turn itself off, because an empty
 *            chart answers nothing
 * ───────────────────────────────────────────────────────── */

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/**
 * Bands are tinted, not solid: a stack of fully saturated fills reads as
 * slabs of paint and the card stops looking like a chart. The series
 * color goes on the top edge instead, where it draws the boundary.
 */
const BAND_FILL_BOTTOM = 0.5;
const BAND_FILL_TOP = 0.24;
const OVERLAY_FILL = 0.16;
const BAND_STROKE = 2;

/**
 * Bands fade as they stack. Depth is then encoded twice, by the ramp and
 * by weight, so two neighbouring greens can't collapse into one mass.
 */
const fillAt = (index: number, count: number) => {
  if (count <= 1) {
    return BAND_FILL_BOTTOM;
  }

  const ratio = index / (count - 1);

  return BAND_FILL_BOTTOM - ratio * (BAND_FILL_BOTTOM - BAND_FILL_TOP);
};
const AXIS_TICK_COUNT = 5;
const MAX_X_LABELS = 7;

const COMPACT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  notation: "compact",
});

const defaultFormat = (value: number) => COMPACT.format(value);

const colorOf = (series: ConsumptionSeries, index: number): string =>
  series.color ?? PALETTE[index % PALETTE.length] ?? PALETTE[0];

/** Distinct units across the visible series; "" counts as its own unit. */
const unitsOf = (visible: ConsumptionSeries[]) => [
  ...new Set(visible.map((item) => item.unit ?? "")),
];

/**
 * Sums per unit, never across. A chart of CU-hours and GB-months reads
 * "102.8 CU-hrs · 77.5 GB-mo" rather than one meaningless number.
 */
const totalsByUnit = (
  visible: ConsumptionSeries[],
  totals: Record<string, number>
): [string, number][] => {
  const byUnit = new Map<string, number>();

  for (const item of visible) {
    const unit = item.unit ?? "";

    byUnit.set(unit, (byUnit.get(unit) ?? 0) + (totals[item.id] ?? 0));
  }

  return [...byUnit.entries()];
};

const HeadlineTotals = ({
  formatValue,
  totals,
}: {
  formatValue: (value: number) => string;
  totals: [string, number][];
}) => (
  <>
    {totals.map(([unit, total], index) => (
      <span className="flex items-baseline gap-1" key={unit}>
        {index > 0 ? (
          <span className="text-muted-foreground/40 text-xs">·</span>
        ) : null}
        <span className="font-medium font-mono text-foreground text-sm tabular-nums">
          {formatValue(total)}
        </span>
        {unit ? (
          <span className="font-mono text-[10px] text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </span>
    ))}
  </>
);

const LegendItem = ({
  color,
  formatValue,
  isActive,
  onToggle,
  series,
  total,
}: {
  color: string;
  formatValue: (value: number) => string;
  isActive: boolean;
  onToggle: () => void;
  series: ConsumptionSeries;
  total: number;
}) => (
  <button
    aria-pressed={isActive}
    className={cn(
      "flex items-baseline gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      !isActive && "opacity-45"
    )}
    onClick={onToggle}
    type="button"
  >
    <span
      aria-hidden="true"
      className={cn(
        "size-2.5 shrink-0 translate-y-[1px] rounded-[2px]",
        !isActive && "ring-1 ring-muted-foreground/40"
      )}
      style={{ background: isActive ? color : "transparent" }}
    />
    <span className="font-mono text-[11px] text-muted-foreground">
      {series.label}
    </span>
    <span className="font-medium font-mono text-[11px] text-foreground tabular-nums">
      {formatValue(total)}
    </span>
    {series.unit ? (
      <span className="font-mono text-[10px] text-muted-foreground/60">
        {series.unit}
      </span>
    ) : null}
  </button>
);

/* The pill slides between options over 220ms; the movement is the
   explanation, so the reader sees which of two things they picked. */
const SWITCH_MS = 220;
const SWITCH_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const SWITCH_PAD = 4;

const GranularitySwitch = ({
  onChange,
  options,
  value,
}: {
  onChange: (next: ConsumptionGranularityOption) => void;
  options: ConsumptionGranularityOption[];
  value: ConsumptionGranularityOption;
}) => {
  const index = Math.max(0, options.indexOf(value));

  return (
    <fieldset
      aria-label="Granularity"
      className="relative grid grid-flow-col items-center rounded-full border border-border/60 p-0.5"
      style={{ gridAutoColumns: "1fr" }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0.5 left-0.5 rounded-full bg-primary/10 motion-reduce:transition-none"
        style={{
          transform: `translateX(${index * 100}%)`,
          transition: `transform ${SWITCH_MS}ms ${SWITCH_EASE}`,
          width: `calc((100% - ${SWITCH_PAD}px) / ${options.length})`,
        }}
      />
      {options.map((option) => (
        <button
          aria-pressed={option === value}
          className={cn(
            "relative z-10 rounded-full px-2 py-0.5 text-center font-mono text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none",
            option === value
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
          key={option}
          onClick={() => onChange(option)}
          style={{ transition: `color ${SWITCH_MS}ms ${SWITCH_EASE}` }}
          type="button"
        >
          {option}
        </button>
      ))}
    </fieldset>
  );
};

/** Everything the plot and the header need, derived from props. */
const shapeChart = (
  data: ConsumptionPoint[],
  series: ConsumptionSeries[],
  visible: ConsumptionSeries[]
) => {
  const rows = data.map((point) => ({ ...point.values, label: point.label }));
  const totals: Record<string, number> = {};

  for (const item of series) {
    let sum = 0;

    for (const point of data) {
      sum += point.values[item.id] ?? 0;
    }

    totals[item.id] = sum;
  }

  const config: ChartConfig = Object.fromEntries(
    series.map((item, index) => [
      item.id,
      { color: colorOf(item, index), label: item.label },
    ])
  );

  return {
    config,
    headlineTotals: totalsByUnit(visible, totals),
    rows,
    totals,
    xInterval: Math.max(0, Math.ceil(rows.length / MAX_X_LABELS) - 1),
  };
};

/**
 * ChartTooltipContent's `formatter` replaces the entire row, swatch and
 * label included, so a formatter that returns just a number leaves the
 * reader with three bare values and no idea which series is which.
 */
const TooltipRow = ({
  color,
  label,
  unit,
  value,
}: {
  color: string;
  label: string;
  unit?: string;
  value: string;
}) => (
  <>
    <span
      aria-hidden="true"
      className="size-2.5 shrink-0 translate-y-[1px] rounded-[2px]"
      style={{ background: color }}
    />
    <div className="flex flex-1 items-center justify-between gap-3 leading-none">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium font-mono text-foreground tabular-nums">
        {value}
        {unit ? (
          <span className="ml-1 font-normal text-muted-foreground/70">
            {unit}
          </span>
        ) : null}
      </span>
    </div>
  </>
);

/** Builds the tooltip row renderer for a given series list. */
const tooltipFormatter = (
  series: ConsumptionSeries[],
  formatValue: (value: number) => string
) =>
  function TooltipRowRenderer(
    value: unknown,
    name: unknown,
    entry: { color?: string }
  ) {
    const item = series.find((candidate) => candidate.id === name);

    return (
      <TooltipRow
        color={String(entry?.color ?? "var(--chart-1)")}
        label={item?.label ?? String(name)}
        unit={item?.unit}
        value={formatValue(Number(value))}
      />
    );
  };

/** The plot itself: axes, marks, tooltip. */
const Plot = ({
  colorFor,
  config,
  formatValue,
  granularityKey,
  isStacked,
  rows,
  series,
  variant,
  visible,
  xInterval,
}: {
  colorFor: (item: ConsumptionSeries) => string;
  config: ChartConfig;
  formatValue: (value: number) => string;
  granularityKey: string;
  isStacked: boolean;
  rows: Record<string, number | string>[];
  series: ConsumptionSeries[];
  variant: "area" | "bar";
  visible: ConsumptionSeries[];
  xInterval: number;
}) => {
  const Chart = variant === "bar" ? BarChart : AreaChart;

  return (
    <ChartContainer
      className="aspect-auto h-[220px] w-full"
      config={config}
      // Re-mounts on granularity change so the new dataset animates in
      // rather than snapping between two unrelated shapes.
      key={granularityKey}
    >
      <Chart accessibilityLayer data={rows} margin={{ left: 4, right: 8 }}>
        <CartesianGrid
          stroke="var(--border)"
          strokeOpacity={0.5}
          vertical={false}
        />
        <XAxis
          axisLine={false}
          dataKey="label"
          interval={xInterval}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          axisLine={false}
          tickCount={AXIS_TICK_COUNT}
          tickFormatter={formatValue}
          tickLine={false}
          width={44}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={tooltipFormatter(series, formatValue)}
            />
          }
          cursor={{ stroke: "var(--border)", strokeDasharray: "2 3" }}
        />

        {visible.map((item, index) =>
          variant === "bar" ? (
            <Bar
              dataKey={item.id}
              fill={colorFor(item)}
              fillOpacity={isStacked ? fillAt(index, visible.length) : 0.4}
              key={item.id}
              radius={2}
              stackId={isStacked ? "a" : undefined}
              stroke={colorFor(item)}
              strokeWidth={1}
            />
          ) : (
            <Area
              dataKey={item.id}
              fill={colorFor(item)}
              fillOpacity={
                isStacked ? fillAt(index, visible.length) : OVERLAY_FILL
              }
              key={item.id}
              stackId={isStacked ? "a" : undefined}
              // The series color rides the top edge of its own band, so
              // neighbours separate by line rather than by slab.
              stroke={colorFor(item)}
              strokeWidth={BAND_STROKE}
              type="monotone"
            />
          )
        )}
      </Chart>
    </ChartContainer>
  );
};

export const ConsumptionChart = ({
  action,
  activeSeriesIds,
  className,
  data,
  defaultActiveSeriesIds,
  defaultGranularity = "daily",
  empty,
  error = null,
  formatValue = defaultFormat,
  granularities,
  granularity,
  isLoading = false,
  meteredThrough,
  onActiveSeriesIdsChange,
  onGranularityChange,
  series,
  stacked = true,
  title = "consumption",
  variant = "area",
  ...props
}: ConsumptionChartProps) => {
  const [activeIds, setActiveIds] = useControllableState<string[]>({
    caller: "ConsumptionChart",
    defaultProp: defaultActiveSeriesIds ?? series.map((item) => item.id),
    onChange: onActiveSeriesIdsChange,
    prop: activeSeriesIds,
  });

  const [activeGranularity, setActiveGranularity] =
    useControllableState<ConsumptionGranularityOption>({
      caller: "ConsumptionChart",
      defaultProp: defaultGranularity,
      onChange: onGranularityChange,
      prop: granularity,
    });

  const visible = series.filter((item) => activeIds.includes(item.id));
  const units = unitsOf(visible);
  // Stacking adds values together. Across units that is not a quantity, so
  // overlay instead and say why rather than drawing a meaningless height.
  const isMixedUnits = units.length > 1;
  const isStacked = stacked && !isMixedUnits;

  // Recharts wants one flat row per bucket, keyed by series id.
  const { config, headlineTotals, rows, totals, xInterval } = shapeChart(
    data,
    series,
    visible
  );

  const toggleSeries = (id: string) => {
    if (activeIds.length === 1 && activeIds[0] === id) {
      return;
    }

    setActiveIds(
      activeIds.includes(id)
        ? activeIds.filter((item) => item !== id)
        : series
            .filter((item) => item.id === id || activeIds.includes(item.id))
            .map((item) => item.id)
    );
  };

  if (isLoading) {
    return (
      <section
        className={cn(
          "rounded-lg border border-border/60 bg-card p-4",
          className
        )}
        data-slot="consumption-chart"
        {...props}
      >
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-[220px] w-full" />
        <Skeleton className="mt-4 h-4 w-64" />
      </section>
    );
  }

  return (
    <section
      className={cn(
        "rounded-lg border border-border/60 bg-card p-4",
        className
      )}
      data-slot="consumption-chart"
      {...props}
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h3 className="font-mono text-muted-foreground text-xs">{title}</h3>
          <HeadlineTotals formatValue={formatValue} totals={headlineTotals} />
        </div>
        <div className="flex items-center gap-2">
          {action}
          {granularities?.length ? (
            <GranularitySwitch
              onChange={setActiveGranularity}
              options={granularities}
              value={activeGranularity}
            />
          ) : null}
        </div>
      </header>

      {error ? (
        <p
          className="mb-3 flex items-baseline gap-2 text-sm"
          data-slot="consumption-chart-error"
          role="alert"
        >
          <span className="font-mono text-destructive text-xs">error</span>
          <span className="text-foreground">{error}</span>
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center rounded-md border border-border/50 border-dashed">
          {empty ?? (
            <p className="font-mono text-[11px] text-muted-foreground">
              no consumption in this window
            </p>
          )}
        </div>
      ) : (
        <Plot
          colorFor={(item) => colorOf(item, series.indexOf(item))}
          config={config}
          formatValue={formatValue}
          granularityKey={activeGranularity}
          isStacked={isStacked}
          rows={rows}
          series={series}
          variant={variant}
          visible={visible}
          xInterval={xInterval}
        />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-0.5 border-border/50 border-t pt-3">
        {series.map((item, index) => (
          <LegendItem
            color={colorOf(item, index)}
            formatValue={formatValue}
            isActive={activeIds.includes(item.id)}
            key={item.id}
            onToggle={() => toggleSeries(item.id)}
            series={item}
            total={totals[item.id] ?? 0}
          />
        ))}
      </div>

      {isMixedUnits && stacked ? (
        <p
          className="mt-2 text-[10px] text-muted-foreground/70"
          data-slot="consumption-chart-units"
        >
          series overlaid, not stacked · {units.filter(Boolean).join(" and ")}{" "}
          don&apos;t add up
        </p>
      ) : null}

      {meteredThrough ? (
        <p
          className="mt-2 text-[10px] text-muted-foreground/70 tabular-nums"
          data-slot="consumption-chart-lag"
        >
          {meteredThrough}
        </p>
      ) : null}
    </section>
  );
};
