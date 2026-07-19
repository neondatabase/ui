"use client";

import type { ComponentProps, ReactNode } from "react";

import { EmptyState } from "@/components/empty-state/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Checkpoint {
  /** Stable id the restore action reports. */
  id: string;
  /** Human label, e.g. "Added billing page". */
  label: string;
  /** Display-ready timestamp, e.g. "2m ago". */
  createdAt: string;
  /** Short git sha, e.g. "f39ac2d". */
  sha?: string;
  /** Whether a database snapshot rides with this checkpoint. */
  snapshot?: boolean;
  /** Tenant Neon project id, e.g. "damp-forest-123456". */
  projectId?: string;
}

export type CheckpointTimelineProps = Omit<
  ComponentProps<"div">,
  "children"
> & {
  /** Newest first — the top row reads as "now". */
  checkpoints: Checkpoint[];
  /** Renders the restore action on every row. */
  onRestore?: (id: string) => void;
  /** The checkpoint currently restoring; locks every other action. */
  restoringId?: string | null;
  /** Override the built-in empty state. */
  empty?: ReactNode;
};

/* ─────────────────────────────────────────────────────────
 * TIMELINE STORYBOARD
 *
 *  entrance  rows rise 8px one at a time, 60ms apart —
 *            history introduces itself newest first
 *  rest      one continuous hairline rail threads square
 *            markers (the StatusBadge vocabulary); the
 *            newest holds primary and wears a mono
 *            "current" tag, the past stays muted; each row
 *            speaks twice — label + timestamp, then one
 *            quiet mono line: sha · ■ snapshot · project
 *  engage    hovering or focusing a row wakes its restore
 *            action — it slides out from behind the row
 *            (8px, 200ms ease-out) as it fades in; the
 *            space is always reserved, the row itself
 *            never moves
 *  restore   the acting row holds: its marker breathes
 *            primary and the action shimmers "Restoring…";
 *            the rest of history recedes to half voice
 *            until the flight lands
 *  empty     EmptyState holds the space — history hasn't
 *            started, it isn't missing
 * ───────────────────────────────────────────────────────── */
const ROW_STAGGER_MS = 60;

/* Restore action visibility, one state at a time:
 * hidden (slid 8px behind the row) → revealed on row hover/focus →
 * held visible while restoring → fully absent while another row acts. */
const ACTION_BASE =
  "h-6 shrink-0 rounded-full border border-border/60 px-2.5 font-mono text-muted-foreground text-xs transition-[opacity,translate,color,border-color] duration-200 ease-out hover:border-border hover:bg-transparent hover:text-foreground active:scale-[0.98] motion-reduce:translate-x-0 motion-reduce:transition-none";
const ACTION_HIDDEN =
  "-translate-x-2 opacity-0 focus-visible:translate-x-0 focus-visible:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100 group-hover:translate-x-0 group-hover:opacity-100";
const ACTION_RESTORING = "translate-x-0 opacity-100";
const ACTION_LOCKED = "disabled:opacity-0";

const actionClasses = (isRestoring: boolean, locked: boolean) => {
  if (isRestoring) {
    return cn(ACTION_BASE, ACTION_RESTORING);
  }
  if (locked) {
    return cn(ACTION_BASE, ACTION_LOCKED);
  }

  return cn(ACTION_BASE, ACTION_HIDDEN);
};

const RISE =
  "fill-mode-backwards fade-in-0 slide-in-from-bottom-2 animate-in duration-500 motion-reduce:animate-none";

