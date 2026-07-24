"use client";

import { PostgreSQL } from "@codemirror/lang-sql";
import {
  Alert02Icon,
  ArrowDown01Icon,
  Bookmark01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Loading03Icon,
  PlayIcon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { highlightTree, tagHighlighter, tags } from "@lezer/highlight";
import { useMemo, useState } from "react";
import type { ComponentProps, ReactNode } from "react";

import { EmptyState } from "@/components/empty-state/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type QueryHistoryStatus = "success" | "error" | "cancelled";
export type QueryHistoryFilter = "all" | "saved" | "failed";

export interface QueryHistoryEntry {
  id: string;
  query: string;
  status: QueryHistoryStatus;
  /** Display-ready time, e.g. "2m ago" or "Yesterday, 4:18 PM". */
  timestamp: string;
  /** Machine-readable timestamp for the time element. */
  executedAt?: string;
  durationMs?: number;
  rowCount?: number;
  command?: string;
  database?: string;
  branch?: string;
  error?: string;
  saved?: boolean;
}

export type QueryHistoryProps = Omit<ComponentProps<"div">, "children"> & {
  entries: QueryHistoryEntry[];
  /** Controlled text filter. */
  query?: string;
  /** Initial text filter for uncontrolled usage. */
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** Controlled history filter. */
  filter?: QueryHistoryFilter;
  /** Initial history filter for uncontrolled usage. */
  defaultFilter?: QueryHistoryFilter;
  onFilterChange?: (filter: QueryHistoryFilter) => void;
  /** Controlled expanded row id. Pass null to close all rows. */
  expandedId?: string | null;
  /** Initial expanded row id for uncontrolled usage. */
  defaultExpandedId?: string | null;
  onExpandedIdChange?: (id: string | null) => void;
  onRerun?: (entry: QueryHistoryEntry) => void | Promise<void>;
  /** Controlled id for a query currently rerunning. */
  runningId?: string | null;
  onSavedChange?: (entry: QueryHistoryEntry, saved: boolean) => void;
  onCopy?: (entry: QueryHistoryEntry) => void;
  isLoading?: boolean;
  error?: Error | string | null;
  empty?: ReactNode;
  label?: string;
};

const FILTERS: { label: string; value: QueryHistoryFilter }[] = [
  { label: "All", value: "all" },
  { label: "Saved", value: "saved" },
  { label: "Failed", value: "failed" },
];

const STATUS: Record<
  QueryHistoryStatus,
  { icon: typeof CheckmarkCircle02Icon; label: string; className: string }
> = {
  cancelled: {
    className: "text-muted-foreground",
    icon: Cancel01Icon,
    label: "Cancelled",
  },
  error: {
    className: "text-destructive",
    icon: Alert02Icon,
    label: "Failed",
  },
  success: {
    className: "text-primary",
    icon: CheckmarkCircle02Icon,
    label: "Succeeded",
  },
};

const COPY_FEEDBACK_MS = 1600;

/* ─────────────────────────────────────────────────────────
 * DISCLOSURE STORYBOARD
 *
 *   0ms   detail begins 4px above its resting position
 * 180ms   height, position, and opacity settle together
 * ───────────────────────────────────────────────────────── */
const DISCLOSURE_MOTION = {
  durationMs: 180,
  offsetPx: 4,
};

const SQL_HIGHLIGHTER = tagHighlighter([
  { class: "font-semibold text-primary", tag: tags.keyword },
  { class: "text-[var(--status-scaling)]", tag: tags.string },
  { class: "italic text-muted-foreground", tag: tags.comment },
  { class: "text-foreground", tag: [tags.name, tags.variableName] },
  {
    class: "text-[var(--status-sleeping)]",
    tag: [tags.number, tags.bool, tags.null],
  },
  { class: "text-muted-foreground", tag: tags.punctuation },
  { class: "text-destructive", tag: tags.invalid },
]);

const highlightSQL = (query: string) => {
  const content: ReactNode[] = [];
  let position = 0;
  highlightTree(
    PostgreSQL.language.parser.parse(query),
    SQL_HIGHLIGHTER,
    (from, to, classes) => {
      if (from > position) {
        content.push(query.slice(position, from));
      }
      content.push(
        <span className={classes} key={`${from}-${to}`}>
          {query.slice(from, to)}
        </span>
      );
      position = to;
    }
  );
  if (position < query.length) {
    content.push(query.slice(position));
  }
  return content;
};

const useControllableValue = <Value,>({
  prop,
  defaultProp,
  onChange,
}: {
  prop: Value | undefined;
  defaultProp: Value;
  onChange?: (value: Value) => void;
}) => {
  const [internalValue, setInternalValue] = useState(defaultProp);
  const value = prop === undefined ? internalValue : prop;
  const setValue = (nextValue: Value) => {
    if (prop === undefined) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  };
  return [value, setValue] as const;
};

const useCopyQuery = (onCopy?: (entry: QueryHistoryEntry) => void) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copy = async (entry: QueryHistoryEntry) => {
    try {
      await navigator.clipboard.writeText(entry.query);
      setCopiedId(entry.id);
      window.setTimeout(() => setCopiedId(null), COPY_FEEDBACK_MS);
    } catch {
      setCopiedId(null);
    }
    onCopy?.(entry);
  };
  return { copiedId, copy };
};

