"use client";

import type { ComponentProps } from "react";
import { useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DateRangePreset {
  label: string;
  /** Days back from today, inclusive. */
  days: number;
}

export type DateRangePickerProps = Omit<
  ComponentProps<"button">,
  "value" | "onChange"
> & {
  value: DateRange;
  onValueChange: (range: DateRange) => void;
  /** Quick ranges in the popup rail. */
  presets?: DateRangePreset[];
  /** Days after today stay unselectable. */
  disableFuture?: boolean;
};

/* ─────────────────────────────────────────────────────────
 * PICKER STORYBOARD
 *
 *  trigger   a mono pill reading the range ("Jul 1 – Jul
 *            18"); hover warms the hairline
 *  open      the panel rises 4px: preset rail on the
 *            left, one month grid on the right
 *  pick      first click plants the start (square primary
 *            marker); the tentative range washes
 *            primary/10 under the pointer as it moves;
 *            the second click lands the end and closes
 *  presets   one click, done — the rail is the fast path
 *  today     wears a hairline ring, never color
 *  motion    the month swaps with a 150ms crossfade;
 *            everything static under reduced motion
 * ───────────────────────────────────────────────────────── */
const WEEKDAYS = ["mo", "tu", "we", "th", "fr", "sa", "su"] as const;

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const RANGE_LABEL = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
});

const DEFAULT_PRESETS: DateRangePreset[] = [
  { days: 7, label: "last 7 days" },
  { days: 14, label: "last 14 days" },
  { days: 30, label: "last 30 days" },
];

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatRange = (range: DateRange) =>
  `${RANGE_LABEL.format(range.from)} – ${RANGE_LABEL.format(range.to)}`;

/** The 42 cells of a month view, Monday-first. */
export const monthCells = (month: Date): Date[] => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = new Date(year, monthIndex, 1);
  const lead = (first.getDay() + 6) % 7;
  return Array.from(
    { length: 42 },
    (_, index) => new Date(year, monthIndex, 1 - lead + index)
  );
};

const dayState = (
  day: Date,
  range: { from: Date; to: Date | null },
  hovered: Date | null
) => {
  const from = startOfDay(range.from);
  const to = range.to ? startOfDay(range.to) : null;
  const isStart = sameDay(day, from);
  const isEnd = to ? sameDay(day, to) : false;

  // A landed range, or the tentative wash toward the pointer.
  const end = to ?? hovered;
  let inRange = false;

  if (end) {
    const [lo, hi] = end.getTime() < from.getTime() ? [end, from] : [from, end];
    inRange = day.getTime() > lo.getTime() && day.getTime() < hi.getTime();
  }

  return {
    inRange,
    isEnd: isEnd || (!to && hovered && sameDay(day, hovered)),
    isStart,
  };
};

export const DateRangePicker = ({
  className,
  disableFuture = true,
  onValueChange,
  presets = DEFAULT_PRESETS,
  value,
  ...props
}: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfDay(value.from));
  const [pending, setPending] = useState<Date | null>(null);
  const [hovered, setHovered] = useState<Date | null>(null);

  const today = startOfDay(new Date());
  const range = pending
    ? { from: pending, to: null }
    : { from: value.from, to: value.to };

  const landRange = (from: Date, to: Date) => {
    const [lo, hi] = to.getTime() < from.getTime() ? [to, from] : [from, to];
    onValueChange({ from: lo, to: hi });
    setPending(null);
    setHovered(null);
    setOpen(false);
  };

  const pickDay = (day: Date) => {
    if (pending) {
      landRange(pending, day);
      return;
    }

    setPending(day);
  };

  const pickPreset = (preset: DateRangePreset) => {
    const from = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - (preset.days - 1)
    );
    landRange(from, today);
  };

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setMonth(startOfDay(value.from));
    } else {
      setPending(null);
      setHovered(null);
    }

    setOpen(next);
  };

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      <PopoverTrigger
        className={cn(
          "inline-flex h-6 items-center gap-1.5 rounded-full border border-border/60 px-2.5 font-mono text-muted-foreground text-xs transition-colors hover:border-border hover:text-foreground",
          className
        )}
        data-slot="date-range-picker"
        {...props}
      >
        <svg
          aria-hidden="true"
          className="size-3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect height="16" rx="1" width="18" x="3" y="5" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
        {formatRange(value)}
      </PopoverTrigger>
      <PopoverContent className="flex gap-3">
        <div
          className="flex flex-col gap-0.5 border-border/40 border-r pr-3"
          data-slot="date-range-picker-presets"
        >
          {presets.map((preset) => (
            <button
              className="rounded-sm px-2 py-1 text-left font-mono text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              key={preset.label}
              onClick={() => pickPreset(preset)}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <button
              aria-label="Previous month"
              className="rounded-sm px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
              type="button"
            >
              ‹
            </button>
            <span
              className="fade-in-0 animate-in font-mono text-foreground text-xs duration-150 motion-reduce:animate-none"
              key={MONTH_LABEL.format(month)}
            >
              {MONTH_LABEL.format(month).toLowerCase()}
            </span>
            <button
              aria-label="Next month"
              className="rounded-sm px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
              type="button"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((weekday) => (
              <span
                className="flex size-7 items-center justify-center font-mono text-[10px] text-muted-foreground/60"
                key={weekday}
              >
                {weekday}
              </span>
            ))}
            {monthCells(month).map((day) => {
              const outside = day.getMonth() !== month.getMonth();
              const future = disableFuture && day.getTime() > today.getTime();
              const { inRange, isEnd, isStart } = dayState(day, range, hovered);

              return (
                <button
                  className={cn(
                    "flex size-7 items-center justify-center rounded-sm font-mono text-xs tabular-nums transition-colors",
                    outside ? "text-muted-foreground/30" : "text-foreground/80",
                    sameDay(day, today) && "ring-1 ring-border ring-inset",
                    inRange && "bg-primary/10 text-foreground",
                    (isStart || isEnd) &&
                      "bg-primary font-medium text-primary-foreground",
                    future
                      ? "cursor-not-allowed opacity-30"
                      : "hover:bg-accent hover:text-foreground"
                  )}
                  disabled={future}
                  key={day.toISOString()}
                  onClick={() => pickDay(day)}
                  onMouseEnter={() => pending && setHovered(day)}
                  type="button"
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
