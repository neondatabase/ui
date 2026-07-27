"use client";

import type { ComponentProps, ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface CostLine {
  /** Stable id, e.g. "compute_unit_seconds". */
  id: string;
  /** Line label, e.g. "Compute". */
  label: string;
  /** Billable amount after allowances, in `unit`. */
  quantity: number;
  /** Total consumed before the allowance, in `unit`. */
  used?: number;
  /** Billing unit, e.g. "CU-hr" or "GB-mo". */
  unit: string;
  /** USD per unit. */
  rate: number;
  /** quantity x rate, in USD. */
  cost: number;
  /** Amount the plan covered, shown as a quiet "N included" note. */
  included?: number;
}

export type CostEstimateCardProps = Omit<
  ComponentProps<"section">,
  "children"
> & {
  /** Line items in display order. */
  lines: CostLine[];
  /** Overrides the summed total, e.g. when the invoice already exists. */
  total?: number;
  /**
   * "cost" ranks the biggest line first, which is what the reader came
   * for. "given" keeps the order you passed, e.g. to match an invoice.
   */
  order?: "cost" | "given";
  /**
   * Roll lines costing nothing into one muted summary row. They still
   * appear, because "we checked and it was zero" is worth saying, but
   * they stop competing with the lines that cost money.
   */
  collapseZero?: boolean;
  /** Plan name shown beside the total, e.g. "scale". */
  plan?: string;
  /** Billing period readout, e.g. "Feb 1 – Feb 14". */
  period?: string;
  /**
   * Spending limit in USD. Draws a progress meter and, once the estimate
   * passes it, says so rather than letting the number pass unremarked.
   */
  spendingLimit?: number;
  /** Right-side header slot, e.g. a plan switch or DateRangePicker. */
  action?: ReactNode;
  /** Footer content, e.g. a link to the invoice. */
  footer?: ReactNode;
  /**
   * Says the estimate is a projection, not a bill. Defaults to a plain
   * note; pass null to drop it when you're rendering a settled invoice.
   */
  note?: ReactNode;
  isLoading?: boolean;
  error?: string | null;
};

/* ─────────────────────────────────────────────────────────
 * COST STORYBOARD
 *
 *  rest      the number first, then how it was reached:
 *            quantity x rate per line. A cost with no
 *            arithmetic behind it is a number to distrust
 *  included  allowances are shown, not silently netted —
 *            "500 GB included" explains why 620 GB bills
 *            as 120
 *  limit     with a spending limit set, a meter shows the
 *            distance to it and turns to the warning tone
 *            once crossed; a limit you can't see is a
 *            limit you'll hit
 *  loading   the total and every line skeleton in place
 *  note      the estimate names itself an estimate —
 *            metering lags and rounding differs, and the
 *            invoice is the source of truth
 * ───────────────────────────────────────────────────────── */

const CURRENCY = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

const PRECISE_CURRENCY = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 4,
  minimumFractionDigits: 2,
  style: "currency",
});

const QUANTITY = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const PERCENT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  style: "percent",
});

const LineRow = ({ line, share }: { line: CostLine; share: number }) => (
  <li className="flex items-baseline gap-3 py-1.5">
    <span className="min-w-0 flex-1">
      <span className="block truncate text-foreground text-sm">
        {line.label}
      </span>
      <span className="block font-mono text-[11px] text-muted-foreground/70 tabular-nums">
        {QUANTITY.format(line.quantity)} {line.unit} ×{" "}
        {PRECISE_CURRENCY.format(line.rate)}
        {/* One template string, not interleaved JSX text and expressions:
            JSX collapses the spaces around them and the line renders as
            "·604 used,500 included". */}
        {line.included ? (
          <span className="ml-1.5 text-muted-foreground/60">
            {`· ${QUANTITY.format(
              line.used ?? line.quantity + line.included
            )} used, ${QUANTITY.format(line.included)} included`}
          </span>
        ) : null}
      </span>
    </span>
    <span className="font-mono text-foreground text-sm tabular-nums">
      {CURRENCY.format(line.cost)}
    </span>
    <span className="w-12 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
      {PERCENT.format(share)}
    </span>
  </li>
);

/** The lines that cost nothing, said once instead of a row each. */
const ZeroRow = ({ lines }: { lines: CostLine[] }) => (
  <li className="flex items-baseline gap-3 py-1.5">
    <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground/70">
      {lines.length} with no usage ·{" "}
      {lines.map((line) => line.label).join(", ")}
    </span>
    <span className="font-mono text-[11px] text-muted-foreground/70 tabular-nums">
      {CURRENCY.format(0)}
    </span>
    <span className="w-12" />
  </li>
);

/**
 * Below this share the fill is too narrow to hold its own label, so the
 * spent figure steps outside the fill instead of being clipped by it.
 */
