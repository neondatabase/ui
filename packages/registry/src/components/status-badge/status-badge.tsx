"use client";

import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type AppStatus = "ready" | "provisioning" | "error" | "stopped";

export type AppPlan = "free" | "paid";

export type StatusBadgeProps = Omit<ComponentProps<"span">, "children"> & {
  /** Lifecycle state of the app or branch. */
  status: AppStatus;
  /** Override the default status text. */
  label?: string;
};

export type PlanBadgeProps = Omit<ComponentProps<"span">, "children"> & {
  /** Billing plan of the tenant. */
  plan: AppPlan;
  /** Override the default plan text. */
  label?: string;
};

/* ─────────────────────────────────────────────────────────
 * The shared status vocabulary: a square dot and a quiet
 * mono word, both flush with the token-radius system (sharp by default).
 * Color lives only in the dot — ready is primary, error is
 * destructive, stopped is muted. Provisioning breathes: a
 * slow 2.6s inhale/exhale with a soft glow, never a blink;
 * it holds steady under reduced motion. Text stays muted so
 * a wall of badges reads calmly on the dashboard.
 * ───────────────────────────────────────────────────────── */
const STATUS_LABEL: Record<AppStatus, string> = {
  error: "error",
  provisioning: "provisioning",
  ready: "ready",
  stopped: "stopped",
};

const STATUS_DOT: Record<AppStatus, string> = {
  error: "bg-destructive",
  provisioning: "neon-status-breathe bg-current text-primary",
  ready: "bg-primary",
  stopped: "bg-muted-foreground/50",
};

export const StatusBadge = ({
  className,
  label,
  status,
  ...props
}: StatusBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-sm border border-border/60 bg-card px-2 py-0.5 font-mono text-muted-foreground text-xs",
      className
    )}
    data-slot="status-badge"
    data-status={status}
    {...props}
  >
    <span
      aria-hidden="true"
      className={cn("size-1.5 shrink-0", STATUS_DOT[status])}
    />
    {label ?? STATUS_LABEL[status]}
  </span>
);

/** Billing-plan companion: same footprint, no dot, paid gets ink. */
export const PlanBadge = ({
  className,
  label,
  plan,
  ...props
}: PlanBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-sm border border-border/60 px-2 py-0.5 font-mono text-xs",
      plan === "paid"
        ? "border-primary/40 text-primary"
        : "bg-card text-muted-foreground",
      className
    )}
    data-plan={plan}
    data-slot="plan-badge"
    {...props}
  >
    {label ?? plan}
  </span>
);
