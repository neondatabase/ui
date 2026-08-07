"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { domAnimation, LazyMotion, m } from "motion/react";
import type { ComponentProps, KeyboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import {
  Select,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface AiModel {
  /** Gateway model id in short form, e.g. "gpt-5-2" or "gemini-3-6-flash". */
  id: string;
  /** Human-readable name, e.g. "GPT-5.2". */
  name: string;
  /** Provider name used for grouping, e.g. "OpenAI". */
  provider: string;
  /** Whether the model supports extended reasoning (reasoning_effort). */
  reasoning?: boolean;
  /** Mark a model as not yet available; it renders dimmed and unselectable. */
  disabled?: boolean;
  /** Optional short capability tag, e.g. "fast" or "open". */
  tag?: string;
}

export type ModelSelectSize = "sm" | "md" | "lg";

export type ModelSelectProps = Omit<
  ComponentProps<typeof SelectTrigger>,
  "children" | "value" | "size"
> & {
  /** Models to choose from; grouped by provider in listed order. */
  models: AiModel[];
  /** Controlled selected model id. */
  value?: string;
  /** Uncontrolled initial model id. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: ReactNode;
  /** Trigger size: compact, default, or roomy. */
  size?: ModelSelectSize;
  /** Provider logos keyed by provider name. A provider missing from the map keeps its space so rows stay aligned; passing no map renders no marks and no space. */
  logos?: Record<string, ReactNode>;
  /** Model ids to hide from the list. */
  excludeModels?: string[];
  /**
   * Controlled usage only: when the current value is not in `models`
   * (e.g. a hardcoded default this gateway has not enabled), call
   * `onValueChange` with the first available model instead of sitting
   * on a placeholder.
   */
  fallbackToFirst?: boolean;
  /** Extra content rendered after the model name in the trigger. */
  valueSuffix?: ReactNode;
  /** Pinned footer rendered below the scrolling list inside the popup. */
  footer?: ReactNode;
  /** Runs before the popup's built-in key handling; preventDefault to claim a key. */
  onPopupKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  /** Mount the popup inside a specific element, e.g. a themed subtree. */
  portalContainer?: SelectPrimitive.Portal.Props["container"];
};

const TRIGGER_SIZE: Record<ModelSelectSize, string> = {
  lg: "h-10 gap-2 pl-3 text-sm",
  md: "h-8",
  sm: "h-7 gap-1 text-xs [&_[data-slot=model-select-logo]]:size-3.5",
};

const groupByProvider = (models: AiModel[]) => {
  const groups = new Map<string, AiModel[]>();

  for (const model of models) {
    const group = groups.get(model.provider) ?? [];
    group.push(model);
    groups.set(model.provider, group);
  }

  return [...groups.entries()];
};

/* ─────────────────────────────────────────────────────────
 * HIGHLIGHT STORYBOARD
 *
 * One shared background glides behind whichever model row is
 * highlighted (pointer or keyboard) on a snappy spring, with a
 * primary edge on its left. It fades out when nothing is
 * highlighted, so opening feels calm and browsing feels alive.
 * ───────────────────────────────────────────────────────── */
/** Snappy follow that settles quickly with no wobble. */
const GLIDE_SPRING = {
  damping: 38,
  stiffness: 520,
  type: "spring" as const,
};

const HighlightGlide = () => {
  const ref = useRef<HTMLSpanElement>(null);
  const [rect, setRect] = useState<{ height: number; top: number } | null>(
    null
  );

  useEffect(() => {
    const popup = ref.current?.closest('[data-slot="model-select-scroller"]');

    if (!(popup instanceof HTMLElement)) {
      return;
    }

    const update = (target: EventTarget | null) => {
      const item =
        target instanceof Element
          ? target.closest('[data-slot="select-item"]')
          : null;

      if (item instanceof HTMLElement) {
        setRect({ height: item.offsetHeight, top: item.offsetTop });
      }
    };

    const clear = (event: FocusEvent) => {
      if (
        !(
          event.relatedTarget instanceof Element &&
          popup.contains(event.relatedTarget)
        )
      ) {
        setRect(null);
      }
    };

    const handleFocusIn = (event: FocusEvent) => update(event.target);
    const handlePointerMove = (event: PointerEvent) => update(event.target);

    popup.addEventListener("focusin", handleFocusIn);
    popup.addEventListener("pointermove", handlePointerMove);
    popup.addEventListener("focusout", clear);

    return () => {
      popup.removeEventListener("focusin", handleFocusIn);
      popup.removeEventListener("pointermove", handlePointerMove);
      popup.removeEventListener("focusout", clear);
    };
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      <m.span
        animate={
          rect
            ? { height: rect.height, opacity: 1, top: rect.top }
            : { opacity: 0 }
        }
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-1 border-primary border-l-2 bg-accent"
        initial={false}
        ref={ref}
        transition={GLIDE_SPRING}
      />
    </LazyMotion>
  );
};

/** Centers the selected model in the scroller when the popup opens. */
const ScrollToSelected = () => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const scroller = ref.current?.closest(
      '[data-slot="model-select-scroller"]'
    );
    const selected = scroller?.querySelector("[data-selected]");

    if (scroller instanceof HTMLElement && selected instanceof HTMLElement) {
      scroller.scrollTop =
        selected.offsetTop -
        scroller.clientHeight / 2 +
        selected.offsetHeight / 2;
    }
  }, []);

  return <span hidden ref={ref} />;
};