/** One quiet mono meta line: sha · ■ snapshot · project id. */
const MetaLine = ({ checkpoint }: { checkpoint: Checkpoint }) => {
  const parts: { key: string; node: ReactNode }[] = [];

  if (checkpoint.sha) {
    parts.push({ key: "sha", node: checkpoint.sha });
  }

  if (checkpoint.snapshot) {
    parts.push({
      key: "snapshot",
      node: (
        <span className="inline-flex items-center gap-1">
          <span aria-hidden="true" className="size-1 bg-primary" />
          snapshot
        </span>
      ),
    });
  }

  if (checkpoint.projectId) {
    parts.push({
      key: "project",
      node: <span className="truncate">{checkpoint.projectId}</span>,
    });
  }

  if (parts.length === 0) {
    return null;
  }

  return (
    <p className="flex min-w-0 items-center gap-2 font-mono text-[10px] text-muted-foreground/70">
      {parts.map((part, index) => (
        <span className="flex min-w-0 items-center gap-2" key={part.key}>
          {index > 0 ? <span aria-hidden="true">·</span> : null}
          {part.node}
        </span>
      ))}
    </p>
  );
};

const CheckpointRow = ({
  checkpoint,
  index,
  isLatest,
  isRestoring,
  locked,
  onRestore,
}: {
  checkpoint: Checkpoint;
  index: number;
  isLatest: boolean;
  isRestoring: boolean;
  locked: boolean;
  onRestore?: (id: string) => void;
}) => (
  <li
    className={cn(
      "group relative flex items-start gap-3 pb-7 pl-6 transition-opacity duration-300 last:pb-0",
      locked && "opacity-50",
      RISE
    )}
    data-restoring={isRestoring || undefined}
    data-slot="checkpoint-row"
    style={{ animationDelay: `${index * ROW_STAGGER_MS}ms` }}
  >
    {/* The marker, punched on the continuous rail. */}
    <span
      aria-hidden="true"
      className={cn(
        "absolute top-[7px] left-[-2.5px] size-1.5 transition-colors duration-300",
        isLatest ? "bg-primary" : "bg-muted-foreground/50",
        isRestoring &&
          "neon-status-breathe bg-primary text-primary motion-reduce:animate-none"
      )}
      data-slot="checkpoint-marker"
    />

    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-baseline gap-2.5">
        <p
          className={cn(
            "truncate font-medium text-sm transition-colors duration-200",
            isLatest || isRestoring
              ? "text-foreground"
              : "text-foreground/80 group-focus-within:text-foreground group-hover:text-foreground"
          )}
        >
          {checkpoint.label}
        </p>
        {isLatest ? (
          <span className="shrink-0 font-mono text-[10px] text-primary">
            current
          </span>
        ) : null}
        <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground/70">
          {checkpoint.createdAt}
        </span>
      </div>
      <MetaLine checkpoint={checkpoint} />
    </div>

    {onRestore ? (
      <Button
        className={actionClasses(isRestoring, locked)}
        disabled={locked}
        onClick={() => onRestore(checkpoint.id)}
        size="sm"
        variant="ghost"
      >
        {/* The shimmer needs a muted base (it can only brighten) and
            its own span (animate-in owns the animation shorthand). */}
        <span
          className="fade-in-0 animate-in duration-300"
          key={String(isRestoring)}
        >
          <span
            className={cn("block", {
              "shimmer shimmer-duration-2400": isRestoring,
            })}
          >
            {isRestoring ? "Restoring…" : "Restore"}
          </span>
        </span>
      </Button>
    ) : null}
  </li>
);

export const CheckpointTimeline = ({
  checkpoints,
  className,
  empty,
  onRestore,
  restoringId = null,
  ...props
}: CheckpointTimelineProps) => (
  <div
    className={cn("w-full", className)}
    data-slot="checkpoint-timeline"
    {...props}
  >
    {checkpoints.length === 0 ? (
      (empty ?? (
        <EmptyState
          description="Checkpoints capture your app and database together as the agent works."
          title="No checkpoints yet"
        />
      ))
    ) : (
      <ol className="relative flex flex-col">
        {/* One continuous rail behind every marker. */}
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-3 left-0 w-px bg-border/60"
        />
        {checkpoints.map((checkpoint, index) => (
          <CheckpointRow
            checkpoint={checkpoint}
            index={index}
            isLatest={index === 0}
            isRestoring={restoringId === checkpoint.id}
            key={checkpoint.id}
            locked={restoringId !== null && restoringId !== checkpoint.id}
            onRestore={onRestore}
          />
        ))}
      </ol>
    )}
  </div>
);