const formatDuration = (durationMs?: number) => {
  if (durationMs === undefined) {
    return null;
  }
  if (durationMs < 1) {
    return "<1 ms";
  }
  if (durationMs < 1000) {
    return `${Math.round(durationMs)} ms`;
  }
  return `${(durationMs / 1000).toFixed(2)} s`;
};

const formatRowCount = (rowCount?: number) => {
  if (rowCount === undefined) {
    return null;
  }
  return `${rowCount.toLocaleString()} ${rowCount === 1 ? "row" : "rows"}`;
};

const summarizeQuery = (query: string) => query.replaceAll(/\s+/gu, " ").trim();

const IconButton = ({
  label,
  pressed,
  className,
  ...props
}: ComponentProps<"button"> & { label: string; pressed?: boolean }) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <button
          aria-label={label}
          aria-pressed={pressed}
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors",
            "[&_svg]:size-3.5",
            "hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:opacity-50",
            pressed &&
              "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
            className
          )}
          type="button"
          {...props}
        />
      }
    />
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const FilterControl = ({
  value,
  onChange,
}: {
  value: QueryHistoryFilter;
  onChange: (filter: QueryHistoryFilter) => void;
}) => (
  <fieldset className="flex h-8 shrink-0 items-center rounded-md border border-border/60 bg-background p-0.5">
    <legend className="sr-only">Filter query history</legend>
    {FILTERS.map((filter) => (
      <button
        aria-pressed={value === filter.value}
        className={cn(
          "h-6 rounded-[4px] px-2 font-medium text-[11px] outline-none transition-colors",
          "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
          value === filter.value
            ? "bg-muted text-foreground shadow-xs"
            : "text-muted-foreground"
        )}
        key={filter.value}
        onClick={() => onChange(filter.value)}
        type="button"
      >
        {filter.label}
      </button>
    ))}
  </fieldset>
);

