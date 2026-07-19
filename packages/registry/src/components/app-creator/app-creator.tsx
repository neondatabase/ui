"use client";

import type { ComponentProps, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { AppPlan } from "@/components/status-badge/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AppCreatorProps = Omit<ComponentProps<"div">, "onSubmit"> & {
  /** Called with the prompt and plan when the user creates. */
  onCreate: (prompt: string, plan: AppPlan) => void;
  /** Show the in-flight state and lock the controls. */
  isCreating?: boolean;
  placeholder?: string;
  /**
   * Example prompts cycled through the placeholder with a typewriter
   * rhythm while the field is empty. Overrides `placeholder`.
   */
  placeholderPrompts?: string[];
  /** Uncontrolled initial plan. */
  defaultPlan?: AppPlan;
  /** Label for the create action. */
  actionLabel?: string;
  disabled?: boolean;
};

/* ─────────────────────────────────────────────────────────
 * The "describe an app" bar: one bordered surface whose
 * border warms neutrally while you type (color belongs to
 * the CTA and caret, never the frame). The prompt is an
 * auto-growing textarea; the foot holds a quiet free/paid
 * segment on the left and the create action on the right.
 * Enter creates (a quiet "press ⏎" hint appears once the
 * prompt is satisfied), Shift+Enter breaks a line. While
 * creating, everything locks and the CTA shimmers — the
 * prompt stays visible so the wait has context.
 * ───────────────────────────────────────────────────────── */
const PLANS: AppPlan[] = ["free", "paid"];

/* ─────────────────────────────────────────────────────────
 * PLACEHOLDER STORYBOARD — "the pitch"
 *
 * While the field is empty, example prompts type themselves
 * out character by character, hold, then erase — the bar
 * keeps pitching ideas until you have your own. Typing a
 * single character stops the show instantly. Static first
 * prompt under reduced motion.
 * ───────────────────────────────────────────────────────── */
const TYPE_MS = 34;
const ERASE_MS = 12;
const HOLD_MS = 2200;
const BREATH_MS = 600;
const CARET = "▍";

/** Cycles a typewriter placeholder through the given prompts. */
const useTypewriter = (prompts: string[] | undefined, active: boolean) => {
  const [text, setText] = useState(prompts?.[0] ?? "");

  useEffect(() => {
    if (!(prompts?.length && active)) {
      return;
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduced) {
      const timer = window.setTimeout(() => setText(prompts[0] ?? ""), 0);
      return () => window.clearTimeout(timer);
    }

    let index = 0;
    let length = 0;
    let erasing = false;
    let timer = 0;

    const tick = () => {
      const prompt = prompts[index % prompts.length] ?? "";

      if (erasing) {
        length -= 1;
        setText(prompt.slice(0, length) + CARET);

        if (length === 0) {
          erasing = false;
          index += 1;
          // A breath of empty field before the next pitch begins.
          timer = window.setTimeout(tick, BREATH_MS);
          return;
        }

        timer = window.setTimeout(tick, ERASE_MS);
        return;
      }

      length += 1;
      setText(prompt.slice(0, length) + CARET);

      if (length >= prompt.length) {
        erasing = true;
        timer = window.setTimeout(tick, HOLD_MS);
        return;
      }

      timer = window.setTimeout(tick, TYPE_MS);
    };

    timer = window.setTimeout(tick, 400);
    return () => window.clearTimeout(timer);
  }, [prompts, active]);

  return text;
};

/* ─────────────────────────────────────────────────────────
 * CTA STORYBOARD — "ignition"
 *
 *  empty      dormant ghost: hairline border, muted label
 *             with the same slow shimmer drifting across —
 *             the button breathes even before it's earned.
 *  satisfied  ignition: the button fills to neon on a
 *             300ms ramp, a soft primary glow blooms, and
 *             a slow shimmer sweep loops across the label —
 *             the moment the app becomes possible.
 *  hover      the glow leans brighter; color and shadow
 *             only, nothing moves.
 *  creating   "Creating…" under the continuous shimmer
 *             (the platform's working language); all
 *             motion stops under reduced motion.
 * ───────────────────────────────────────────────────────── */
const CTA_GLOW =
  "shadow-[0_0_20px_-6px_var(--primary)] hover:shadow-[0_0_30px_-6px_var(--primary)]";

