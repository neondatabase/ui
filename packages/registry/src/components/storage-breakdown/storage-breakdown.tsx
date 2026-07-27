"use client";

import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useControllableState } from "@/hooks/use-controllable-state";
import { cn } from "@/lib/utils";

export interface StorageSegment {
  /** Stable id, e.g. "root_branch_bytes_month". */
  id: string;
  /** Row and tooltip label, e.g. "Root branch". */
  label: string;
  /** Amount in the unit you're displaying, e.g. GB-months. */
  value: number;
  /**
   * USD per unit, e.g. 0.35 for root storage. Storage metrics bill at
   * different rates, so bytes and dollars rank differently. Give every
   * segment a rate and the card can show both.
   */
  rate?: number;
  /** Any CSS color; defaults to the --chart-n token for its position. */
  color?: string;
  /** One quiet line explaining what this segment is. */
  hint?: string;
}

/** Rank by how much storage is held, or by what it costs. */
export type StorageBreakdownView = "volume" | "cost";

export type StorageBreakdownProps = Omit<
  ComponentProps<"section">,
  "children"
> & {
  /** Segments in stacking order, largest first reads best. */
  segments: StorageSegment[];
  /** Panel heading. */
  title?: string;
  /** Unit for the headline figure, e.g. "GB-mo". Sits beside the number. */
  unit?: string;
  /** Period readout, e.g. "Feb 1 – Feb 14". Sits in the header's right. */
  period?: string;
  /**
   * Denominator for the share percentages. Defaults to the segment sum;
   * pass a plan allowance to show headroom instead of composition.
   */
  total?: number;
  /**
   * Controlled view. "volume" ranks by the raw amount; "cost" ranks by
   * amount x rate. The switch only appears when every segment has a rate.
   */
  view?: StorageBreakdownView;
  defaultView?: StorageBreakdownView;
  onViewChange?: (view: StorageBreakdownView) => void;
  /** Formats every amount shown. Defaults to two decimals. */
  formatValue?: (value: number) => string;
  /** Controlled highlight, e.g. driven from a chart legend. */
  activeSegmentId?: string | null;
  onActiveSegmentIdChange?: (id: string | null) => void;
  /** Makes rows clickable, e.g. to filter a chart. */
  onSelectSegment?: (segment: StorageSegment) => void;
  isLoading?: boolean;
  error?: string | null;
  /** Extra content under the rows, e.g. a link to snapshot settings. */
  footer?: ReactNode;
};

/* ─────────────────────────────────────────────────────────
 * BREAKDOWN STORYBOARD
 *
 *  rest      one continuous bar answers "what is my storage
 *            made of" at a glance; the rows below answer
 *            "how much" and "what does it cost" without a
 *            tooltip
 *  volume    the default ranking, by amount held
 *  cost      the same segments weighted by rate. Storage
 *            bills at four different prices, so bytes and
 *            dollars rank differently — instant restore
 *            looks larger than it bills. The switch exists
 *            so the card can't misdirect the one reader
 *            who came here to cut a bill
 *  hover     hovering a row dims the other segments rather
 *            than growing anything — the bar never moves,
 *            so comparison stays honest
 *  zero      a metric the API omitted is zero, not missing;
 *            it keeps its row at 0% instead of vanishing
 *            and making the reader wonder
 *  loading   bar and rows skeleton at their real heights
 * ───────────────────────────────────────────────────────── */

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/**
 * One decimal, always. Without a minimum, 4.0% prints as "4%" and the
 * decimal points stop lining up in a right-aligned column.
 */
const PERCENT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  style: "percent",
});

const CURRENCY = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

const DEFAULT_FORMAT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

/** Hoisted so the default prop keeps a stable identity across renders. */
const formatDefault = (value: number) => DEFAULT_FORMAT.format(value);

const colorOf = (segment: StorageSegment, index: number): string =>
  segment.color ?? PALETTE[index % PALETTE.length] ?? PALETTE[0];

const MIN_VISIBLE_SHARE = 0.004;

const costOf = (segment: StorageSegment) => segment.value * (segment.rate ?? 0);

/**
 * One legend row. A row that does nothing is not a button: rendering one
 * hands keyboard and screen-reader users a dead stop per segment.
 */
