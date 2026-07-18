"use client";

import type { KeyboardEvent } from "react";

import { ModelSelect } from "@/components/model-select/model-select";
import type {
  ModelSelectProps,
  ModelSelectSize,
} from "@/components/model-select/model-select";
import { ThinkingSelect } from "@/components/thinking-select/thinking-select";
import type { ThinkingEffort } from "@/components/thinking-select/thinking-select";
import { cn } from "@/lib/utils";

export type ThinkingModelSelectProps = Omit<
  ModelSelectProps,
  "footer" | "onPopupKeyDown" | "valueSuffix"
> & {
  /** Controlled reasoning effort. */
  effort: ThinkingEffort;
  /** Called with the newly selected reasoning effort. */
  onEffortChange: (effort: ThinkingEffort) => void;
};

/* ─────────────────────────────────────────────────────────
 * COMPOSITION STORYBOARD
 *
 * ModelSelect provides the trigger, search, and list; this
 * component pins a ThinkingSelect footer under the list and
 * echoes the current effort in the trigger. Tab cycles the
 * effort while the popup is open. The footer disappears for
 * models that cannot reason.
 * ───────────────────────────────────────────────────────── */
const EFFORT_CYCLE: ThinkingEffort[] = [
  "off",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
];

const EFFORT_SHORT: Record<ThinkingEffort, string> = {
  high: "high",
  low: "low",
  max: "max",
  medium: "med",
  off: "off",
  xhigh: "xhigh",
};

/** Tiny effort readout for the trigger: off, low, med, high, xhigh, max. */
const EffortReadout = ({ effort }: { effort: ThinkingEffort }) => (
  <span
    aria-hidden="true"
    className={cn(
      "ml-0.5 w-[5ch] shrink-0 font-mono text-[10px] leading-none",
      effort === "off" ? "text-muted-foreground/70" : "text-primary"
    )}
  >
    {EFFORT_SHORT[effort]}
  </span>
);

const FOOTER_SLIDER_SIZE: Record<ModelSelectSize, "sm" | "md" | "lg"> = {
  lg: "md",
  md: "sm",
  sm: "sm",
};

export const ThinkingModelSelect = ({
  defaultValue,
  effort,
  models,
  onEffortChange,
  size = "md",
  value,
  ...props
}: ThinkingModelSelectProps) => {
  const selected = models.find((model) => model.id === (value ?? defaultValue));
  const showThinking = selected?.reasoning !== false;

  const cycleEffort = () => {
    const index = EFFORT_CYCLE.indexOf(effort);
    const next = EFFORT_CYCLE[(index + 1) % EFFORT_CYCLE.length];

    if (next) {
      onEffortChange(next);
    }
  };

  const handlePopupKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Tab" && showThinking) {
      event.preventDefault();
      event.stopPropagation();
      cycleEffort();
    }
  };

  return (
    <ModelSelect
      defaultValue={defaultValue}
      footer={
        showThinking ? (
          <div
            className="flex items-center gap-2 bg-muted/15 p-1"
            onKeyDown={(event) => {
              if (event.key === "Tab") {
                return;
              }
              event.stopPropagation();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            role="presentation"
          >
            <ThinkingSelect
              className="min-w-0 flex-1"
              onValueChange={onEffortChange}
              size={FOOTER_SLIDER_SIZE[size]}
              value={effort}
            />
            <kbd className="mr-1 shrink-0 border border-border/40 px-1 py-px font-mono text-[9px] text-muted-foreground/60 lowercase">
              tab
            </kbd>
          </div>
        ) : undefined
      }
      models={models}
      onPopupKeyDown={handlePopupKeyDown}
      size={size}
      value={value}
      valueSuffix={showThinking ? <EffortReadout effort={effort} /> : undefined}
      {...props}
    />
  );
};