const QueryMetadata = ({
  entry,
  statusLabel,
}: {
  entry: QueryHistoryEntry;
  statusLabel: string;
}) => {
  const duration = formatDuration(entry.durationMs);
  const rowCount = formatRowCount(entry.rowCount);
  const isSlow = entry.durationMs !== undefined && entry.durationMs >= 1000;

  return (
    <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 pl-[22px] text-[10px] text-muted-foreground tabular-nums">
      <span className="sr-only">{statusLabel}.</span>
      <span className="inline-flex items-center gap-2">
        {entry.command ? (
          <span className="font-medium text-foreground/80">
            {entry.command}
          </span>
        ) : null}
        {rowCount ? <span>{rowCount}</span> : null}
        {duration ? (
          <span
            className={
              isSlow ? "text-[var(--status-scaling)]" : "text-muted-foreground"
            }
          >
            {duration}
          </span>
        ) : null}
      </span>
      {entry.database || entry.branch ? (
        <span className="inline-flex min-w-0 max-w-56 items-center gap-1 rounded-sm bg-muted/50 px-1.5 py-0.5 font-mono text-muted-foreground/80">
          {entry.database ? (
            <span className="truncate">{entry.database}</span>
          ) : null}
          {entry.database && entry.branch ? (
            <span aria-hidden="true" className="text-border">
              /
            </span>
          ) : null}
          {entry.branch ? (
            <span className="truncate">{entry.branch}</span>
          ) : null}
        </span>
      ) : null}
      <time className="text-muted-foreground/65" dateTime={entry.executedAt}>
        {entry.timestamp}
      </time>
    </span>
  );
};

