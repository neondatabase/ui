"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps, ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ChainOfThoughtProps = Collapsible.Root.Props;

/* ─────────────────────────────────────────────────────
 * Discrete, labeled reasoning steps — searches, tool
 * calls, drafts — folded behind the house log-line rail.
 * Reasoning is for one continuous thinking stream; this
 * is for steps the reader can scan one by one.
 * Inspired by Chain of Thought from Vercel's AI SDK
 * Elements (elements.ai-sdk.dev), rebuilt on Base UI.
 * ─────────────────────────────────────────────────── */
export const ChainOfThought = ({
  className,
  ...props
}: ChainOfThoughtProps) => (
  <Collapsible.Root
    className={cn(
      "w-full min-w-0 border-border/60 border-l-2 pl-2.5",
      className
    )}
    data-slot="chain-of-thought"
    {...props}
  />
);

export type ChainOfThoughtHeaderProps = Collapsible.Trigger.Props;

/** The fold's handle. Defaults to "Chain of thought"; children replace it. */
export const ChainOfThoughtHeader = ({
  children,
  className,
  ...props
}: ChainOfThoughtHeaderProps) => (
  <Collapsible.Trigger
    className={cn(
      "group inline-flex items-center gap-1 py-0.5 text-muted-foreground text-xs transition-colors hover:text-foreground",
      className
    )}
    data-slot="chain-of-thought-header"
    {...props}
  >
    <HugeiconsIcon
      aria-hidden
      className="size-3 transition-transform duration-200 group-data-[panel-open]:rotate-90 motion-reduce:transition-none"
      icon={ArrowRight01Icon}
      strokeWidth={2}
    />
    {children ?? <span>Chain of thought</span>}
  </Collapsible.Trigger>
);

export type ChainOfThoughtContentProps = Collapsible.Panel.Props;

/** The unfolding step list. Children are `ChainOfThoughtStep` items. */
export const ChainOfThoughtContent = ({
  children,
  className,
  ...props
}: ChainOfThoughtContentProps) => (
  <Collapsible.Panel
    className={cn(
      "h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none",
      className
    )}
    data-slot="chain-of-thought-content"
    {...props}
  >
    <ol className="flex flex-col pt-1.5">{children}</ol>
  </Collapsible.Panel>
);

export type ChainOfThoughtStepStatus = "complete" | "active" | "pending";

const STEP_LABEL_CLASS: Record<ChainOfThoughtStepStatus, string> = {
  active: "text-foreground",
  complete: "text-muted-foreground",
  pending: "text-muted-foreground/50",
};

const STEP_GLYPH_CLASS: Record<ChainOfThoughtStepStatus, string> = {
  active: "text-primary",
  complete: "text-muted-foreground/60",
  pending: "text-muted-foreground/40",
};

export type ChainOfThoughtStepProps = Omit<ComponentProps<"li">, "children"> & {
  /** Replaces the default square status dot, e.g. a small icon. */
  icon?: ReactNode;
  /** The step headline, shimmering while the step is active. */
  label: ReactNode;
  /** Dimmed detail line under the label. */
  description?: ReactNode;
  status?: ChainOfThoughtStepStatus;
  /** Extra content under the step, e.g. `ChainOfThoughtSearchResults`. */
  children?: ReactNode;
};

/**
 * One reasoning step on a connected vertical rail. The active step's
 * label shimmers and its dot breathes; pending steps wait dimmed.
 */
export const ChainOfThoughtStep = ({
  children,
  className,
  description,
  icon,
  label,
  status = "complete",
  ...props
}: ChainOfThoughtStepProps) => (
  <li
    aria-current={status === "active" ? "step" : undefined}
    className={cn(
      "relative flex gap-2.5 pb-3 last:pb-0.5",
      "before:absolute before:top-[18px] before:bottom-0 before:left-[5.5px] before:w-px before:bg-border/60 last:before:hidden",
      className
    )}
    data-slot="chain-of-thought-step"
    data-status={status}
    {...props}
  >
    <span
      aria-hidden="true"
      className={cn(
        "flex size-3 shrink-0 translate-y-[5px] items-center justify-center [&_svg]:size-3",
        STEP_GLYPH_CLASS[status]
      )}
    >
      {icon ?? (
        <span
          className={cn(
            "size-1.5 bg-current",
            status === "active" && "neon-status-breathe"
          )}
        />
      )}
    </span>
    <div className="min-w-0 flex-1">
      <div className={cn("text-sm", STEP_LABEL_CLASS[status])}>
        {status === "active" ? (
          <span className="shimmer shimmer-duration-2400">{label}</span>
        ) : (
          label
        )}
      </div>
      {description ? (
        <div className="text-muted-foreground/70 text-xs">{description}</div>
      ) : null}
      {children}
    </div>
  </li>
);

export type ChainOfThoughtSearchResultsProps = ComponentProps<"div">;

/** A wrapping row of `ChainOfThoughtSearchResult` chips under a step. */
export const ChainOfThoughtSearchResults = ({
  className,
  ...props
}: ChainOfThoughtSearchResultsProps) => (
  <div
    className={cn("flex flex-wrap gap-1.5 pt-1.5", className)}
    data-slot="chain-of-thought-search-results"
    {...props}
  />
);

export type ChainOfThoughtSearchResultProps = ComponentProps<typeof Badge>;

/**
 * One search hit as a quiet outline chip. Pass `render` (Base UI) to
 * make it a link.
 */
export const ChainOfThoughtSearchResult = ({
  className,
  ...props
}: ChainOfThoughtSearchResultProps) => (
  <Badge
    className={cn("font-mono font-normal text-muted-foreground", className)}
    data-slot="chain-of-thought-search-result"
    variant="outline"
    {...props}
  />
);

export type ChainOfThoughtImageProps = Omit<
  ComponentProps<"figure">,
  "children"
> & {
  /** The visual itself, e.g. an `<img>`. */
  children: ReactNode;
  /** Dimmed caption under the visual. */
  caption?: string;
};

/** A framed visual a step produced, with an optional caption. */
export const ChainOfThoughtImage = ({
  caption,
  children,
  className,
  ...props
}: ChainOfThoughtImageProps) => (
  <figure
    className={cn(
      "mt-1.5 w-fit max-w-full overflow-hidden border border-border/60",
      className
    )}
    data-slot="chain-of-thought-image"
    {...props}
  >
    {children}
    {caption ? (
      <figcaption className="border-border/60 border-t px-2 py-1.5 text-muted-foreground text-xs">
        {caption}
      </figcaption>
    ) : null}
  </figure>
);
