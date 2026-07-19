"use client";

import type { ComponentProps, ReactNode } from "react";

import type { MetricCardProps } from "@/components/metric-card/metric-card";
import { MetricCard } from "@/components/metric-card/metric-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UsageMetric extends Pick<
  MetricCardProps,
  "label" | "value" | "delta" | "comparisonLabel" | "trend" | "format" | "unit"
> {
  /** Stable id, e.g. "compute_unit_seconds". */
  id: string;
  /** Locked behind a paid plan; renders the gate instead of the value. */
  gated?: boolean;
}

export type UsagePanelProps = Omit<ComponentProps<"section">, "children"> & {
  /** The per-project metrics, in display order. */
  metrics: UsageMetric[];
  /** Billing period readout, e.g. "Jul 1 – Jul 18". */
  period?: string;
  /**
   * Header filter slot, e.g. a DateRangePicker. Renders right-aligned;
   * takes the period readout's place when both are set.
   */
  filter?: ReactNode;
  /**
   * Metering-lag notice: when consumption data trails real time, say
   * so, e.g. "metered through 21:40 UTC". Renders as a quiet footer.
   */
  meteredThrough?: string;
  /** Renders the upgrade action on gated metrics. */
  onUpgrade?: () => void;
  /** Skeletons every card. */
  isLoading?: boolean;
  /** Panel-level failure rendered above the grid. */
  error?: string | null;
  /** Extra content after the footer, e.g. a link to invoices. */
  footer?: ReactNode;
};

/* ─────────────────────────────────────────────────────────
 * PANEL STORYBOARD
 *
 *  entrance  cards rise one at a time, 60ms apart, in
 *            metric order — MetricCard's own entrance
 *            rhythm, orchestrated
 *  rest      a mono header row (usage · period) over the
 *            MetricCard grid; the cards do the talking
 *  gated     a locked metric keeps the card frame but
 *            holds its voice: mono "available on a paid
 *            plan" where the value would be, with a quiet
 *            upgrade action — the gate is an invitation,
 *            not a wall
 *  lag       when metering trails real time, a mono footer
 *            says exactly how far — never pretend the
 *            numbers are live
 *  loading   every card skeletons through MetricCard
 *  error     the house error line above the grid; cards
 *            hold their last values
 * ───────────────────────────────────────────────────────── */
const CARD_STAGGER_MS = 60;

const RISE =
  "fill-mode-backwards fade-in-0 slide-in-from-bottom-2 animate-in duration-500 motion-reduce:animate-none";

/** The locked metric: same frame, held voice, an invitation. */
const GatedCard = ({
  label,
  onUpgrade,
}: {
  label: string;
  onUpgrade?: () => void;
}) => (
  <div
    className="flex min-h-[168px] flex-col overflow-hidden rounded-lg border border-border/60 bg-card transition-colors hover:border-border"
    data-slot="usage-panel-gated"
  >
    <p
      className="truncate px-4 pt-4 font-medium font-mono text-muted-foreground text-xs"
      title={label}
    >
      {label}
    </p>
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 pb-4">
      <p className="text-[10px] text-muted-foreground/70">
        available on a paid plan
      </p>
      {onUpgrade ? (
        <Button
          className="h-6 rounded-full border border-border/60 px-2.5 text-muted-foreground text-xs transition-colors hover:border-primary/60 hover:bg-transparent hover:text-primary active:scale-[0.98]"
          onClick={onUpgrade}
          size="sm"
          variant="ghost"
        >
          Upgrade
        </Button>
      ) : null}
    </div>
  </div>
);

export const UsagePanel = ({
  className,
  error = null,
  filter,
  footer,
  isLoading = false,
  meteredThrough,
  metrics,
  onUpgrade,
  period,
  ...props
}: UsagePanelProps) => (
  <section
    className={cn("flex w-full flex-col gap-3", className)}
    data-slot="usage-panel"
    {...props}
  >
    <div className="flex items-center justify-between gap-3">
      <h3 className="font-mono text-muted-foreground text-xs">usage</h3>
      {filter ??
        (period ? (
          <span className="font-mono text-[10px] text-muted-foreground/70 tabular-nums">
            {period}
          </span>
        ) : null)}
    </div>

    {error ? (
      <p
        className="flex items-baseline gap-2 text-sm"
        data-slot="usage-panel-error"
        role="alert"
      >
        <span className="font-mono text-destructive text-xs">error</span>
        <span className="text-foreground">{error}</span>
      </p>
    ) : null}

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map(({ gated, id, ...metric }, index) => (
        <div
          className={RISE}
          key={id}
          style={{ animationDelay: `${index * CARD_STAGGER_MS}ms` }}
        >
          {gated ? (
            <GatedCard label={metric.label} onUpgrade={onUpgrade} />
          ) : (
            <MetricCard isLoading={isLoading} {...metric} />
          )}
        </div>
      ))}
    </div>

    {meteredThrough ? (
      <p
        className="text-[10px] text-muted-foreground/70 tabular-nums"
        data-slot="usage-panel-lag"
      >
        {meteredThrough}
      </p>
    ) : null}
    {footer}
  </section>
);
