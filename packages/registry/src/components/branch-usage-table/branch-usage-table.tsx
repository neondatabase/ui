"use client";

import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface BranchUsageColumn {
  /** Keys into each row's `metrics`, e.g. "compute_unit_seconds". */
  id: string;
  /** Column header, e.g. "Compute". */
  label: string;
  /** Unit suffix beside the header, e.g. "CU-hrs". */
  unit?: string;
  /** Per-column formatter; falls back to two decimals. */
  format?: (value: number) => string;
}

export interface BranchUsageRow {
  /** Branch id, e.g. "br-young-sky-a1b2c3d4". */
  id: string;
  /** Branch name, e.g. "main" or "ci/pr-4821". */
  name: string;
  /** Column id -> value, already converted to the display unit. */
  metrics: Record<string, number>;
  /** Marks the project's default branch. */
  isDefault?: boolean;
  /** Marks a protected branch. */
  isProtected?: boolean;
  /** Quiet second line, e.g. the parent branch or last-active time. */
  hint?: string;
}

export type SortDirection = "asc" | "desc";

export interface BranchUsageSort {
  /** Column id to sort by. */
  columnId: string;
  direction: SortDirection;
}

export type BranchUsageTableProps = Omit<
  ComponentProps<"section">,
  "children" | "onSelect"
> & {
  /** One row per branch. */
  rows: BranchUsageRow[];
  /** Metric columns in display order; the first is the default sort. */
  columns: BranchUsageColumn[];
  /**
   * "table" compares branches across metrics; "list" reads as a ranking
   * of one. "auto" picks list for a single column, because one metric per
   * row is a list and a table shape only adds a header and an axis.
   */
  layout?: "auto" | "table" | "list";
  /** Panel heading. */
  title?: string;
  /** Controlled sort. */
  sort?: BranchUsageSort;
  /** Uncontrolled initial sort; defaults to the first column, descending. */
  defaultSort?: BranchUsageSort;
  onSortChange?: (sort: BranchUsageSort) => void;
  /**
   * Show only the top N rows and collapse the rest into one row that
   * expands. Branch fleets run to hundreds; a table that long answers
   * nothing.
   */
  topN?: number;
  /** Adds a muted totals row across every branch, collapsed ones included. */
  showTotals?: boolean;
  /** Makes rows clickable, e.g. to open the branch. */
  onSelectBranch?: (row: BranchUsageRow) => void;
  /** Right-side header slot, e.g. a project filter. */
  action?: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  /** Shown when `rows` is empty. */
  empty?: ReactNode;
  /** Quiet footer, e.g. a metering-lag notice. */
  meteredThrough?: string;
};

/* ─────────────────────────────────────────────────────────
 * TABLE STORYBOARD
 *
 *  shape     a table earns its keep by comparing branches
 *            across metrics. With one metric it degrades to
 *            a list, because a lone column needs neither a
 *            header row nor an alignment axis
 *  rank      the sorted column carries a hairline rule
 *            along the bottom of its cell, left-anchored
 *            and scaled to the largest row. A filled block
 *            behind the digits reads as "this cell is
 *            selected"; a rule reads as magnitude
 *  sort      every sortable header shows its caret, muted
 *            until it's the active one. An affordance you
 *            only see after using it isn't an affordance
 *  tail      past topN the rest collapse into one row that
 *            says how many and opens on click. It sits
 *            below a rule, outside the ranking, so its
 *            value can't look like a broken sort
 *  total     a muted totals row across every branch, so one
 *            row's share is readable without doing the
 *            addition
 *  narrow    under 40rem the columns stack into label and
 *            value pairs — one DOM, no horizontal scroll
 * ───────────────────────────────────────────────────────── */

const DEFAULT_FORMAT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const TOTALS_ID = "__totals__";
const FULL_BAR = 100;
/** Below this width the columns stack; matches the max-[40rem] variants. */
const STACK_AT = "max-[40rem]";

const formatCell = (column: BranchUsageColumn, value: number) =>
  column.format ? column.format(value) : DEFAULT_FORMAT.format(value);

