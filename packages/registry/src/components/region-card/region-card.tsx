"use client";

import { CpuIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/* Ping color coding: green under 80 ms, amber under 180, red past that. */
const PING_FAST_MS = 80;
const PING_OK_MS = 180;

export const pingTone = (ping: number) => {
  if (ping < PING_FAST_MS) {
    return "text-primary";
  }

  return ping < PING_OK_MS ? "text-amber-500" : "text-destructive";
};

export type RegionCardProps = Omit<ComponentProps<"div">, "children"> & {
  /** Display name, e.g. "AWS Europe Central 1 (Frankfurt)". */
  title: string;
  /** Mono region id, e.g. "aws-eu-central-1". */
  regionId: string;
  /** Measured round-trip in ms; renders color-coded when present. */
  ping?: number | null;
  /** Uppercase kicker above the title. */
  label?: string;
  /** Leading icon; defaults to the CPU mark. */
  icon?: ReactNode;
  /** Trailing content, e.g. a status badge. */
  children?: ReactNode;
};

/**
 * The floating server-info chip: kicker, region name, and a mono
 * id line with a color-coded ping. Position it via className —
 * it ships unpositioned so maps, globes, and lists can anchor it
 * however they need.
 */
export const RegionCard = ({
  children,
  className,
  icon,
  label = "Region",
  ping,
  regionId,
  title,
  ...props
}: RegionCardProps) => (
  <div
    className={cn(
      "flex animate-in items-center gap-2.5 rounded-lg border border-primary/40 bg-popover/90 py-2 pr-3 pl-2.5 fade-in-0 backdrop-blur-sm duration-200 motion-reduce:animate-none",
      className
    )}
    data-slot="region-card"
    {...props}
  >
    {icon ?? (
      <HugeiconsIcon
        aria-hidden="true"
        icon={CpuIcon}
        strokeWidth={2}
        className="size-4 shrink-0 text-muted-foreground"
      />
    )}
    <div className="min-w-0">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="truncate font-medium text-foreground text-sm">{title}</p>
      <p className="truncate font-mono text-[10px] text-muted-foreground/70">
        {regionId}
        {typeof ping === "number" ? (
          <>
            {" · "}
            <span className={pingTone(ping)}>ping: {ping} ms</span>
          </>
        ) : null}
      </p>
    </div>
    {children}
  </div>
);
