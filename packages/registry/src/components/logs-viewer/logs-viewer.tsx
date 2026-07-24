"use client";

import {
  Alert02Icon,
  ArrowDown01Icon,
  Cancel01Icon,
  Clock01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Anser from "anser";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { UIEvent } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type LogLevel = "debug" | "info" | "warn" | "error";
type TimeRange = "all" | "5m" | "15m" | "1h" | "24h";

interface LogLine {
  id: string;
  message: string;
  level?: LogLevel;
  timestamp?: string;
  at?: string;
  source?: string;
}

interface LogsViewerProps {
  lines: LogLine[];
  title?: string;
  maxLines?: number;
  rowHeight?: number;
  visibleRows?: number;
  follow?: boolean;
  defaultFollow?: boolean;
  onFollowChange?: (follow: boolean) => void;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  range?: TimeRange;
  defaultRange?: TimeRange;
  onRangeChange?: (range: TimeRange) => void;
  levels?: LogLevel[];
  defaultLevels?: LogLevel[];
  onLevelsChange?: (levels: LogLevel[]) => void;
  isStreaming?: boolean;
  isLoading?: boolean;
  error?: Error | string | null;
  className?: string;
}

const LEVELS: { label: string; value: LogLevel; className: string }[] = [
  { className: "text-muted-foreground", label: "Debug", value: "debug" },
  { className: "text-[var(--status-active)]", label: "Info", value: "info" },
  { className: "text-[var(--status-scaling)]", label: "Warn", value: "warn" },
  { className: "text-destructive", label: "Error", value: "error" },
];

const LEVEL_META = new Map(LEVELS.map((level) => [level.value, level]));

const ANSI_COLORS: Record<string, string> = {
  "ansi-black": "text-foreground",
  "ansi-blue": "text-[var(--status-active)]",
  "ansi-bright-black": "text-muted-foreground",
  "ansi-bright-blue": "text-[var(--status-active)]",
  "ansi-bright-cyan": "text-[var(--status-active)]",
  "ansi-bright-green": "text-[var(--status-active)]",
  "ansi-bright-magenta": "text-primary",
  "ansi-bright-red": "text-destructive",
  "ansi-bright-white": "text-foreground",
  "ansi-bright-yellow": "text-[var(--status-scaling)]",
  "ansi-cyan": "text-[var(--status-active)]",
  "ansi-green": "text-[var(--status-active)]",
  "ansi-magenta": "text-primary",
  "ansi-red": "text-destructive",
  "ansi-white": "text-foreground",
  "ansi-yellow": "text-[var(--status-scaling)]",
};

const stripAnsi = (value: string) => Anser.ansiToText(value);

const AnsiText = ({ value }: { value: string }) => {
  const parts = useMemo(
    () => Anser.ansiToJson(value, { json: true, use_classes: true }),
    [value]
  );

  return (
    <>
      {parts.map((part, index) => {
        if (!part.content) {
          return null;
        }
        const color = part.fg ? ANSI_COLORS[part.fg] : undefined;
        const decorations = part.decorations ?? [];
        return (
          <span
            className={cn(
              color,
              decorations.includes("bold") && "font-semibold",
              decorations.includes("dim") && "opacity-70",
              decorations.includes("italic") && "italic",
              decorations.includes("underline") && "underline"
            )}
            key={`${index}-${part.content}`}
          >
            {part.content}
          </span>
        );
      })}
    </>
  );
};

const LevelFilter = ({
  onToggle,
  value,
}: {
  onToggle: (level: LogLevel) => void;
  value: LogLevel[];
}) => (
  <fieldset className="flex shrink-0 items-center gap-0.5 self-start rounded-md border border-input p-0.5 sm:self-auto">
    <legend className="sr-only">Filter log levels</legend>
    {LEVELS.map((level) => {
      const active = value.includes(level.value);
      return (
        <button
          aria-pressed={active}
          className={cn(
            "h-6 rounded-sm px-2 font-medium text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            active
              ? cn("bg-muted", level.className)
              : "text-muted-foreground/70 hover:text-foreground"
          )}
          key={level.value}
          onClick={() => onToggle(level.value)}
          type="button"
        >
          {level.label}
        </button>
      );
    })}
  </fieldset>
);

const StreamState = ({ streaming }: { streaming: boolean }) => (
  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
    <span
      aria-hidden="true"
      className={cn(
        "size-1.5 rounded-full",
        streaming
          ? "animate-pulse bg-[var(--status-active)] motion-reduce:animate-none"
          : "bg-muted-foreground/40"
      )}
    />
    {streaming ? "Streaming" : "Paused"}
  </span>
);

const LogRow = ({ line, rowHeight }: { line: LogLine; rowHeight: number }) => {
  const meta = line.level ? LEVEL_META.get(line.level) : undefined;
  return (
    <div
      className="flex items-start gap-2 px-3 hover:bg-muted/30"
      style={{ height: rowHeight }}
    >
      {line.timestamp ? (
        <span className="shrink-0 text-muted-foreground/60 tabular-nums">
          {line.timestamp}
        </span>
      ) : null}
      {meta ? (
        <span
          className={cn("w-10 shrink-0 font-medium uppercase", meta.className)}
        >
          {line.level}
        </span>
      ) : null}
      {line.source ? (
        <span className="shrink-0 text-muted-foreground/70">{line.source}</span>
      ) : null}
      <span className="whitespace-pre text-foreground">
        <AnsiText value={line.message} />
      </span>
    </div>
  );
};

const LogsEmpty = ({ filtered }: { filtered: boolean }) => (
  <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center">
    <p className="font-medium text-sm">
      {filtered ? "No matching lines" : "No logs yet"}
    </p>
    <p className="max-w-64 text-muted-foreground text-xs">
      {filtered
        ? "Try a different search or enable more levels."
        : "Lines appear here as the compute writes them."}
    </p>
  </div>
);

const LogsLoading = ({ rows }: { rows: number }) => (
  <output aria-label="Loading logs" className="block space-y-1.5 p-3">
    {Array.from({ length: rows }, (_, index) => (
      <div
        className="h-3 animate-pulse rounded-xs bg-muted motion-reduce:animate-none"
        key={index}
        style={{ width: `${45 + ((index * 17) % 50)}%` }}
      />
    ))}
  </output>
);

const SearchField = ({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) => (
  <label className="relative block min-w-0 flex-1">
    <span className="sr-only">Search logs</span>
    <HugeiconsIcon
      aria-hidden="true"
      className="-translate-y-1/2 absolute top-1/2 left-2.5 size-3.5 text-muted-foreground"
      icon={Search01Icon}
      strokeWidth={1.75}
    />
    <input
      className="h-8 w-full rounded-md border border-input bg-transparent pr-8 pl-8 text-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-3 focus:ring-ring/20"
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search logs..."
      type="search"
      value={value}
    />
    {value ? (
      <button
        aria-label="Clear search"
        className="-translate-y-1/2 absolute top-1/2 right-2 flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={() => onChange("")}
        type="button"
      >
        <HugeiconsIcon
          aria-hidden="true"
          className="size-3"
          icon={Cancel01Icon}
          strokeWidth={2}
        />
      </button>
    ) : null}
  </label>
);

const LogsHeader = ({
  cappedCount,
  isStreaming,
  maxLines,
  title,
  totalCount,
  visibleCount,
}: {
  cappedCount: number;
  isStreaming: boolean;
  maxLines: number;
  title: string;
  totalCount: number;
  visibleCount: number;
}) => (
  <header className="flex min-w-0 flex-col gap-2 border-border/60 border-b px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-center gap-2.5">
      <h2 className="font-semibold text-sm">{title}</h2>
      <StreamState streaming={isStreaming} />
    </div>
    <span className="text-[10px] text-muted-foreground tabular-nums">
      {visibleCount.toLocaleString()} of {cappedCount.toLocaleString()} lines
      {totalCount > maxLines ? ` (capped at ${maxLines.toLocaleString()})` : ""}
    </span>
  </header>
);

const LogsError = ({
  message,
  minHeight,
}: {
  message: string;
  minHeight: number;
}) => (
  <div
    className="flex items-center justify-center gap-2 p-6 text-destructive text-sm"
    role="alert"
    style={{ minHeight }}
  >
    <HugeiconsIcon
      aria-hidden="true"
      className="size-4"
      icon={Alert02Icon}
      strokeWidth={1.75}
    />
    {message}
  </div>
);

const RANGES: {
  label: string;
  short: string;
  value: TimeRange;
  ms: number;
}[] = [
  { label: "Last 5 minutes", ms: 5 * 60_000, short: "5m", value: "5m" },
  { label: "Last 15 minutes", ms: 15 * 60_000, short: "15m", value: "15m" },
  { label: "Last hour", ms: 60 * 60_000, short: "1h", value: "1h" },
  { label: "Last 24 hours", ms: 24 * 60 * 60_000, short: "24h", value: "24h" },
  {
    label: "All time",
    ms: Number.POSITIVE_INFINITY,
    short: "All time",
    value: "all",
  },
];

const RANGE_SHORT = new Map(RANGES.map((range) => [range.value, range.short]));

const RANGE_MS = new Map(RANGES.map((range) => [range.value, range.ms]));

const RangeFilter = ({
  onChange,
  value,
}: {
  onChange: (range: TimeRange) => void;
  value: TimeRange;
}) => (
  <Select
    onValueChange={(next) => {
      if (next !== null) {
        onChange(next as TimeRange);
      }
    }}
    value={value}
  >
    <SelectTrigger
      aria-label="Time range"
      className="h-8 w-full shrink-0 gap-2 rounded-md border-input text-xs sm:w-auto"
      size="sm"
    >
      <HugeiconsIcon
        aria-hidden="true"
        className="size-3.5 text-muted-foreground"
        icon={Clock01Icon}
        strokeWidth={1.75}
      />
      <SelectValue>{() => RANGE_SHORT.get(value) ?? "All time"}</SelectValue>
    </SelectTrigger>
    <SelectContent>
      {RANGES.map((range) => (
        <SelectItem className="text-xs" key={range.value} value={range.value}>
          {range.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const LogsControls = ({
  hasTimestamps,
  levels,
  onLevelToggle,
  onQueryChange,
  onRangeChange,
  query,
  range,
}: {
  hasTimestamps: boolean;
  levels: LogLevel[];
  onLevelToggle: (level: LogLevel) => void;
  onQueryChange: (value: string) => void;
  onRangeChange: (range: TimeRange) => void;
  query: string;
  range: TimeRange;
}) => (
  <div className="flex min-w-0 flex-col gap-2 border-border/60 border-b p-3 sm:flex-row sm:items-center">
    <SearchField onChange={onQueryChange} value={query} />
    <LevelFilter onToggle={onLevelToggle} value={levels} />
    {hasTimestamps ? (
      <RangeFilter onChange={onRangeChange} value={range} />
    ) : null}
  </div>
);

const OVERSCAN = 12;
const ALL_LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

const LogsBody = ({
  follow,
  levelsFiltered,
  query,
  rowHeight,
  setFollow,
  title,
  viewportHeight,
  visible,
}: {
  follow: boolean;
  levelsFiltered: boolean;
  query: string;
  rowHeight: number;
  setFollow: (follow: boolean) => void;
  title: string;
  viewportHeight: number;
  visible: LogLine[];
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const previousCount = useRef(visible.length);

  const totalHeight = visible.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  const endIndex = Math.min(
    visible.length,
    Math.ceil((scrollTop + viewportHeight) / rowHeight) + OVERSCAN
  );
  const rows = visible.slice(startIndex, endIndex);

  const scrollToBottom = useCallback(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
    setScrollTop(node.scrollTop);
    setPendingCount(0);
  }, []);

  useLayoutEffect(() => {
    const added = visible.length - previousCount.current;
    previousCount.current = visible.length;

    if (follow) {
      scrollToBottom();
      return;
    }
    if (added > 0) {
      setPendingCount((current) => current + added);
    }
  }, [follow, scrollToBottom, visible.length]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const node = event.currentTarget;
    setScrollTop(node.scrollTop);
    const atBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight < rowHeight;
    if (atBottom) {
      setPendingCount(0);
      if (!follow) {
        setFollow(true);
      }
      return;
    }
    if (follow) {
      setFollow(false);
    }
  };

  return (
    <div className="relative">
      <div
        aria-label={`${title} output`}
        className={cn(
          "neon-scroll-fade overflow-auto font-mono text-[11px] leading-5",
          follow && "neon-scroll-pinned"
        )}
        onScroll={handleScroll}
        ref={scrollRef}
        role="log"
        style={{ height: viewportHeight }}
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable log region must be reachable by keyboard
        tabIndex={0}
      >
        {visible.length === 0 ? (
          <LogsEmpty filtered={Boolean(query) || levelsFiltered} />
        ) : (
          <div style={{ height: totalHeight, position: "relative" }}>
            <div
              style={{
                left: 0,
                position: "absolute",
                right: 0,
                top: startIndex * rowHeight,
              }}
            >
              {rows.map((line) => (
                <LogRow key={line.id} line={line} rowHeight={rowHeight} />
              ))}
            </div>
          </div>
        )}
      </div>
      {follow || visible.length === 0 ? null : (
        <button
          className="-translate-x-1/2 fade-in-0 slide-in-from-bottom-1 absolute bottom-3 left-1/2 flex animate-in items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1.5 font-medium text-[10px] shadow-sm duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:animate-none"
          onClick={() => {
            setFollow(true);
            scrollToBottom();
          }}
          type="button"
        >
          <HugeiconsIcon
            aria-hidden="true"
            className="size-3"
            icon={ArrowDown01Icon}
            strokeWidth={2}
          />
          {pendingCount > 0
            ? `${pendingCount.toLocaleString()} new ${pendingCount === 1 ? "line" : "lines"}`
            : "Follow output"}
        </button>
      )}
    </div>
  );
};

const useLogsViewerState = ({
  controlledFollow,
  controlledLevels,
  controlledQuery,
  controlledRange,
  defaultFollow,
  defaultLevels,
  defaultQuery,
  defaultRange,
  error,
  onFollowChange,
  onLevelsChange,
  onQueryChange,
  onRangeChange,
}: {
  controlledFollow?: boolean;
  controlledLevels?: LogLevel[];
  controlledQuery?: string;
  controlledRange?: TimeRange;
  defaultFollow: boolean;
  defaultLevels: LogLevel[];
  defaultQuery: string;
  defaultRange: TimeRange;
  error?: Error | string | null;
  onFollowChange?: (follow: boolean) => void;
  onLevelsChange?: (levels: LogLevel[]) => void;
  onQueryChange?: (query: string) => void;
  onRangeChange?: (range: TimeRange) => void;
}) => {
  const [internalFollow, setInternalFollow] = useState(defaultFollow);
  const [internalQuery, setInternalQuery] = useState(defaultQuery);
  const [internalLevels, setInternalLevels] =
    useState<LogLevel[]>(defaultLevels);
  const [internalRange, setInternalRange] = useState<TimeRange>(defaultRange);

  const setFollow = useCallback(
    (next: boolean) => {
      if (controlledFollow === undefined) {
        setInternalFollow(next);
      }
      onFollowChange?.(next);
    },
    [controlledFollow, onFollowChange]
  );

  const handleQueryChange = (next: string) => {
    if (controlledQuery === undefined) {
      setInternalQuery(next);
    }
    onQueryChange?.(next);
  };

  const handleRangeChange = (next: TimeRange) => {
    if (controlledRange === undefined) {
      setInternalRange(next);
    }
    onRangeChange?.(next);
  };

  const handleLevelToggle = (level: LogLevel) => {
    const apply = (current: LogLevel[]) => {
      const next = current.includes(level)
        ? current.filter((item) => item !== level)
        : [...current, level];
      onLevelsChange?.(next);
      return next;
    };

    if (controlledLevels === undefined) {
      setInternalLevels(apply);
      return;
    }
    apply(controlledLevels);
  };

  return {
    errorMessage: error instanceof Error ? error.message : (error ?? undefined),
    follow: controlledFollow ?? internalFollow,
    handleLevelToggle,
    handleQueryChange,
    handleRangeChange,
    levels: controlledLevels ?? internalLevels,
    query: controlledQuery ?? internalQuery,
    range: controlledRange ?? internalRange,
    setFollow,
  };
};

const LogsViewer = ({
  lines,
  title = "Logs",
  maxLines = 5000,
  rowHeight = 20,
  visibleRows = 18,
  follow: controlledFollow,
  defaultFollow = true,
  onFollowChange,
  query: controlledQuery,
  defaultQuery = "",
  onQueryChange,
  range: controlledRange,
  defaultRange = "all",
  onRangeChange,
  levels: controlledLevels,
  defaultLevels = ALL_LEVELS,
  onLevelsChange,
  isStreaming = false,
  isLoading = false,
  error,
  className,
}: LogsViewerProps) => {
  const {
    errorMessage,
    follow,
    handleLevelToggle,
    handleQueryChange,
    handleRangeChange,
    levels,
    query,
    range,
    setFollow,
  } = useLogsViewerState({
    controlledFollow,
    controlledLevels,
    controlledQuery,
    controlledRange,
    defaultFollow,
    defaultLevels,
    defaultQuery,
    defaultRange,
    error,
    onFollowChange,
    onLevelsChange,
    onQueryChange,
    onRangeChange,
  });

  const newestAt = useMemo(() => {
    let newest = 0;
    for (const line of lines) {
      if (line.at) {
        const value = new Date(line.at).getTime();
        if (value > newest) {
          newest = value;
        }
      }
    }
    return newest;
  }, [lines]);
  const hasTimestamps = newestAt > 0;

  const capped = useMemo(
    () => (lines.length > maxLines ? lines.slice(-maxLines) : lines),
    [lines, maxLines]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const window = RANGE_MS.get(range) ?? Number.POSITIVE_INFINITY;
    const oldest = Number.isFinite(window) ? newestAt - window : 0;

    return capped.filter((line) => {
      if (line.level && !levels.includes(line.level)) {
        return false;
      }
      if (line.at && oldest > 0 && new Date(line.at).getTime() < oldest) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return `${line.timestamp ?? ""} ${line.source ?? ""} ${stripAnsi(line.message)}`
        .toLocaleLowerCase()
        .includes(needle);
    });
  }, [capped, levels, newestAt, query, range]);

  const viewportHeight = rowHeight * visibleRows;
  return (
    <section
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-lg border border-border/70 bg-card text-card-foreground shadow-xs",
        className
      )}
      data-slot="logs-viewer"
    >
      <LogsHeader
        cappedCount={capped.length}
        isStreaming={isStreaming}
        maxLines={maxLines}
        totalCount={lines.length}
        visibleCount={visible.length}
        title={title}
      />
      <LogsControls
        hasTimestamps={hasTimestamps}
        levels={levels}
        onLevelToggle={handleLevelToggle}
        onQueryChange={handleQueryChange}
        onRangeChange={handleRangeChange}
        query={query}
        range={range}
      />
      {errorMessage ? (
        <LogsError message={errorMessage} minHeight={viewportHeight} />
      ) : null}
      {isLoading && !errorMessage ? <LogsLoading rows={visibleRows} /> : null}
      {isLoading || errorMessage ? null : (
        <LogsBody
          follow={follow}
          levelsFiltered={levels.length < ALL_LEVELS.length}
          query={query}
          rowHeight={rowHeight}
          setFollow={setFollow}
          viewportHeight={viewportHeight}
          visible={visible}
          title={title}
        />
      )}
    </section>
  );
};

export { LogsViewer };
export type { LogLevel, LogLine, LogsViewerProps, TimeRange };
