"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Streamdown } from "streamdown";

import { cn } from "@/lib/utils";

/** Milliseconds to hold the panel open after streaming ends. */
const AUTO_CLOSE_DELAY_MS = 1000;

const MS_PER_SECOND = 1000;

interface ReasoningContextValue {
  /** Elapsed thinking time in seconds; undefined while streaming. */
  duration: number | undefined;
  isStreaming: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

/** Read the surrounding Reasoning state from a child component. */
export const useReasoning = (): ReasoningContextValue => {
  const context = useContext(ReasoningContext);

  if (!context) {
    throw new Error("useReasoning must be used inside <Reasoning>");
  }

  return context;
};

export type ReasoningProps = Omit<
  Collapsible.Root.Props,
  "defaultOpen" | "onOpenChange" | "open"
> & {
  /**
   * The reasoning is streaming right now: the panel auto-opens, the
   * trigger shimmers "Thinking…", and the clock runs. When it flips
   * back off the panel folds to a "Thought for Ns" receipt — unless
   * the reader toggled it themselves, in which case their choice wins.
   */
  isStreaming?: boolean;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Thinking time in seconds; measured from `isStreaming` when omitted. */
  duration?: number;
};

/* ─────────────────────────────────────────────────────
 * The model's thinking, in the house log-line vocabulary:
 * a rail-indented fold that opens itself while the model
 * thinks and settles to a one-line receipt when it stops.
 * The reader's toggle always beats the automation.
 * Inspired by Reasoning from Vercel's AI SDK Elements
 * (elements.ai-sdk.dev), rebuilt on Base UI.
 * ─────────────────────────────────────────────────── */
export const Reasoning = ({
  children,
  className,
  defaultOpen = false,
  duration: durationProp,
  isStreaming = false,
  onOpenChange,
  open: openProp,
  ...props
}: ReasoningProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [trackedDuration, setTrackedDuration] = useState<number>();
  const startedAtRef = useRef<number | null>(null);
  const hasStreamedRef = useRef(false);
  const userToggledRef = useRef(false);

  const open = openProp ?? uncontrolledOpen;
  const duration = isStreaming ? undefined : (durationProp ?? trackedDuration);

  const setOpen = useCallback(
    (next: boolean) => {
      setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (isStreaming) {
      hasStreamedRef.current = true;
      startedAtRef.current ??= Date.now();

      if (!userToggledRef.current) {
        setUncontrolledOpen(true);
      }
      return;
    }

    if (startedAtRef.current !== null) {
      const elapsed = Date.now() - startedAtRef.current;
      setTrackedDuration(Math.max(1, Math.round(elapsed / MS_PER_SECOND)));
      startedAtRef.current = null;
    }

    // Fold only streams we opened ourselves — a static, defaultOpen
    // reasoning block must not close itself out from under the reader.
    if (hasStreamedRef.current && !userToggledRef.current) {
      const timeout = setTimeout(() => {
        setUncontrolledOpen(false);
      }, AUTO_CLOSE_DELAY_MS);
      return () => clearTimeout(timeout);
    }
  }, [isStreaming]);

  const contextValue = useMemo(
    () => ({ duration, isStreaming, open, setOpen }),
    [duration, isStreaming, open, setOpen]
  );

  return (
    <ReasoningContext.Provider value={contextValue}>
      <Collapsible.Root
        className={cn(
          "w-full min-w-0 border-border/60 border-l-2 pl-2.5",
          className
        )}
        data-slot="reasoning"
        data-streaming={isStreaming || undefined}
        onOpenChange={(next) => {
          userToggledRef.current = true;
          setOpen(next);
        }}
        open={open}
        {...props}
      >
        {children}
      </Collapsible.Root>
    </ReasoningContext.Provider>
  );
};

export type ReasoningTriggerProps = Collapsible.Trigger.Props;

/**
 * The fold's one-line handle: shimmering "Thinking…" while the model
 * streams, a quiet "Thought for Ns" receipt at rest. Pass children to
 * replace the label; the chevron stays.
 */
export const ReasoningTrigger = ({
  children,
  className,
  ...props
}: ReasoningTriggerProps) => {
  const { duration, isStreaming } = useReasoning();
  const label = duration === undefined ? "Thought" : `Thought for ${duration}s`;

  return (
    <Collapsible.Trigger
      className={cn(
        "group inline-flex items-center gap-1 py-0.5 text-muted-foreground text-xs transition-colors hover:text-foreground",
        className
      )}
      data-slot="reasoning-trigger"
      {...props}
    >
      <HugeiconsIcon
        aria-hidden
        className="size-3 transition-transform duration-200 group-data-[panel-open]:rotate-90 motion-reduce:transition-none"
        icon={ArrowRight01Icon}
        strokeWidth={2}
      />
      {children ??
        (isStreaming ? (
          <span className="shimmer shimmer-duration-2400">Thinking…</span>
        ) : (
          <span>{label}</span>
        ))}
    </Collapsible.Trigger>
  );
};

export type ReasoningContentProps = Omit<
  Collapsible.Panel.Props,
  "children"
> & {
  /** The reasoning text, rendered as markdown. */
  children: string;
};

/** The thinking itself: dimmed markdown that unfolds under the trigger. */
export const ReasoningContent = ({
  children,
  className,
  ...props
}: ReasoningContentProps) => (
  <Collapsible.Panel
    className={cn(
      "h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none",
      className
    )}
    data-slot="reasoning-content"
    {...props}
  >
    <div
      className={cn(
        "pt-1 pb-0.5 text-muted-foreground text-sm leading-relaxed",
        "[&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold",
        "[&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_p+p]:mt-2"
      )}
    >
      <Streamdown>{children}</Streamdown>
    </div>
  </Collapsible.Panel>
);
