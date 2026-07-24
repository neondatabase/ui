"use client";

import {
  ArrowDown01Icon,
  Copy01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";

import { EmptyState } from "@/components/empty-state/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** The event's outcome, drawn from the house status vocabulary. */
export type ActivityStatus = "success" | "error" | "pending" | "info";

export interface ActivityEntry {
  id: string;
  status: ActivityStatus;
  /** One-line summary, e.g. "Provisioned production database". */
  title: string;
  /** Display-ready relative time, e.g. "2m ago". */
  timestamp: string;
  /** Who or what caused it, e.g. "agent" or a user name. */
  source?: string;
  /** Expandable long detail: an error message, request id, or result. */
  detail?: string;
  /** When set, renders an action (e.g. "Retry") that fires onAction. */
  actionLabel?: string;
}

/* Marker color per status; alive states breathe on the shared cadence. */
const MARKER: Record<ActivityStatus, string> = {
  error: "bg-destructive",
  info: "bg-muted-foreground/50",
  pending:
    "neon-status-breathe bg-current text-[var(--status-scaling)] motion-reduce:animate-none",
  success: "bg-primary",
};

const ROW_STAGGER_MS = 60;
const COPY_FLASH_MS = 1500;

/** Copies the detail text; the icon flashes a primary check. */
const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPY_FLASH_MS);

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard unavailable; the check still flashes.
    }
  };

  return (
    <button
      aria-label={copied ? "Copied" : "Copy details"}
      className="absolute top-1 right-1 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground/50 outline-none transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      onClick={copy}
      type="button"
    >
      <HugeiconsIcon
        className={cn("size-3 transition-colors", copied && "text-primary")}
        icon={copied ? Tick02Icon : Copy01Icon}
        strokeWidth={2}
      />
    </button>
  );
};
const RISE =
  "fill-mode-backwards fade-in-0 slide-in-from-bottom-2 animate-in duration-500 motion-reduce:animate-none";

const ActivityRow = ({
  entry,
  index,
  onAction,
}: {
  entry: ActivityEntry;
  index: number;
  onAction?: (entry: ActivityEntry) => void;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <li
      className={cn(
        "group relative flex items-start gap-3 pb-6 pl-6 last:pb-0",
        RISE
      )}
      data-slot="activity-row"
      data-status={entry.status}
      style={{ animationDelay: `${index * ROW_STAGGER_MS}ms` }}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-[7px] left-[-2.5px] size-1.5 shrink-0",
          MARKER[entry.status]
        )}
        data-slot="activity-marker"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-2.5">
          <p
            className="truncate font-medium text-foreground text-sm"
            title={entry.title}
          >
            {entry.title}
          </p>
          <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground/70 tabular-nums">
            {entry.timestamp}
          </span>
        </div>

        {entry.source ? (
          <p className="font-mono text-[10px] text-muted-foreground/70">
            {entry.source}
          </p>
        ) : null}

        {entry.detail ? (
          <div className="mt-0.5">
            <button
              aria-expanded={expanded}
              className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground/70 outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
              onClick={() => setExpanded((current) => !current)}
              type="button"
            >
              <HugeiconsIcon
                className={cn(
                  "size-3 transition-transform duration-200",
                  expanded && "rotate-180"
                )}
                icon={ArrowDown01Icon}
                strokeWidth={2}
              />
              {expanded ? "Hide details" : "Details"}
            </button>
            {expanded ? (
              <div className="fade-in-0 slide-in-from-top-1 relative mt-1.5 animate-in rounded-md border border-border/60 bg-background duration-200 motion-reduce:animate-none">
                <CopyButton value={entry.detail} />
                <div className="max-h-44 overflow-auto whitespace-pre-wrap p-2.5 pr-9 font-mono text-[10px] text-muted-foreground leading-relaxed">
                  {entry.detail}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {entry.actionLabel && onAction ? (
          <div className="mt-0.5">
            <Button
              className="h-6 rounded-full border border-border/60 px-2.5 text-muted-foreground text-xs transition-colors hover:border-border hover:bg-transparent hover:text-foreground active:scale-[0.98]"
              onClick={() => onAction(entry)}
              size="sm"
              variant="ghost"
            >
              {entry.actionLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </li>
  );
};

export type ActivityFeedProps = Omit<ComponentProps<"div">, "children"> & {
  /** Events, newest first. The top row reads as "now". */
  entries: ActivityEntry[];
  /** Card title. */
  label?: string;
  /** Fires when an entry's action is used. */
  onAction?: (entry: ActivityEntry) => void;
  /** Override the built-in empty state. */
  empty?: ReactNode;
  isLoading?: boolean;
  error?: Error | string | null;
};

const cardClassName =
  "flex w-full min-w-0 flex-col rounded-lg border border-border/60 bg-card p-4 shadow-none ring-0";

const Header = ({ label, count }: { label: string; count?: number }) => (
  <div className="flex items-center justify-between gap-3">
    <p className="font-medium text-foreground text-sm">{label}</p>
    {count === undefined ? null : (
      <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
        {count}
      </span>
    )}
  </div>
);

export const ActivityFeed = ({
  entries,
  label = "Activity",
  onAction,
  empty,
  isLoading = false,
  error = null,
  className,
  ...props
}: ActivityFeedProps) => {
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        className={cn(cardClassName, className)}
        data-slot="activity-feed"
        {...props}
      >
        <Header label={label} />
        <div className="mt-4 space-y-4">
          <Skeleton aria-hidden="true" className="h-8 w-full" />
          <Skeleton aria-hidden="true" className="h-8 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    const message = typeof error === "string" ? error : error.message;

    return (
      <div
        className={cn(cardClassName, className)}
        data-slot="activity-feed"
        role="alert"
        {...props}
      >
        <Header label={label} />
        <p className="mt-3 flex items-baseline gap-2 text-sm">
          <span className="font-mono text-destructive text-xs">error</span>
          <span className="text-foreground">{message}</span>
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(cardClassName, className)}
      data-slot="activity-feed"
      {...props}
    >
      <Header count={entries.length} label={label} />

      {entries.length === 0 ? (
        <div className="mt-3">
          {empty ?? (
            <EmptyState
              description="System events land here as your app provisions, transfers, and runs."
              title="No activity yet"
            />
          )}
        </div>
      ) : (
        <ol className="relative mt-4 flex flex-col">
          <span
            aria-hidden="true"
            className="absolute top-2 bottom-3 left-0 w-px bg-border"
          />
          {entries.map((entry, index) => (
            <ActivityRow
              entry={entry}
              index={index}
              key={entry.id}
              onAction={onAction}
            />
          ))}
        </ol>
      )}
    </div>
  );
};