/* ─────────────────────────────────────────────────────────
 * POPUP STORYBOARD
 *
 * Fixed search on top (focused on open), an optional pinned
 * footer on the bottom, and the model list scrolling between
 * them with a scroll-aware edge fade and a thin scrollbar.
 * Typing filters instantly; arrows still walk the list.
 * ───────────────────────────────────────────────────────── */
const SearchField = ({
  inputRef,
  onQueryChange,
  query,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onQueryChange: (query: string) => void;
  query: string;
}) => {
  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [inputRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && query) {
      event.stopPropagation();
      onQueryChange("");
      return;
    }

    // Keep typing local: block the select's built-in type-ahead while
    // letting arrows, Enter, Escape, and Tab reach the popup.
    if (event.key.length === 1 || event.key === "Backspace") {
      event.stopPropagation();
    }
  };

  return (
    <div className="flex shrink-0 items-center gap-2 border-border/60 border-b bg-popover px-3 transition-colors focus-within:border-primary/50 [&:focus-within_svg]:text-foreground">
      <HugeiconsIcon
        aria-hidden="true"
        icon={Search01Icon}
        strokeWidth={2}
        className="size-3.5 shrink-0 text-muted-foreground transition-colors"
      />
      <input
        aria-label="Search models"
        className="h-9 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search models…"
        ref={inputRef}
        value={query}
      />
    </div>
  );
};

