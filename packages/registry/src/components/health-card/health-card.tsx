"use client";

import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps } from "react";

import { NeonLoader } from "@/components/neon-loader/neon-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Operational health of a surface, worst-first: down > degraded > maintenance > healthy. */
export type HealthStatus = "healthy" | "degraded" | "maintenance" | "down";

export interface HealthSignal {
  /** Short mono caption, e.g. "Latency p99". */
  label: string;
  /** Preformatted figure, e.g. "128 ms" or "99.98%". */
  value: string;
  /** Optional tint for this signal's dot; omit for no color. */
  status?: HealthStatus;
}

/* ─────────────────────────────────────────────────────────
 * HEALTH ROLLUP, on the MetricCard shell
 *
 *  The overall status is the light: a faint status-tinted
 *  grain wash rises from the bottom edge and a mono pill
 *  names it,
 *  both drawn from the house status vocabulary — active
 *  green, scaling amber, sleeping gray, destructive red.
 *  Beneath, the supporting signals (latency, errors, uptime)
 *  read as a quiet mono grid; a signal only takes color when
 *  it is the reason the rollup is not green. Text stays
 *  muted so a wall of cards reads calm. No motion.
 * ───────────────────────────────────────────────────────── */
const STATUS_DOT: Record<HealthStatus, string> = {
  degraded: "bg-[var(--status-scaling)]",
  down: "bg-destructive",
  healthy: "bg-[var(--status-active)]",
  maintenance: "bg-[var(--status-sleeping)]",
};

/** Wash tint: set as text color so neon-card-wash reads `currentColor`. */
const STATUS_TINT: Record<HealthStatus, string> = {
  degraded: "text-[var(--status-scaling)]",
  down: "text-destructive",
  healthy: "text-[var(--status-active)]",
  maintenance: "text-[var(--status-sleeping)]",
};

const STATUS_LABEL: Record<HealthStatus, string> = {
  degraded: "degraded",
  down: "down",
  healthy: "healthy",
  maintenance: "maintenance",
};

const HealthBadge = ({
  status,
  label,
}: {
  status: HealthStatus;
  label?: string;
}) => (
  <span
    className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-border/60 bg-card px-2 py-0.5 font-mono text-muted-foreground text-xs"
    data-slot="health-card-badge"
    data-status={status}
  >
    <span
      aria-hidden="true"
      className={cn("size-1.5 shrink-0", STATUS_DOT[status])}
    />
    {label ?? STATUS_LABEL[status]}
  </span>
);

export type HealthCardProps = Omit<ComponentProps<"div">, "children"> & {
  /** Rollup title, e.g. "Production" or a project name. */
  label: string;
  /** Overall status, driving the pill and the top wash. */
  status: HealthStatus;
  /** One-line human summary, e.g. "All systems operational". */
  summary?: string;
  /** Supporting figures (latency, error rate, uptime). */
  signals?: HealthSignal[];
  /** Last check, already formatted, e.g. "checked 30s ago". */
  updatedAt?: string;
  isLoading?: boolean;
  error?: Error | string | null;
};

const healthCardClassName =
  "relative isolate flex min-h-[168px] flex-col overflow-hidden rounded-lg border border-border/60 bg-card shadow-none ring-0 transition-colors hover:border-border";

const labelClassName =
  "truncate font-mono font-medium text-muted-foreground text-xs";

export const HealthCard = ({
  label,
  status,
  summary,
  signals,
  updatedAt,
  isLoading = false,
  error = null,
  className,
  ...props
}: HealthCardProps) => {
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label={`Loading ${label}`}
        className={cn(healthCardClassName, className)}
        data-slot="health-card"
        {...props}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <p className={labelClassName} title={label}>
            {label}
          </p>
          <NeonLoader className="shrink-0" label="Loading health" size={16} />
        </div>
        <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 px-4 pt-4 pb-4">
          <Skeleton aria-hidden="true" className="h-8 w-20" />
          <Skeleton aria-hidden="true" className="h-8 w-20" />
        </div>
      </div>
    );
  }

  if (error) {
    const message = typeof error === "string" ? error : error.message;

    return (
      <div
        className={cn(healthCardClassName, className)}
        data-slot="health-card"
        role="alert"
        {...props}
      >
        <div className="px-4 pt-4">
          <p className={labelClassName} title={label}>
            {label}
          </p>
        </div>
        <div className="mt-auto px-4 pt-3 pb-4">
          <div className="rounded-md border border-destructive/20 bg-destructive/[0.045] p-3">
            <div className="flex items-center gap-2 text-destructive">
              <HugeiconsIcon
                aria-hidden="true"
                className="size-3.5"
                icon={Alert02Icon}
                strokeWidth={2}
              />
              <p className="font-medium text-xs">Health unavailable</p>
            </div>
            <p className="mt-2 text-pretty text-muted-foreground text-xs leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(healthCardClassName, className)}
      data-slot="health-card"
      data-status={status}
      {...props}
    >
      <div
        aria-hidden="true"
        className={cn(
          "neon-card-wash -z-10 pointer-events-none absolute inset-x-0 bottom-0 h-24 opacity-[0.12]",
          STATUS_TINT[status]
        )}
      />

      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <p className={labelClassName} title={label}>
            {label}
          </p>
          {summary ? (
            <p className="mt-1 line-clamp-2 text-pretty text-foreground/90 text-sm leading-snug">
              {summary}
            </p>
          ) : null}
        </div>
        <HealthBadge status={status} />
      </div>

      {signals && signals.length > 0 ? (
        <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 px-4 pt-4 pb-3">
          {signals.map((signal) => (
            <div className="min-w-0" key={signal.label}>
              <div className="flex items-center gap-1.5">
                {signal.status ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 shrink-0",
                      STATUS_DOT[signal.status]
                    )}
                  />
                ) : null}
                <span
                  className="truncate font-mono text-[10px] text-muted-foreground/70"
                  title={signal.label}
                >
                  {signal.label}
                </span>
              </div>
              <p className="mt-0.5 font-semibold text-foreground text-lg tabular-nums tracking-tight">
                {signal.value}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-auto" />
      )}

      {updatedAt ? (
        <p className="px-4 pb-3 font-mono text-[10px] text-muted-foreground/70 tabular-nums">
          {updatedAt}
        </p>
      ) : null}
    </div>
  );
};