const QueryRow = ({
  entry,
  expanded,
  copied,
  running,
  onCopy,
  onExpandedChange,
  onRerun,
  onSavedChange,
}: {
  entry: QueryHistoryEntry;
  expanded: boolean;
  copied: boolean;
  running: boolean;
  onCopy: () => void;
  onExpandedChange: () => void;
  onRerun?: () => void | Promise<void>;
  onSavedChange?: () => void;
}) => {
  const status = STATUS[entry.status];
  const summary = summarizeQuery(entry.query);
  const detailsId = `query-history-${entry.id}-details`;

  return (
    <li
      aria-busy={running || undefined}
      className="border-border/50 border-b last:border-b-0"
      data-expanded={expanded}
      data-running={running}
      data-slot="query-history-item"
      data-status={entry.status}
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5">
        <button
          aria-controls={detailsId}
          aria-expanded={expanded}
          className="group/query min-w-0 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={onExpandedChange}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2">
            <HugeiconsIcon
              aria-hidden="true"
              className={cn("size-3.5 shrink-0", status.className)}
              icon={status.icon}
              strokeWidth={2}
            />
            <span
              className="min-w-0 truncate font-mono text-foreground text-xs leading-5"
              title={summary}
            >
              {summary}
            </span>
            <HugeiconsIcon
              aria-hidden="true"
              className={cn(
                "size-3 shrink-0 text-muted-foreground/60 transition-transform duration-100 motion-reduce:transition-none",
                expanded && "rotate-180"
              )}
              icon={ArrowDown01Icon}
              strokeWidth={2}
            />
          </span>
          <QueryMetadata entry={entry} statusLabel={status.label} />
        </button>

        <div
          className="flex items-center gap-0.5"
          data-slot="query-history-actions"
        >
          {onSavedChange ? (
            <IconButton
              label={entry.saved ? "Remove from saved queries" : "Save query"}
              onClick={onSavedChange}
              pressed={entry.saved}
            >
              <HugeiconsIcon icon={Bookmark01Icon} strokeWidth={2} />
            </IconButton>
          ) : null}
          <IconButton label={copied ? "Copied" : "Copy query"} onClick={onCopy}>
            <HugeiconsIcon
              className={copied ? "text-primary" : undefined}
              icon={copied ? Tick02Icon : Copy01Icon}
              strokeWidth={2}
            />
          </IconButton>
          {onRerun ? (
            <IconButton
              disabled={running}
              label={running ? "Running query" : "Run query again"}
              onClick={onRerun}
            >
              <HugeiconsIcon
                className={cn(
                  running &&
                    "animate-spin text-primary motion-reduce:animate-none"
                )}
                icon={running ? Loading03Icon : PlayIcon}
                strokeWidth={2}
              />
            </IconButton>
          ) : null}
        </div>
      </div>

      <div
        aria-hidden={!expanded}
        className={cn(
          "mx-3 grid transition-[grid-template-rows,opacity,transform] ease-out motion-reduce:transform-none motion-reduce:transition-none",
          expanded
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        )}
        data-slot="query-history-disclosure"
        id={detailsId}
        style={{
          transform: expanded
            ? "translateY(0)"
            : `translateY(-${DISCLOSURE_MOTION.offsetPx}px)`,
          transitionDuration: `${DISCLOSURE_MOTION.durationMs}ms`,
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className="mb-3 overflow-hidden rounded-md border border-border/60 bg-background"
            data-slot="query-history-details"
          >
            <pre className="neon-scroll-fade !m-0 max-h-48 overflow-auto whitespace-pre !rounded-none !border-0 !bg-transparent p-3 font-mono text-[11px] text-foreground leading-relaxed !shadow-none">
              <code>{highlightSQL(entry.query)}</code>
            </pre>
            {entry.error ? (
              <div className="flex items-start gap-2 border-destructive/30 border-t bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
                <HugeiconsIcon
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0"
                  icon={Alert02Icon}
                  strokeWidth={2}
                />
                <p className="min-w-0 break-words">{entry.error}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
};

const QueryHistorySkeleton = ({
  label,
  className,
  ...props
}: ComponentProps<"div"> & { label: string }) => (
  <div
    aria-busy="true"
    className={cn(
      "w-full min-w-0 overflow-hidden rounded-lg border border-border/60 bg-card shadow-xs",
      className
    )}
    data-slot="query-history"
    data-state="loading"
    {...props}
  >
    <div className="flex items-center justify-between gap-3 border-border/50 border-b px-3 py-3">
      <span className="font-medium text-sm">{label}</span>
      <Skeleton className="h-4 w-8" />
    </div>
    <div className="space-y-px p-3">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
);

const getRootState = (error: Error | string | null, count: number) => {
  if (error) {
    return "error";
  }
  return count > 0 ? "ready" : "empty";
};

const QueryHistoryBody = ({
  entries,
  visibleEntries,
  error,
  empty,
  copiedId,
  expandedId,
  runningId,
  copy,
  setExpandedId,
  onRerun,
  onSavedChange,
}: {
  entries: QueryHistoryEntry[];
  visibleEntries: QueryHistoryEntry[];
  error: Error | string | null;
  empty?: ReactNode;
  copiedId: string | null;
  expandedId: string | null;
  runningId: string | null;
  copy: (entry: QueryHistoryEntry) => Promise<void>;
  setExpandedId: (id: string | null) => void;
  onRerun?: (entry: QueryHistoryEntry) => void | Promise<void>;
  onSavedChange?: (entry: QueryHistoryEntry, saved: boolean) => void;
}) => {
  if (error) {
    return (
      <div className="flex items-start gap-2 p-4 text-sm" role="alert">
        <HugeiconsIcon
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-destructive"
          icon={Alert02Icon}
          strokeWidth={2}
        />
        <div className="min-w-0">
          <p className="font-medium text-foreground">History unavailable</p>
          <p className="mt-0.5 text-muted-foreground text-xs">
            {typeof error === "string" ? error : error.message}
          </p>
        </div>
      </div>
    );
  }

  if (visibleEntries.length === 0) {
    const hasEntries = entries.length > 0;
    return (
      <div className="p-3">
        {empty ?? (
          <EmptyState
            description={
              hasEntries
                ? "Try another search or clear the current filter."
                : "Queries appear here after they run."
            }
            title={hasEntries ? "No matches" : "No queries yet"}
          />
        )}
      </div>
    );
  }

  return (
    <ul aria-label="Recorded queries" className="min-w-0">
      {visibleEntries.map((entry) => (
        <QueryRow
          copied={copiedId === entry.id}
          entry={entry}
          expanded={expandedId === entry.id}
          key={entry.id}
          onCopy={() => copy(entry)}
          onExpandedChange={() =>
            setExpandedId(expandedId === entry.id ? null : entry.id)
          }
          onRerun={onRerun ? () => onRerun(entry) : undefined}
          onSavedChange={
            onSavedChange ? () => onSavedChange(entry, !entry.saved) : undefined
          }
          running={runningId === entry.id}
        />
      ))}
    </ul>
  );
};

export const QueryHistory = ({
  entries,
  query: queryProp,
  defaultQuery = "",
  onQueryChange,
  filter: filterProp,
  defaultFilter = "all",
  onFilterChange,
  expandedId: expandedIdProp,
  defaultExpandedId = null,
  onExpandedIdChange,
  onRerun,
  runningId: runningIdProp,
  onSavedChange,
  onCopy,
  isLoading = false,
  error = null,
  empty,
  label = "Query history",
  className,
  ...props
}: QueryHistoryProps) => {
  const [query, setQuery] = useControllableValue({
    defaultProp: defaultQuery,
    onChange: onQueryChange,
    prop: queryProp,
  });
  const [filter, setFilter] = useControllableValue<QueryHistoryFilter>({
    defaultProp: defaultFilter,
    onChange: onFilterChange,
    prop: filterProp,
  });
  const [expandedId, setExpandedId] = useControllableValue<string | null>({
    defaultProp: defaultExpandedId,
    onChange: onExpandedIdChange,
    prop: expandedIdProp,
  });
  const { copiedId, copy } = useCopyQuery(onCopy);
  const [internalRunningId, setInternalRunningId] = useState<string | null>(
    null
  );
  const runningId =
    runningIdProp === undefined ? internalRunningId : runningIdProp;

  const rerun = async (entry: QueryHistoryEntry) => {
    if (!onRerun) {
      return;
    }
    setInternalRunningId(entry.id);
    try {
      await onRerun(entry);
    } finally {
      setInternalRunningId(null);
    }
  };

  const visibleEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return entries.filter((entry) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "saved" && entry.saved) ||
        (filter === "failed" && entry.status === "error");
      if (!matchesFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return [entry.query, entry.database, entry.branch, entry.command]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));
    });
  }, [entries, filter, query]);

  if (isLoading) {
    return (
      <QueryHistorySkeleton className={className} label={label} {...props} />
    );
  }

  return (
    <div
      className={cn(
        "@container w-full min-w-0 overflow-hidden rounded-lg border border-border/60 bg-card shadow-xs",
        className
      )}
      data-filter={filter}
      data-slot="query-history"
      data-state={getRootState(error, visibleEntries.length)}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-2 border-border/50 border-b px-3 py-3">
        <div className="mr-auto min-w-0">
          <p className="font-medium text-foreground text-sm">{label}</p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {entries.length.toLocaleString()} recorded
          </p>
        </div>
        <FilterControl onChange={setFilter} value={filter} />
      </div>

      <div className="border-border/50 border-b p-2.5">
        <label className="flex h-8 min-w-0 items-center gap-2 rounded-md border border-border/60 bg-background px-2.5 text-muted-foreground focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
          <HugeiconsIcon
            aria-hidden="true"
            className="size-3.5 shrink-0"
            icon={Search01Icon}
            strokeWidth={2}
          />
          <span className="sr-only">Search query history</span>
          <input
            className="min-w-0 flex-1 bg-transparent text-foreground text-xs outline-none placeholder:text-muted-foreground/70 [@media(pointer:coarse)]:text-base"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search SQL, branch, or database"
            type="search"
            value={query}
          />
          {query ? (
            <button
              className="shrink-0 rounded-sm px-1 text-[10px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              onClick={() => setQuery("")}
              type="button"
            >
              Clear
            </button>
          ) : null}
        </label>
      </div>

      <TooltipProvider>
        <QueryHistoryBody
          copiedId={copiedId}
          copy={copy}
          empty={empty}
          entries={entries}
          error={error}
          expandedId={expandedId}
          onRerun={onRerun ? rerun : undefined}
          onSavedChange={onSavedChange}
          runningId={runningId}
          setExpandedId={setExpandedId}
          visibleEntries={visibleEntries}
        />
      </TooltipProvider>

      <p aria-live="polite" className="sr-only">
        {visibleEntries.length}{" "}
        {visibleEntries.length === 1 ? "query" : "queries"}
        {query || filter !== "all" ? " shown" : " recorded"}.
      </p>
    </div>
  );
};