const SegmentRow = ({
  color,
  formatValue,
  isInteractive,
  onSelect,
  segment,
  setActive,
  share,
  showsCost,
  unit,
}: {
  color: string;
  formatValue: (value: number) => string;
  isInteractive: boolean;
  onSelect?: () => void;
  segment: StorageSegment;
  setActive: (id: string | null) => void;
  share: number;
  showsCost: boolean;
  unit: string;
}) => {
  const Row = isInteractive ? "button" : "div";
  const amount = showsCost
    ? CURRENCY.format(costOf(segment))
    : formatValue(segment.value);
  const counterpart = showsCost
    ? `${formatValue(segment.value)} ${unit}`
    : `~${CURRENCY.format(costOf(segment))}`;

  return (
    <Row
      className={cn(
        "flex w-full items-baseline gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors",
        isInteractive &&
          "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      )}
      onBlur={isInteractive ? () => setActive(null) : undefined}
      onClick={onSelect}
      onFocus={isInteractive ? () => setActive(segment.id) : undefined}
      onPointerEnter={() => setActive(segment.id)}
      onPointerLeave={() => setActive(null)}
      {...(isInteractive ? { type: "button" as const } : {})}
    >
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 translate-y-[1px] rounded-[2px]"
        style={{ backgroundColor: color }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-foreground text-sm">
          {segment.label}
        </span>
        {segment.hint ? (
          <span className="block truncate text-[11px] text-muted-foreground/70">
            {segment.hint}
          </span>
        ) : null}
      </span>
      <span className="text-right">
        <span className="block font-mono text-foreground text-sm tabular-nums">
          {amount}
        </span>
        {segment.rate === undefined ? null : (
          <span className="block font-mono text-[10px] text-muted-foreground/60 tabular-nums">
            {counterpart}
          </span>
        )}
      </span>
      <span className="w-14 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
        {PERCENT.format(share)}
      </span>
    </Row>
  );
};

/** The figure, its unit, and its counterpart in the other currency. */
const Headline = ({
  costSum,
  formatValue,
  isPriced,
  showsCost,
  sum,
  unit,
}: {
  costSum: number;
  formatValue: (value: number) => string;
  isPriced: boolean;
  showsCost: boolean;
  sum: number;
  unit: string;
}) => {
  if (showsCost) {
    return (
      <p className="mt-2 font-medium font-mono text-2xl text-foreground tabular-nums">
        {CURRENCY.format(costSum)}
      </p>
    );
  }

  // The unit belongs beside the number, not in the opposite corner.
  return (
    <p className="mt-2 flex items-baseline gap-1.5">
      <span className="font-medium font-mono text-2xl text-foreground tabular-nums">
        {formatValue(sum)}
      </span>
      <span className="font-mono text-muted-foreground text-sm">{unit}</span>
      {isPriced ? (
        <span className="font-mono text-muted-foreground/60 text-xs tabular-nums">
          · ~{CURRENCY.format(costSum)}
        </span>
      ) : null}
    </p>
  );
};

const ViewSwitch = ({
  value,
  onChange,
}: {
  value: StorageBreakdownView;
  onChange: (next: StorageBreakdownView) => void;
}) => (
  <fieldset
    aria-label="Rank by"
    className="flex items-center gap-0.5 rounded-full border border-border/60 p-0.5"
  >
    {(["volume", "cost"] as const).map((option) => (
      <button
        aria-pressed={option === value}
        className={cn(
          "rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          option === value
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
        key={option}
        onClick={() => onChange(option)}
        type="button"
      >
        {option}
      </button>
    ))}
  </fieldset>
);

export const StorageBreakdown = ({
  activeSegmentId,
  className,
  defaultView = "volume",
  error = null,
  footer,
  formatValue = formatDefault,
  isLoading = false,
  onActiveSegmentIdChange,
  onSelectSegment,
  onViewChange,
  period,
  segments,
  title = "storage",
  total,
  unit = "GB-mo",
  view,
  ...props
}: StorageBreakdownProps) => {
  const [internalActive, setInternalActive] = useState<string | null>(null);
  const active =
    activeSegmentId === undefined ? internalActive : activeSegmentId;

  const [activeView, setActiveView] =
    useControllableState<StorageBreakdownView>({
      caller: "StorageBreakdown",
      defaultProp: defaultView,
      onChange: onViewChange,
      prop: view,
    });

  const setActive = (id: string | null) => {
    if (activeSegmentId === undefined) {
      setInternalActive(id);
    }

    onActiveSegmentIdChange?.(id);
  };

  // Rates are what make bytes and dollars disagree. Offer the switch only
  // when every segment can answer both questions.
  const isPriced =
    segments.length > 0 && segments.every((s) => s.rate !== undefined);
  const showsCost = isPriced && activeView === "cost";

  const weightOf = (segment: StorageSegment) =>
    showsCost ? costOf(segment) : segment.value;

  const sum = segments.reduce((carry, segment) => carry + segment.value, 0);
  const costSum = segments.reduce(
    (carry, segment) => carry + costOf(segment),
    0
  );
  const denominator = showsCost ? costSum : (total ?? sum);
  const shareOf = (segment: StorageSegment) =>
    denominator > 0 ? weightOf(segment) / denominator : 0;

  const isInteractive = Boolean(onSelectSegment);

  if (isLoading) {
    return (
      <section
        className={cn(
          "rounded-lg border border-border/60 bg-card p-4",
          className
        )}
        data-slot="storage-breakdown"
        {...props}
      >
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-40" />
        <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
        <div className="mt-4 space-y-2.5">
          {segments.map((segment) => (
            <Skeleton className="h-8 w-full" key={segment.id} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "rounded-lg border border-border/60 bg-card p-4",
        className
      )}
      data-slot="storage-breakdown"
      {...props}
    >
      <header className="flex items-center justify-between gap-3">
        <h3 className="font-mono text-muted-foreground text-xs">{title}</h3>
        <div className="flex items-center gap-2">
          {period ? (
            <span className="font-mono text-muted-foreground/70 text-xs tabular-nums">
              {period}
            </span>
          ) : null}
          {isPriced ? (
            <ViewSwitch onChange={setActiveView} value={activeView} />
          ) : null}
        </div>
      </header>

      <Headline
        costSum={costSum}
        formatValue={formatValue}
        isPriced={isPriced}
        showsCost={showsCost}
        sum={sum}
        unit={unit}
      />

      {error ? (
        <p
          className="mt-3 flex items-baseline gap-2 text-sm"
          data-slot="storage-breakdown-error"
          role="alert"
        >
          <span className="font-mono text-destructive text-xs">error</span>
          <span className="text-foreground">{error}</span>
        </p>
      ) : null}

      {/* No gaps: segments butt against each other so the bar reads as one
          quantity split up, not as a segmented control. */}
      <div
        aria-hidden="true"
        className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
      >
        {segments.map((segment, index) => {
          const share = shareOf(segment);

          if (share < MIN_VISIBLE_SHARE) {
            return null;
          }

          return (
            <span
              className="h-full transition-opacity duration-200"
              key={segment.id}
              style={{
                backgroundColor: colorOf(segment, index),
                // A hairline of the card's own color separates neighbours,
                // so the ramp's steps read as distinct bands.
                borderRight:
                  index < segments.length - 1
                    ? "1.5px solid var(--card)"
                    : undefined,
                opacity: active && active !== segment.id ? 0.25 : 1,
                width: `${share * 100}%`,
              }}
            />
          );
        })}
      </div>

      <ul className="mt-4 space-y-0.5">
        {segments.map((segment, index) => (
          <li key={segment.id}>
            <SegmentRow
              color={colorOf(segment, index)}
              formatValue={formatValue}
              isInteractive={isInteractive}
              onSelect={
                isInteractive ? () => onSelectSegment?.(segment) : undefined
              }
              segment={segment}
              setActive={setActive}
              share={shareOf(segment)}
              showsCost={showsCost}
              unit={unit}
            />
          </li>
        ))}
      </ul>

      {showsCost ? (
        <p className="mt-2 px-1.5 text-[10px] text-muted-foreground/70">
          ranked by cost · storage bills at four different rates
        </p>
      ) : null}

      {footer ? <div className="mt-3">{footer}</div> : null}
    </section>
  );
};