/** The ignition CTA: ghost until earned, neon + glow + sweep after. */
const CreateAction = ({
  actionLabel,
  isCreating,
  locked,
  onCreate,
  state,
}: {
  actionLabel: string;
  isCreating: boolean;
  locked: boolean;
  onCreate: () => void;
  state: "off" | "ready" | "creating";
}) => (
  <Button
    className={cn(
      "relative overflow-hidden transition-[background-color,color,border-color,box-shadow] duration-300",
      state === "off"
        ? "disabled:border-border/60 disabled:bg-transparent disabled:text-muted-foreground disabled:opacity-100"
        : cn(CTA_GLOW, "disabled:opacity-100")
    )}
    disabled={locked || state === "off"}
    onClick={onCreate}
    size="sm"
  >
    <span className="shimmer shimmer-duration-2400 relative" key={state}>
      {isCreating ? "Creating…" : actionLabel}
    </span>
  </Button>
);

export const AppCreator = ({
  actionLabel = "Create app",
  className,
  defaultPlan = "free",
  disabled = false,
  isCreating = false,
  onCreate,
  placeholder = "Describe the app you want to build…",
  placeholderPrompts,
  ...props
}: AppCreatorProps) => {
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<AppPlan>(defaultPlan);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const locked = disabled || isCreating;
  const typed = useTypewriter(
    placeholderPrompts,
    prompt.length === 0 && !locked
  );
  const livePlaceholder = placeholderPrompts?.length ? typed : placeholder;

  const autoGrow = useCallback(() => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, []);

  const create = () => {
    const trimmed = prompt.trim();

    if (trimmed.length > 0 && !locked) {
      onCreate(trimmed, plan);
    }
  };

  const ctaState = (): "off" | "ready" | "creating" => {
    if (isCreating) {
      return "creating";
    }

    return prompt.trim().length > 0 ? "ready" : "off";
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      create();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-border/60 bg-card transition-colors focus-within:border-border hover:border-border",
        isCreating && "neon-submit-pulse",
        disabled && !isCreating && "opacity-80",
        className
      )}
      data-creating={isCreating || undefined}
      data-slot="app-creator"
      {...props}
    >
      <textarea
        aria-label="Describe the app you want to build"
        className="max-h-40 min-h-16 w-full resize-none bg-transparent p-3 text-sm caret-primary outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed"
        disabled={locked}
        onChange={(event) => {
          setPrompt(event.target.value);
          autoGrow();
        }}
        onKeyDown={handleKeyDown}
        placeholder={livePlaceholder}
        ref={textareaRef}
        rows={2}
        value={prompt}
      />
      <div className="flex items-center gap-1.5 border-border/40 border-t p-2">
        <fieldset
          className="relative isolate grid grid-cols-2 border border-border/60 p-0.5"
          data-slot="app-creator-plans"
          disabled={locked}
        >
          <legend className="sr-only">Plan</legend>
          <span
            aria-hidden="true"
            className={cn(
              "-z-10 absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] transition-[translate,background-color,border-color] duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)] motion-reduce:transition-none",
              plan === "paid"
                ? "translate-x-full border border-primary/40 bg-primary/10"
                : "border border-transparent bg-muted/40"
            )}
            data-slot="app-creator-plan-thumb"
          />
          {PLANS.map((option) => (
            <label
              className={cn(
                "cursor-pointer px-3 py-1 text-center font-mono text-xs transition-colors duration-200 focus-within:outline focus-within:outline-primary",
                locked && "cursor-not-allowed",
                plan === option && option === "paid" && "text-primary",
                plan === option && option === "free" && "text-foreground",
                plan !== option && "text-muted-foreground hover:text-foreground"
              )}
              key={option}
            >
              <input
                checked={plan === option}
                className="sr-only"
                name="app-creator-plan"
                onChange={() => setPlan(option)}
                type="radio"
                value={option}
              />
              {option}
            </label>
          ))}
        </fieldset>
        <span
          aria-hidden="true"
          className={cn(
            "ml-auto font-mono text-[10px] text-muted-foreground/60 transition-opacity duration-300",
            ctaState() === "ready" ? "opacity-100" : "opacity-0"
          )}
        >
          press ⏎
        </span>
        <CreateAction
          actionLabel={actionLabel}
          isCreating={isCreating}
          locked={locked}
          onCreate={create}
          state={ctaState()}
        />
      </div>
    </div>
  );
};