/** Sorted columns announce their direction; the rest announce "none". */
const ariaSortOf = (isActive: boolean, direction: SortDirection) => {
  if (!isActive) {
    return "none" as const;
  }

  return direction === "desc"
    ? ("descending" as const)
    : ("ascending" as const);
};

const sumBy = (rows: BranchUsageRow[], columnId: string) => {
  let total = 0;

  for (const row of rows) {
    total += row.metrics[columnId] ?? 0;
  }

  return total;
};

/** Sorts, partitions past topN, and measures the ranked column. */
const shapeRows = (
  rows: BranchUsageRow[],
  activeSort: BranchUsageSort,
  topN: number | undefined,
  isTailOpen: boolean
) => {
  const ranked = [...rows].toSorted((a, b) => {
    const left = a.metrics[activeSort.columnId] ?? 0;
    const right = b.metrics[activeSort.columnId] ?? 0;

    return activeSort.direction === "desc" ? right - left : left - right;
  });

  const isCollapsed = topN !== undefined && ranked.length > topN && !isTailOpen;
  const head = isCollapsed ? ranked.slice(0, topN) : ranked;

  return {
    head,
    peak: Math.max(
      ...head.map((row) => row.metrics[activeSort.columnId] ?? 0),
      0
    ),
    ranked,
    tail: isCollapsed ? ranked.slice(topN) : [],
  };
};

const SortCaret = ({
  direction,
  isActive,
}: {
  direction: SortDirection;
  isActive: boolean;
}) => (
  <span
    aria-hidden="true"
    className={cn(
      "text-[10px]",
      isActive ? "text-primary" : "text-muted-foreground/40"
    )}
  >
    {isActive && direction === "asc" ? "▲" : "▼"}
  </span>
);

const BranchTag = ({ children }: { children: ReactNode }) => (
  <span className="rounded-full border border-border/60 px-1.5 py-px text-[10px] text-muted-foreground">
    {children}
  </span>
);

/** Branch name, tags, and hint. Shared by both layouts. */
const BranchLabel = ({
  isInteractive,
  onSelect,
  row,
}: {
  isInteractive: boolean;
  onSelect?: () => void;
  row: BranchUsageRow;
}) => (
  <>
    <span className="flex items-center gap-1.5">
      {isInteractive ? (
        <button
          className="truncate rounded font-mono text-[13px] text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={onSelect}
          title={row.name}
          type="button"
        >
          {row.name}
        </button>
      ) : (
        <span
          className="truncate font-mono text-[13px] text-foreground"
          title={row.name}
        >
          {row.name}
        </span>
      )}
      {row.isDefault ? <BranchTag>default</BranchTag> : null}
      {row.isProtected ? <BranchTag>protected</BranchTag> : null}
    </span>
    {row.hint ? (
      <span className="block truncate text-[10px] text-muted-foreground/70">
        {row.hint}
      </span>
    ) : null}
  </>
);

/**
 * A metric cell. The share rule sits along the bottom edge rather than
 * behind the digits, so it can't be mistaken for a selection highlight.
 */
const MetricCell = ({
  column,
  isMuted,
  isSorted,
  share,
  value,
}: {
  column: BranchUsageColumn;
  isMuted: boolean;
  isSorted: boolean;
  share: number;
  value: number;
}) => (
  <td
    className={cn(
      "relative py-1.5 pl-3 text-right font-mono text-[13px] tabular-nums",
      `${STACK_AT}:flex ${STACK_AT}:justify-between ${STACK_AT}:pl-0`,
      `${STACK_AT}:before:text-muted-foreground ${STACK_AT}:before:text-xs ${STACK_AT}:before:font-sans ${STACK_AT}:before:content-[attr(data-label)]`,
      isMuted && "text-muted-foreground"
    )}
    data-label={column.label}
  >
    {formatCell(column, value)}
    {isSorted ? (
      <span
        aria-hidden="true"
        className={`absolute bottom-1 left-3 h-px bg-primary/60 ${STACK_AT}:hidden`}
        style={{ width: `calc((100% - 0.75rem) * ${share})` }}
      />
    ) : null}
  </td>
);

