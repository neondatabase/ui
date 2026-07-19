"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type EmptyStateProps = Omit<ComponentProps<"div">, "title"> & {
  /** One line naming what's missing, e.g. "No apps yet". */
  title: ReactNode;
  /** Optional supporting line explaining how the space fills. */
  description?: ReactNode;
  /** Replace the faded Neon mark, e.g. with an icon. */
  icon?: ReactNode;
  /** Optional call to action, e.g. a Button. */
  action?: ReactNode;
  /** Vertical breathing room. */
  size?: "sm" | "md" | "lg";
  /**
   * "panel" draws the dashed frame and stripe wash; "bare" drops both for
   * embedding inside an already-bordered surface, e.g. a chat pane.
   */
  variant?: "panel" | "bare";
};

/* ─────────────────────────────────────────────────────────
 * An intentional empty state, not an absence. Three moves
 * from the Neon identity mark the space as "waiting":
 *
 *  texture   faint 45° hairline stripes wash the panel —
 *            the same fill MetricCard draws under trends,
 *            here reading as unclaimed ground
 *  mark      the Neon mark faded to a watermark — the
 *            brand holding the space open
 *  type      one foreground line, one muted line, action
 *            last; everything else stays quiet
 * ───────────────────────────────────────────────────────── */
const SIZE_PADDING: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  lg: "px-8 py-20",
  md: "px-6 py-14",
  sm: "px-4 py-8",
};

/** Official Neon mark, from the published brand SVG (viewBox 0 0 31.3 31.6). */
const NEON_MARK_PATH =
  "M31.3,0v31.6l-12.2-10.6v10.6H0V0h31.3ZM3.8,27.7h11.4v-15.2l12.2,10.8V3.8H3.8s0,23.9,0,23.9Z";

/** The Neon mark, faded into the panel like a watermark. */
const FadedMark = () => (
  <svg
    aria-hidden="true"
    className="size-5 fill-muted-foreground/30"
    viewBox="0 0 31.3 31.6"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={NEON_MARK_PATH} />
  </svg>
);

export const EmptyState = ({
  action,
  className,
  description,
  icon,
  size = "md",
  title,
  variant = "panel",
  ...props
}: EmptyStateProps) => (
  <div
    className={cn(
      "relative isolate flex flex-col items-center justify-center text-center",
      variant === "panel" && "rounded-lg border border-border/60 border-dashed",
      SIZE_PADDING[size],
      className
    )}
    data-slot="empty-state"
    data-variant={variant}
    {...props}
  >
    {variant === "panel" ? (
      <div
        aria-hidden="true"
        className="-z-10 absolute inset-0 bg-[repeating-linear-gradient(-45deg,var(--border)_0_1px,transparent_1px_7px)] opacity-[0.18]"
      />
    ) : null}
    <span
      aria-hidden="true"
      className="mb-3 text-muted-foreground/70 [&_svg:not([class*='size-'])]:size-5"
      data-slot="empty-state-icon"
    >
      {icon ?? <FadedMark />}
    </span>
    <p className="text-balance font-medium text-foreground text-sm">{title}</p>
    {description ? (
      <p className="mt-1.5 max-w-xs text-pretty text-muted-foreground text-xs leading-5">
        {description}
      </p>
    ) : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);
