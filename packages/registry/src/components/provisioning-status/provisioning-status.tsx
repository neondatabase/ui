"use client";

import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";

import { AnimatedWash } from "@/components/animated-wash/animated-wash";
import { NeonLoader } from "@/components/neon-loader/neon-loader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProvisioningState = "provisioning" | "waking" | "error";

export type ProvisioningStatusProps = Omit<
  ComponentProps<"div">,
  "title" | "children"
> & {
  /** Lifecycle state the panel narrates. */
  state?: ProvisioningState;
  /** Override the state's default headline. */
  title?: string;
  /**
   * The status detail line, e.g. "Creating Neon project…". Swapping it
   * crossfades in place — feed it live progress from your API.
   */
  detail?: string;
  /** Renders the retry action in the error state. */
  onRetry?: () => void;
  /** Label for the retry action. */
  retryLabel?: string;
  /**
   * "panel" draws the house surface; "bare" renders naked for
   * embedding inside an already-bordered pane.
   */
  variant?: "panel" | "bare";
  /** Vertical breathing room. */
  size?: "sm" | "md" | "lg";
  /** Extra content under the detail line, e.g. a cancel link. */
  footer?: ReactNode;
};

/* ─────────────────────────────────────────────────────────
 * PANEL STORYBOARD
 *
 * One quiet stage, three acts. The frame and rhythm never
 * change between states — only the voice does.
 *
 *  provisioning  the NeonLoader resolves out of grain, the
 *                headline holds foreground, and the detail
 *                line shimmers; swap `detail` as your API
 *                reports progress and the old step rolls
 *                out the top as the new one rises in
 *                (300ms, same row, zero shift)
 *  waking        identical staging, wake copy — the
 *                sandbox exists, it's just cold
 *  ambience      the AnimatedWash breathes under
 *                everything at low intensity — primary
 *                green while working, destructive and
 *                dimmer for the error act (the panel
 *                cools, it doesn't shout); always well
 *                below the loader's grain
 *  error         the loader yields to the mono error tag +
 *                foreground sentence, the detail cools to
 *                muted, and a retry action appears where
 *                the shimmer was
 * ───────────────────────────────────────────────────────── */
const COPY: Record<ProvisioningState, { title: string; detail: string }> = {
  error: {
    detail: "The last attempt didn't complete.",
    title: "Something went wrong",
  },
  provisioning: {
    detail: "Creating Neon project…",
    title: "Provisioning your app",
  },
  waking: {
    detail: "Restoring compute…",
    title: "Waking sandbox",
  },
};

const SIZE_PADDING: Record<
  NonNullable<ProvisioningStatusProps["size"]>,
  string
> = {
  lg: "px-8 py-20",
  md: "px-6 py-14",
  sm: "px-4 py-8",
};

export const ProvisioningStatus = ({
  className,
  detail,
  footer,
  onRetry,
  retryLabel = "Try again",
  size = "md",
  state = "provisioning",
  title,
  variant = "panel",
  ...props
}: ProvisioningStatusProps) => {
  const copy = COPY[state];
  const heading = title ?? copy.title;
  const line = detail ?? copy.detail;
  const failed = state === "error";
  // Remember the outgoing line so it can roll out while the new one
  // rolls in.
  const [roll, setRoll] = useState<{
    current: string;
    previous: string | null;
  }>({ current: line, previous: null });

  if (roll.current !== line) {
    setRoll({ current: line, previous: roll.current });
  }

  const { previous } = roll;

  return (
    <div
      className={cn(
        "relative isolate flex flex-col items-center justify-center gap-4 overflow-hidden text-center",
        variant === "panel" && "rounded-lg border border-border/60 bg-card",
        SIZE_PADDING[size],
        className
      )}
      data-slot="provisioning-status"
      data-state={state}
      {...props}
    >
      {/* Same wash grammar as AppCard's shader slot: default shader at
          native intensity, status tint, bottom band. Only the error act
          dims it — the panel cools, it doesn't shout. */}
      <AnimatedWash
        aria-hidden="true"
        className={cn(
          "-z-10 pointer-events-none absolute inset-x-0 bottom-0 h-32",
          failed ? "text-destructive opacity-50" : "text-primary"
        )}
        data-slot="provisioning-status-wash"
        key={state}
      />
      {failed ? (
        <p
          className="fade-in-0 flex animate-in items-baseline gap-2 text-sm duration-300 motion-reduce:animate-none"
          role="alert"
        >
          <span className="font-mono text-destructive text-xs">error</span>
          <span className="font-medium text-foreground">{heading}</span>
        </p>
      ) : (
        <>
          <NeonLoader decorative size="md" />
          <p
            className="fade-in-0 animate-in font-medium text-foreground text-sm duration-300 motion-reduce:animate-none"
            key={heading}
          >
            {heading}
          </p>
        </>
      )}
      {/* The detail roll: old step exits up, new step rises in —
          both live in one grid cell so the row never moves. */}
      <p
        aria-live="polite"
        className="grid text-muted-foreground"
        data-slot="provisioning-status-detail"
      >
        {previous ? (
          <span
            aria-hidden="true"
            className="fade-out-0 slide-out-to-top-3 col-start-1 row-start-1 animate-out fill-mode-forwards font-mono text-xs duration-200 ease-in motion-reduce:animate-none"
            key={`out-${previous}`}
          >
            {previous}
          </span>
        ) : null}
        <span
          className="fade-in-0 slide-in-from-bottom-3 col-start-1 row-start-1 animate-in font-mono text-xs duration-300 motion-reduce:animate-none"
          key={line}
        >
          <span
            className={cn("block", !failed && "shimmer shimmer-duration-2400")}
          >
            {line}
          </span>
        </span>
      </p>
      {failed && onRetry ? (
        <Button
          className="mt-1 active:scale-[0.98]"
          onClick={onRetry}
          size="sm"
          variant="outline"
        >
          {retryLabel}
        </Button>
      ) : null}
      {footer}
    </div>
  );
};