const SortableHeader = ({
  activeSort,
  column,
  onToggle,
}: {
  activeSort: BranchUsageSort;
  column: BranchUsageColumn;
  onToggle: () => void;
}) => {
  const isActive = activeSort.columnId === column.id;

  return (
    <th
      aria-sort={ariaSortOf(isActive, activeSort.direction)}
      className="py-1.5 pl-3 text-right font-normal"
      scope="col"
    >
      <button
        className="inline-flex items-center gap-1 rounded text-muted-foreground text-xs transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        onClick={onToggle}
        type="button"
      >
        {column.label}
        {column.unit ? (
          <span className="text-[10px] text-muted-foreground/60">
            {column.unit}
          </span>
        ) : null}
        <SortCaret direction={activeSort.direction} isActive={isActive} />
      </button>
    </th>
  );
};

/** One metric: a ranked list, not a one-column table. */
const RankedList = ({
  column,
  isInteractive,
  onOpenTail,
  onSelectBranch,
  peak,
  rows,
  showTotals,
  tail,
  totalRows,
}: {
  column: BranchUsageColumn;
  isInteractive: boolean;
  onOpenTail: () => void;
  onSelectBranch?: (row: BranchUsageRow) => void;
  peak: number;
  rows: BranchUsageRow[];
  showTotals: boolean;
  tail: BranchUsageRow[];
  totalRows: BranchUsageRow[];
}) => (
  <ul className="space-y-0.5" data-slot="branch-usage-list">
    {rows.map((row) => {
      const value = row.metrics[column.id] ?? 0;

      return (
        <li
          className="border-border/30 border-b py-1.5 last:border-b-0"
          key={row.id}
        >
          <div className="flex items-baseline gap-3">
            <span className="min-w-0 flex-1">
              <BranchLabel
                isInteractive={isInteractive}
                onSelect={() => onSelectBranch?.(row)}
                row={row}
              />
            </span>
            <span className="font-mono text-[13px] text-foreground tabular-nums">
              {formatCell(column, value)}
            </span>
          </div>
          <div aria-hidden="true" className="mt-1 h-px w-full bg-muted">
            <div
              className="h-px bg-primary/60"
              style={{ width: `${(peak > 0 ? value / peak : 0) * FULL_BAR}%` }}
            />
          </div>
        </li>
      );
    })}

    {/* The tail and the total belong in both layouts; a list that drops
        them answers a smaller question than the table does. */}
    {tail.length > 0 ? (
      <li className="flex items-baseline gap-3 border-border/50 border-t pt-2">
        <button
          className="flex-1 rounded text-left text-muted-foreground text-xs transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={onOpenTail}
          type="button"
        >
          {`${tail.length} other branches`}
          <span className="ml-1.5 text-[10px] text-muted-foreground/60">
            show
          </span>
        </button>
        <span className="font-mono text-[13px] text-muted-foreground tabular-nums">
          {formatCell(column, sumBy(tail, column.id))}
        </span>
      </li>
    ) : null}

    {showTotals ? (
      <li className="flex items-baseline gap-3 border-border/50 border-t pt-2">
        <span className="flex-1 text-muted-foreground text-xs">
          {`all ${totalRows.length} branches`}
        </span>
        <span className="font-mono text-[13px] text-muted-foreground tabular-nums">
          {formatCell(column, sumBy(totalRows, column.id))}
        </span>
      </li>
    ) : null}
  </ul>
);

const TailRow = ({
  columns,
  onOpen,
  tail,
}: {
  columns: BranchUsageColumn[];
  onOpen: () => void;
  tail: BranchUsageRow[];
}) => (
  <tr
    className={`border-border/50 border-t ${STACK_AT}:block ${STACK_AT}:py-2`}
  >
    <td className={`py-1.5 pr-3 ${STACK_AT}:block`}>
      {/* Outside the ranking, so its value can't read as a sort gone wrong. */}
      <button
        className="rounded text-muted-foreground text-xs transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        onClick={onOpen}
        type="button"
      >
        {tail.length} other branches
        <span className="ml-1.5 text-[10px] text-muted-foreground/60">
          show
        </span>
      </button>
    </td>
    {columns.map((column) => (
      <MetricCell
        column={column}
        isMuted
        isSorted={false}
        key={column.id}
        share={0}
        value={sumBy(tail, column.id)}
      />
    ))}
  </tr>
);