const matchesQuery = (model: AiModel, query: string) => {
  const haystack = `${model.name} ${model.id} ${model.provider}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/u)
    .every((part) => haystack.includes(part));
};

const ProviderLogo = ({
  logo,
  reserve,
}: {
  logo: ReactNode | undefined;
  reserve: boolean;
}) => {
  // Reserve the slot only when a logo map was supplied. A partial map is normal
  // — the catalog gains providers faster than anyone adds marks — and the rows
  // it does not cover would otherwise sit unindented against the rows it does.
  // With no map at all there is nothing to align to, so reserving would just be
  // dead space in front of the name.
  if (!logo) {
    return reserve ? (
      <span
        aria-hidden="true"
        className="size-4 shrink-0"
        data-slot="model-select-logo"
      />
    ) : null;
  }

  return (
    <span
      aria-hidden="true"
      className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_img]:size-full [&_svg]:size-full [&_span]:size-full"
      data-slot="model-select-logo"
    >
      {logo}
    </span>
  );
};

export const ModelSelect = ({
  className,
  defaultValue,
  excludeModels,
  fallbackToFirst,
  footer,
  logos,
  models,
  onPopupKeyDown,
  onValueChange,
  placeholder = "Select model",
  portalContainer,
  size = "md",
  value,
  valueSuffix,
  ...props
}: ModelSelectProps) => {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const excluded = new Set(excludeModels);
  const visible = excluded.size
    ? models.filter((model) => !excluded.has(model.id))
    : models;
  const selected = visible.find(
    (model) => model.id === (value ?? defaultValue)
  );

  // Opt-in guard: an unlisted selection snaps to the first available
  // model, so the picker can never submit an id the gateway rejects.
  useEffect(() => {
    const [first] = visible;

    if (fallbackToFirst && !selected && first) {
      onValueChange?.(first.id);
    }
  });
  const filtered = query
    ? visible.filter((model) => matchesQuery(model, query))
    : visible;

  return (
    <Select
      defaultValue={defaultValue}
      items={visible.map((model) => ({ label: model.name, value: model.id }))}
      onOpenChange={(open) => {
        if (!open) {
          setQuery("");
        }
      }}
      onOpenChangeComplete={(open) => {
        if (open) {
          searchRef.current?.focus();
        }
      }}
      onValueChange={(next) => {
        if (typeof next === "string") {
          onValueChange?.(next);
        }
      }}
      value={value}
    >
      <SelectTrigger
        aria-label="Model"
        className={cn(
          "border-border/60 shadow-none transition-colors hover:border-border",
          TRIGGER_SIZE[size],
          className
        )}
        data-slot="model-select"
        {...props}
      >
        <SelectValue>
          {selected ? (
            <>
              <ProviderLogo
                logo={logos?.[selected.provider]}
                reserve={Boolean(logos)}
              />
              <span className="truncate" title={selected.name}>
                {selected.name}
              </span>
              {valueSuffix}
            </>
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectPrimitive.Portal container={portalContainer}>
        <SelectPrimitive.Positioner
          align="start"
          alignItemWithTrigger={false}
          className="isolate z-50"
          side="bottom"
          sideOffset={4}
        >
          <SelectPrimitive.Popup
            className="relative isolate z-50 flex max-h-(--available-height) w-max min-w-80 max-w-[min(24rem,90vw)] origin-(--transform-origin) flex-col overflow-hidden rounded-md bg-popover text-popover-foreground shadow-none outline-none ring-1 ring-border/60 duration-100 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0"
            data-slot="select-content"
            onKeyDown={(event) => {
              onPopupKeyDown?.(event);

              if (event.defaultPrevented) {
                return;
              }

              // Typing anywhere routes back into the search: arrows walk
              // the list, characters always filter.
              const typing =
                event.key.length === 1 &&
                !(event.metaKey || event.ctrlKey || event.altKey);

              if (
                (typing || event.key === "Backspace") &&
                document.activeElement !== searchRef.current
              ) {
                event.preventDefault();
                event.stopPropagation();
                searchRef.current?.focus();
                setQuery(typing ? query + event.key : query.slice(0, -1));
              }
            }}
          >
            <SearchField
              inputRef={searchRef}
              onQueryChange={setQuery}
              query={query}
            />

            <div
              className="neon-scroll-fade relative h-72 min-h-0 shrink overflow-y-auto"
              data-slot="model-select-scroller"
            >
              <HighlightGlide />
              <ScrollToSelected />
              <SelectPrimitive.List>
                {filtered.length === 0 ? (
                  <p className="px-3 py-6 text-center text-muted-foreground text-sm">
                    No models match “{query}”
                  </p>
                ) : (
                  groupByProvider(filtered).map(([provider, group]) => (
                    <SelectGroup key={provider}>
                      <SelectLabel className="font-mono text-[10px] uppercase tracking-wide">
                        {provider}
                      </SelectLabel>
                      {group.map((model) => (
                        <SelectItem
                          className="focus:bg-transparent"
                          disabled={model.disabled}
                          key={model.id}
                          value={model.id}
                        >
                          <div className="flex w-full min-w-0 items-center gap-2">
                            <ProviderLogo
                              logo={logos?.[model.provider]}
                              reserve={Boolean(logos)}
                            />
                            <span className="shrink-0">{model.name}</span>
                            {model.tag ? (
                              <span className="shrink-0 border border-border/60 px-1 py-px font-mono text-[9px] text-muted-foreground uppercase leading-none tracking-wide">
                                {model.tag}
                              </span>
                            ) : null}
                            <span
                              className="ml-auto truncate pl-3 font-mono text-[10px] text-muted-foreground/70"
                              title={model.id}
                            >
                              {model.id}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))
                )}
              </SelectPrimitive.List>
            </div>

            {footer ? (
              <div className="shrink-0 border-border/60 border-t">{footer}</div>
            ) : null}
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </Select>
  );
};