const MIN_INSIDE_SHARE = 0.24;
const FULL_METER = 100;

const SpendMeter = ({ total, limit }: { total: number; limit: number }) => {
  const share = limit > 0 ? Math.min(total / limit, 1) : 0;
  const isOver = total > limit;
  const fitsInside = share >= MIN_INSIDE_SHARE;

  return (
    // No progressbar role: the bar carries real text stating spent, left,
    // and the limit, which reads better than a percentage announcement.
    <div
      className="relative mt-3 h-6 w-full overflow-hidden rounded-full bg-muted"
      data-slot="cost-estimate-card-meter"
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none",
          isOver ? "bg-destructive" : "bg-primary"
        )}
        style={{ width: `${share * FULL_METER}%` }}
      />

      {/* The figures ride the bar rather than sitting under it: the amount
          spent is the fill, so the number belongs where the color is. */}
      <div className="absolute inset-0 flex items-center justify-between gap-2 px-2.5 font-mono text-[10px] tabular-nums">
        <span
          className={cn(
            "whitespace-nowrap transition-colors",
            fitsInside
              ? "text-primary-foreground dark:text-background"
              : "text-foreground"
          )}
          style={
            fitsInside
              ? undefined
              : { marginInlineStart: `${share * FULL_METER}%` }
          }
        >
          {CURRENCY.format(total)} spent
        </span>
        <span
          className={cn(
            "whitespace-nowrap",
            isOver ? "text-destructive-foreground" : "text-muted-foreground"
          )}
        >
          {isOver
            ? `${CURRENCY.format(total - limit)} over`
            : `${CURRENCY.format(limit - total)} left of ${CURRENCY.format(limit)}`}
        </span>
      </div>
    </div>
  );
};

export const CostEstimateCard = ({
  action,
  className,
  collapseZero = true,
  error = null,
  footer,
  isLoading = false,
  lines,
  order = "cost",
  note = "estimate · metering lags ~15m, the invoice is the source of truth",
  period,
  plan,
  spendingLimit,
  total,
  ...props
}: CostEstimateCardProps) => {
  const sum = total ?? lines.reduce((carry, line) => carry + line.cost, 0);

  // Biggest line first: the reader came to find what is driving the bill,
  // and metric declaration order has nothing to do with cost.
  const ranked =
    order === "cost" ? [...lines].toSorted((a, b) => b.cost - a.cost) : lines;
  const charged = collapseZero
    ? ranked.filter((line) => line.cost > 0)
    : ranked;
  const free = collapseZero ? ranked.filter((line) => line.cost === 0) : [];
  const shareOf = (cost: number) => (sum > 0 ? cost / sum : 0);

  if (isLoading) {
    return (
      <section
        className={cn(
          "rounded-lg border border-border/60 bg-card p-4",
          className
        )}
        data-slot="cost-estimate-card"
        {...props}
      >
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-8 w-32" />
        <div className="mt-4 space-y-3">
          {lines.map((line) => (
            <Skeleton className="h-8 w-full" key={line.id} />
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
      data-slot="cost-estimate-card"
      {...props}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-mono text-muted-foreground text-xs">
            estimated cost
          </h3>
          <p className="mt-1 font-medium font-mono text-3xl text-foreground tabular-nums">
            {CURRENCY.format(sum)}
          </p>
          {/* The plan sets every rate on this card, so it reads at full
              strength rather than as a footnote beside the date. */}
          <p className="mt-1 flex items-baseline gap-1.5 font-mono text-[11px] tabular-nums">
            {plan ? <span className="text-foreground">{plan} plan</span> : null}
            {plan && period ? (
              <span className="text-muted-foreground/40">·</span>
            ) : null}
            {period ? (
              <span className="text-muted-foreground/70">{period}</span>
            ) : null}
          </p>
        </div>
        {action}
      </header>

      {spendingLimit === undefined ? null : (
        <SpendMeter limit={spendingLimit} total={sum} />
      )}

      {error ? (
        <p
          className="mt-3 flex items-baseline gap-2 text-sm"
          data-slot="cost-estimate-card-error"
          role="alert"
        >
          <span className="font-mono text-destructive text-xs">error</span>
          <span className="text-foreground">{error}</span>
        </p>
      ) : null}

      {/* No total row: the figure is already the headline and the meter's
          left label. Three copies of one number is not emphasis. */}
      <ul className="mt-4 border-border/50 border-t pt-1">
        {charged.map((line) => (
          <LineRow key={line.id} line={line} share={shareOf(line.cost)} />
        ))}
        {free.length > 0 ? <ZeroRow lines={free} /> : null}
      </ul>

      {note ? (
        <p
          className="mt-3 text-[10px] text-muted-foreground/70"
          data-slot="cost-estimate-card-note"
        >
          {note}
        </p>
      ) : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </section>
  );
};