const TotalsRow = ({
  columns,
  rows,
}: {
  columns: BranchUsageColumn[];
  rows: BranchUsageRow[];
}) => (
  <tr
    className={`border-border/50 border-t ${STACK_AT}:block ${STACK_AT}:py-2`}
  >
    <td
      className={`py-1.5 pr-3 text-muted-foreground text-xs ${STACK_AT}:block`}
    >
      {`all ${rows.length} branches`}
    </td>
    {columns.map((column) => (
      <MetricCell
        column={column}
        isMuted
        isSorted={false}
        key={`${TOTALS_ID}-${column.id}`}
        share={0}
        value={sumBy(rows, column.id)}
      />
    ))}
  </tr>
);

/** The comparison layout: one row per branch, one column per metric. */
const UsageTable = ({
  activeSort,
  columns,
  head,
  isInteractive,
  onOpenTail,
  onSelectBranch,
  onToggleSort,
  peak,
  showTotals,
  tail,
  totalRows,
}: {
  activeSort: BranchUsageSort;
  columns: BranchUsageColumn[];
  head: BranchUsageRow[];
  isInteractive: boolean;
  onOpenTail: () => void;
  onSelectBranch?: (row: BranchUsageRow) => void;
  onToggleSort: (columnId: string) => void;
  peak: number;
  showTotals: boolean;
  tail: BranchUsageRow[];
  totalRows: BranchUsageRow[];
}) => (
  <table className="w-full border-collapse text-xs">
    <thead className={`${STACK_AT}:hidden`}>
      <tr className="border-border/50 border-b">
        <th
          className="py-1.5 pr-3 text-left font-normal text-muted-foreground text-xs"
          scope="col"
        >
          Branch
        </th>
        {columns.map((column) => (
          <SortableHeader
            activeSort={activeSort}
            column={column}
            key={column.id}
            onToggle={() => onToggleSort(column.id)}
          />
        ))}
      </tr>
    </thead>
    <tbody className={`${STACK_AT}:block`}>
      {head.map((row) => (
        <tr
          className={cn(
            "border-border/30 border-b transition-colors last:border-b-0",
            isInteractive && "hover:bg-muted/40",
            `${STACK_AT}:block ${STACK_AT}:py-2`
          )}
          key={row.id}
        >
          <td
            className={`max-w-[220px] py-1.5 pr-3 ${STACK_AT}:block ${STACK_AT}:max-w-none`}
          >
            <BranchLabel
              isInteractive={isInteractive}
              onSelect={() => onSelectBranch?.(row)}
              row={row}
            />
          </td>
          {columns.map((column) => (
            <MetricCell
              column={column}
              isMuted={false}
              isSorted={column.id === activeSort.columnId}
              key={column.id}
              share={peak > 0 ? (row.metrics[column.id] ?? 0) / peak : 0}
              value={row.metrics[column.id] ?? 0}
            />
          ))}
        </tr>
      ))}
    </tbody>

    {tail.length > 0 || showTotals ? (
      <tfoot className={`${STACK_AT}:block`}>
        {tail.length > 0 ? (
          <TailRow columns={columns} onOpen={onOpenTail} tail={tail} />
        ) : null}
        {showTotals ? <TotalsRow columns={columns} rows={totalRows} /> : null}
      </tfoot>
    ) : null}
  </table>
);

