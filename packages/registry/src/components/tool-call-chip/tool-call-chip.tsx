"use client";

import {
  Cancel01Icon,
  Loading03Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type ToolCallState = "running" | "done" | "error";

export type ToolCallChipProps = Omit<ComponentProps<"span">, "children"> & {
  /** Tool name, shown in mono, e.g. "writeFile". */
  name: string;
  /** Lifecycle state of the invocation. */
  state?: ToolCallState;
  /** What the tool touched, e.g. a file path or command. */
  detail?: string;
};

/* ─────────────────────────────────────────────────────────
 * A quiet log line, not a badge: a tiny status glyph, the
 * tool name in mono, and the target dimmed after it. No
 * border, no fill — the states speak through the glyph:
 * spinner while running, a small green check when done, a
 * red cross on error. Color only ever touches the glyph.
 * ───────────────────────────────────────────────────────── */
const STATE_ICON: Record<ToolCallState, typeof Tick02Icon> = {
  done: Tick02Icon,
  error: Cancel01Icon,
  running: Loading03Icon,
};

export const ToolCallChip = ({
  className,
  detail,
  name,
  state = "done",
  ...props
}: ToolCallChipProps) => {
  const Icon = STATE_ICON[state];

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 py-0.5 font-mono text-muted-foreground text-xs",
        className
      )}
      data-slot="tool-call-chip"
      data-state={state}
      {...props}
    >
      <HugeiconsIcon
        aria-hidden="true"
        icon={Icon}
        strokeWidth={2}
        className={cn(
          "size-3 shrink-0",
          state === "running" && "animate-spin text-muted-foreground/70",
          state === "done" && "text-primary",
          state === "error" && "text-destructive"
        )}
      />
      <span className="shrink-0">{name}</span>
      {detail ? (
        <span
          className="min-w-0 truncate text-muted-foreground/50"
          title={detail}
        >
          {detail}
        </span>
      ) : null}
      <span className="sr-only">{state === "running" ? "running" : state}</span>
    </span>
  );
};
