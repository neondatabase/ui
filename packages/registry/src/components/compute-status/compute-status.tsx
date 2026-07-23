"use client";

import type { ComponentProps } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Compute lifecycle. `active`/`scaling` are alive and breathe; `idle`/`suspended` hold steady. */
export type ComputeState = "active" | "idle" | "scaling" | "suspended";

interface ComputeStateConfig {
  /** Dot classes: alive states use `neon-status-breathe` + a token text color. */
  dot: string;
  label: string;
}

/* ─────────────────────────────────────────────────────────
 * COMPUTE READOUT
 *
 *  A calm mono line: a square status dot, the state word,
 *  then the compute size and the scale-to-zero readout,
 *  each fenced off by a hairline. Color lives only in the
 *  dot, from the house status vocabulary — active green,
 *  scaling amber, sleeping gray. The two alive states
 *  (active, scaling) breathe on the shared 2.6s cadence and
 *  hold steady under reduced motion; idle and suspended sit
 *  still, and suspended dims the whole line because the
 *  compute is off.
 * ───────────────────────────────────────────────────────── */
const STATE: Record<ComputeState, ComputeStateConfig> = {
  active: {
    dot: "neon-status-breathe bg-current text-[var(--status-active)]",
    label: "active",
  },
  idle: {
    dot: "bg-[var(--status-active)]",
    label: "idle",
  },
  scaling: {
    dot: "neon-status-breathe bg-current text-[var(--status-scaling)]",
    label: "scaling",
  },
  suspended: {
    dot: "bg-[var(--status-sleeping)]",
    label: "suspended",
  },
};

// A range renders with an en dash (\u2013), e.g. 0.25–2 CU.
const formatCu = (cu: number | [number, number]) =>
  Array.isArray(cu) ? `${cu[0]}\u2013${cu[1]} CU` : `${cu} CU`;

const Fence = () => (
  <span aria-hidden="true" className="h-3 w-px shrink-0 bg-border/60" />
);

export type ComputeStatusProps = Omit<ComponentProps<"div">, "children"> & {
  /** Current compute lifecycle state. */
  state: ComputeState;
  /** Compute size in CU: a single value ("1.5 CU") or an autoscaling range. */
  cu?: number | [number, number];
  /**
   * Scale-to-zero readout, already phrased for context, e.g.
   * "scales to zero after 5m" or "suspended 2h ago". Omit to hide.
   */
  scaleToZero?: string;
  /** Override the state's default word. */
  label?: string;
  /** "inline" is a naked row; "panel" wraps it in the house surface. */
  variant?: "inline" | "panel";
  isLoading?: boolean;
};

const rowClassName = "inline-flex items-center gap-2.5 font-mono text-xs";
const panelClassName = "rounded-lg border border-border/60 bg-card px-3 py-2";

export const ComputeStatus = ({
  state,
  cu,
  scaleToZero,
  label,
  variant = "inline",
  isLoading = false,
  className,
  ...props
}: ComputeStatusProps) => {
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading compute status"
        className={cn(
          rowClassName,
          variant === "panel" && panelClassName,
          className
        )}
        data-slot="compute-status"
        {...props}
      >
        <Skeleton aria-hidden="true" className="size-1.5" />
        <Skeleton aria-hidden="true" className="h-3 w-14" />
        <Fence />
        <Skeleton aria-hidden="true" className="h-3 w-16" />
      </div>
    );
  }

  const config = STATE[state];
  const cuText = cu === undefined ? null : formatCu(cu);

  return (
    <div
      className={cn(
        rowClassName,
        state === "suspended" && "opacity-80",
        variant === "panel" && panelClassName,
        className
      )}
      data-slot="compute-status"
      data-state={state}
      {...props}
    >
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0", config.dot)}
        />
        <span className="text-muted-foreground">{label ?? config.label}</span>
      </span>

      {cuText ? (
        <>
          <Fence />
          <span className="text-muted-foreground tabular-nums">{cuText}</span>
        </>
      ) : null}

      {scaleToZero ? (
        <>
          <Fence />
          <span className="truncate text-muted-foreground/70">
            {scaleToZero}
          </span>
        </>
      ) : null}
    </div>
  );
};