/** Empty, list, or table: one decision, made once. */
const UsageBody = ({
  activeSort,
  asList,
  columns,
  empty,
  head,
  isInteractive,
  onOpenTail,
  onSelectBranch,
  onToggleSort,
  peak,
  ranked,
  showTotals,
  tail,
  totalRows,
}: {
  activeSort: BranchUsageSort;
  asList: boolean;
  columns: BranchUsageColumn[];
  empty?: ReactNode;
  head: BranchUsageRow[];
  isInteractive: boolean;
  onOpenTail: () => void;
  onSelectBranch?: (row: BranchUsageRow) => void;
  onToggleSort: (columnId: string) => void;
  peak: number;
  ranked: BranchUsageRow[];
  showTotals: boolean;
  tail: BranchUsageRow[];
  totalRows: BranchUsageRow[];
}) => {
  const [firstColumn] = columns;

  if (ranked.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border border-border/50 border-dashed">
        {empty ?? (
          <p className="text-muted-foreground text-xs">
            no branch consumption in this window
          </p>
        )}
      </div>
    );
  }

  if (asList && firstColumn) {
    return (
      <RankedList
        column={firstColumn}
        isInteractive={isInteractive}
        onOpenTail={onOpenTail}
        onSelectBranch={onSelectBranch}
        peak={peak}
        rows={head}
        showTotals={showTotals}
        tail={tail}
        totalRows={totalRows}
      />
    );
  }

  return (
    <UsageTable
      activeSort={activeSort}
      columns={columns}
      head={head}
      isInteractive={isInteractive}
      onOpenTail={onOpenTail}
      onSelectBranch={onSelectBranch}
      onToggleSort={onToggleSort}
      peak={peak}
      showTotals={showTotals}
      tail={tail}
      totalRows={totalRows}
    />
  );
};

const LoadingCard = ({ className, ...props }: ComponentProps<"section">) => (
  <section
    className={cn("rounded-lg border border-border/60 bg-card p-4", className)}
    data-slot="branch-usage-table"
    {...props}
  >
    <Skeleton className="h-4 w-32" />
    <div className="mt-4 space-y-2.5">
      {Array.from({ length: 5 }, (_, index) => index).map((index) => (
        <Skeleton className="h-7 w-full" key={index} />
      ))}
    </div>
  </section>
);

export const BranchUsageTable = ({
  action,
  className,
  columns,
  defaultSort,
  empty,
  error = null,
  isLoading = false,
  layout = "auto",
  meteredThrough,
  onSelectBranch,
  onSortChange,
  rows,
  showTotals = true,
  sort,
  title = "usage by branch",
  topN,
  ...props
}: BranchUsageTableProps) => {
  const [firstColumn] = columns;
  const [internalSort, setInternalSort] = useState<BranchUsageSort>(
    defaultSort ?? { columnId: firstColumn?.id ?? "", direction: "desc" }
  );
  const [isTailOpen, setIsTailOpen] = useState(false);
  const activeSort = sort ?? internalSort;

  const toggleSort = (columnId: string) => {
    const isActive = activeSort.columnId === columnId;
    const next: BranchUsageSort = {
      columnId,
      direction: isActive && activeSort.direction === "desc" ? "asc" : "desc",
    };

    if (sort === undefined) {
      setInternalSort(next);
    }

    onSortChange?.(next);
  };

  const { head, peak, ranked, tail } = shapeRows(
    rows,
    activeSort,
    topN,
    isTailOpen
  );
  const isInteractive = Boolean(onSelectBranch);
  const asList =
    layout === "list" || (layout === "auto" && columns.length <= 1);

  if (isLoading) {
    return <LoadingCard className={className} {...props} />;
  }

  return (
    <section
      className={cn(
        "rounded-lg border border-border/60 bg-card p-4",
        className
      )}
      data-slot="branch-usage-table"
      {...props}
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-mono text-muted-foreground text-xs">{title}</h3>
        {action}
      </header>

      {error ? (
        <p
          className="mb-3 flex items-baseline gap-2 text-sm"
          data-slot="branch-usage-table-error"
          role="alert"
        >
          <span className="font-mono text-destructive text-xs">error</span>
          <span className="text-foreground">{error}</span>
        </p>
      ) : null}

      <UsageBody
        activeSort={activeSort}
        asList={asList}
        columns={columns}
        empty={empty}
        head={head}
        isInteractive={isInteractive}
        onOpenTail={() => setIsTailOpen(true)}
        onSelectBranch={onSelectBranch}
        onToggleSort={toggleSort}
        peak={peak}
        ranked={ranked}
        showTotals={showTotals}
        tail={tail}
        totalRows={rows}
      />

      {meteredThrough ? (
        <p
          className="mt-3 text-[10px] text-muted-foreground/70 tabular-nums"
          data-slot="branch-usage-table-lag"
        >
          {meteredThrough}
        </p>
      ) : null}
    </section>
  );
};
