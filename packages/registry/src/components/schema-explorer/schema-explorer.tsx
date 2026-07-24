"use client";

import {
  ArrowRight01Icon,
  Cancel01Icon,
  Database01Icon,
  HashIcon,
  Key01Icon,
  Link01Icon,
  Search01Icon,
  Table01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps, KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

export interface ColumnRef {
  table: string;
  column: string;
}

export interface Column {
  name: string;
  /** SQL type, e.g. "uuid", "text", or "timestamptz". */
  type: string;
  primaryKey?: boolean;
  unique?: boolean;
  nullable?: boolean;
  references?: ColumnRef;
}

export interface Index {
  name: string;
  columns: string[];
  unique?: boolean;
}

export interface Table {
  name: string;
  /** Postgres schema; defaults to "public". */
  schema?: string;
  columns: Column[];
  indexes?: Index[];
  /** Approximate row count. */
  rowCount?: number;
}

interface TreeRow {
  id: string;
  kind: "table" | "column" | "index" | "relation";
  table: Table;
  column?: Column;
  index?: Index;
}

const formatCount = (value: number) => {
  const formatter = new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
    notation: "compact",
  });
  return formatter.format(value).toLowerCase();
};

const normalize = (value: string) => value.trim().toLowerCase();

const includesQuery = (value: string, query: string) =>
  value.toLowerCase().includes(query);

const getTableMatches = (table: Table, query: string) => {
  if (!query || includesQuery(table.name, query)) {
    return {
      columns: table.columns,
      indexes: table.indexes ?? [],
      tableMatches: true,
    };
  }

  return {
    columns: table.columns.filter(
      (column) =>
        includesQuery(column.name, query) || includesQuery(column.type, query)
    ),
    indexes: (table.indexes ?? []).filter(
      (index) =>
        includesQuery(index.name, query) ||
        index.columns.some((column) => includesQuery(column, query))
    ),
    tableMatches: false,
  };
};

const getVisibleRows = (
  tables: Table[],
  openTables: Set<string>,
  query: string
) => {
  const rows: TreeRow[] = [];
  for (const table of tables) {
    const matches = getTableMatches(table, query);
    const relations = matches.columns.filter((column) => column.references);
    const isVisible =
      matches.tableMatches ||
      matches.columns.length > 0 ||
      matches.indexes.length > 0;

    if (!isVisible) {
      continue;
    }

    rows.push({ id: `table:${table.name}`, kind: "table", table });
    if (!(openTables.has(table.name) || query)) {
      continue;
    }

    for (const column of matches.columns) {
      rows.push({
        column,
        id: `column:${table.name}:${column.name}`,
        kind: "column",
        table,
      });
    }
    for (const index of matches.indexes) {
      rows.push({
        id: `index:${table.name}:${index.name}`,
        index,
        kind: "index",
        table,
      });
    }
    for (const column of relations) {
      rows.push({
        column,
        id: `relation:${table.name}:${column.name}`,
        kind: "relation",
        table,
      });
    }
  }
  return rows;
};

const Match = ({ children, query }: { children: string; query: string }) => {
  if (!query) {
    return children;
  }
  const start = children.toLowerCase().indexOf(query);
  if (start === -1) {
    return children;
  }
  const end = start + query.length;
  return (
    <>
      {children.slice(0, start)}
      <mark className="rounded-sm bg-primary/15 text-primary">
        {children.slice(start, end)}
      </mark>
      {children.slice(end)}
    </>
  );
};

const Constraint = ({ children }: { children: string }) => (
  <span className="rounded-[3px] border border-border/70 bg-background px-1 py-px font-medium text-[9px] text-muted-foreground leading-none">
    {children}
  </span>
);

const TableRow = ({
  treeId,
  table,
  open,
  query,
  active,
  tabIndex,
  onFocus,
  onToggle,
}: {
  treeId: string;
  table: Table;
  open: boolean;
  query: string;
  active: boolean;
  tabIndex: number;
  onFocus: () => void;
  onToggle: () => void;
}) => (
  <button
    aria-expanded={open}
    aria-level={1}
    className={cn(
      "group flex min-h-10 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left outline-none",
      "hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50",
      "active:bg-muted data-[state=open]:bg-muted/35"
    )}
    data-active={active ? "true" : undefined}
    data-state={open ? "open" : "closed"}
    data-tree-id={treeId}
    onClick={onToggle}
    onFocus={onFocus}
    role="treeitem"
    tabIndex={tabIndex}
    type="button"
  >
    <HugeiconsIcon
      aria-hidden="true"
      className={cn(
        "size-3.5 shrink-0 text-muted-foreground transition-transform duration-100 motion-reduce:transition-none",
        open && "rotate-90"
      )}
      icon={ArrowRight01Icon}
      strokeWidth={2}
    />
    <span className="grid size-6 shrink-0 place-items-center rounded-md border border-border/60 bg-background shadow-xs">
      <HugeiconsIcon
        aria-hidden="true"
        className="size-3.5 text-muted-foreground group-data-[state=open]:text-foreground"
        icon={Table01Icon}
        strokeWidth={2}
      />
    </span>
    <span className="min-w-0 truncate font-medium text-xs">
      <Match query={query}>{table.name}</Match>
    </span>
    <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground tabular-nums">
      <span>{table.columns.length} columns</span>
      {table.rowCount === undefined ? null : (
        <>
          <span aria-hidden="true" className="text-border">
            /
          </span>
          <span>{formatCount(table.rowCount)} rows</span>
        </>
      )}
    </span>
  </button>
);

const LeafRow = ({
  treeId,
  row,
  query,
  active,
  tabIndex,
  onFocus,
  onSelect,
}: {
  treeId: string;
  row: TreeRow;
  query: string;
  active: boolean;
  tabIndex: number;
  onFocus: () => void;
  onSelect: () => void;
}) => {
  const { column, index, kind } = row;
  const isColumn = kind === "column" && column;
  const relation = kind === "relation" ? column?.references : undefined;

  return (
    <button
      aria-level={2}
      className={cn(
        "group relative flex min-h-8 w-full min-w-0 items-center gap-2 rounded-md pr-2 pl-11 text-left outline-none",
        "before:absolute before:top-0 before:bottom-0 before:left-[18px] before:w-px before:bg-border/60",
        "after:absolute after:top-1/2 after:left-[18px] after:h-px after:w-3 after:bg-border/60",
        "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50 active:bg-muted"
      )}
      data-active={active ? "true" : undefined}
      data-tree-id={treeId}
      onClick={onSelect}
      onFocus={onFocus}
      role="treeitem"
      tabIndex={tabIndex}
      type="button"
    >
      <span className="flex size-3.5 shrink-0 items-center justify-center text-muted-foreground/65">
        {column?.primaryKey ? (
          <HugeiconsIcon
            aria-label="Primary key"
            className="size-3.5 text-primary"
            icon={Key01Icon}
            strokeWidth={2}
          />
        ) : null}
        {kind === "index" ? (
          <HugeiconsIcon
            aria-hidden="true"
            className="size-3"
            icon={HashIcon}
            strokeWidth={2}
          />
        ) : null}
        {kind === "relation" ? (
          <HugeiconsIcon
            aria-hidden="true"
            className="size-3"
            icon={Link01Icon}
            strokeWidth={2}
          />
        ) : null}
      </span>

      {isColumn ? (
        <>
          <code className="min-w-0 truncate bg-transparent p-0 text-foreground/90 text-xs">
            <Match query={query}>{column.name}</Match>
          </code>
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            {column.references ? <Constraint>FK</Constraint> : null}
            {column.unique && !column.primaryKey ? (
              <Constraint>UNIQUE</Constraint>
            ) : null}
            {column.nullable ? <Constraint>NULL</Constraint> : null}
            <code className="w-20 truncate bg-transparent p-0 text-right text-[11px] text-muted-foreground">
              <Match query={query}>{column.type}</Match>
            </code>
          </span>
        </>
      ) : null}

      {index ? (
        <>
          <code className="min-w-0 truncate bg-transparent p-0 text-foreground/80 text-[11px]">
            <Match query={query}>{index.name}</Match>
          </code>
          <span className="ml-auto flex min-w-0 items-center gap-1.5">
            {index.unique ? <Constraint>UNIQUE</Constraint> : null}
            <code className="max-w-28 truncate bg-transparent p-0 text-[10px] text-muted-foreground">
              {index.columns.join(", ")}
            </code>
          </span>
        </>
      ) : null}

      {relation && column ? (
        <>
          <code className="min-w-0 truncate bg-transparent p-0 text-foreground/80 text-[11px]">
            {column.name}
          </code>
          <HugeiconsIcon
            aria-hidden="true"
            className="size-3 shrink-0 text-muted-foreground/50"
            icon={ArrowRight01Icon}
            strokeWidth={2}
          />
          <code className="min-w-0 truncate bg-transparent p-0 text-[11px] text-muted-foreground">
            {relation.table}.{relation.column}
          </code>
        </>
      ) : null}
    </button>
  );
};

const LoadingTree = () => (
  <output aria-label="Loading schema" className="block space-y-1 p-2">
    {[72, 58, 84, 64].map((width) => (
      <div className="flex h-10 items-center gap-2 px-2" key={width}>
        <span className="size-3.5 animate-pulse rounded-sm bg-muted motion-reduce:animate-none" />
        <span className="size-6 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
        <span
          className="h-3 animate-pulse rounded bg-muted motion-reduce:animate-none"
          style={{ width }}
        />
      </div>
    ))}
  </output>
);

export type SchemaExplorerProps = Omit<ComponentProps<"div">, "children"> & {
  tables: Table[];
  /** Expanded table names when controlled. */
  expanded?: string[];
  /** Table names expanded on first render. */
  defaultExpanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  onColumnSelect?: (table: Table, column: Column) => void;
  onIndexSelect?: (table: Table, index: Index) => void;
  title?: string;
  isLoading?: boolean;
};

export const SchemaExplorer = ({
  tables,
  expanded,
  defaultExpanded,
  onExpandedChange,
  onColumnSelect,
  onIndexSelect,
  title = "public",
  isLoading = false,
  className,
  ...props
}: SchemaExplorerProps) => {
  const controlled = expanded !== undefined;
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(
    () => new Set(defaultExpanded)
  );
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(() =>
    tables[0] ? `table:${tables[0].name}` : ""
  );
  const typeahead = useRef("");
  const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const openTables = useMemo(
    () => (controlled ? new Set(expanded) : uncontrolledExpanded),
    [controlled, expanded, uncontrolledExpanded]
  );
  const normalizedQuery = normalize(query);
  const rows = useMemo(
    () => getVisibleRows(tables, openTables, normalizedQuery),
    [tables, openTables, normalizedQuery]
  );
  const tableCount = rows.filter((row) => row.kind === "table").length;
  const [firstRow] = rows;
  const resolvedActiveId = rows.some((row) => row.id === activeId)
    ? activeId
    : (firstRow?.id ?? "");

  useEffect(
    () => () => {
      if (typeaheadTimer.current) {
        clearTimeout(typeaheadTimer.current);
      }
    },
    []
  );

  const setOpenTables = (next: Set<string>) => {
    if (!controlled) {
      setUncontrolledExpanded(next);
    }
    onExpandedChange?.([...next]);
  };

  const toggleTable = (name: string, force?: boolean) => {
    const next = new Set(openTables);
    const shouldOpen = force ?? !next.has(name);
    if (shouldOpen) {
      next.add(name);
    } else {
      next.delete(name);
    }
    setOpenTables(next);
  };

  const activateTable = (name: string) => {
    if (normalizedQuery) {
      setQuery("");
      toggleTable(name, true);
      return;
    }
    toggleTable(name);
  };

  const focusRow = (id: string) => {
    setActiveId(id);
    requestAnimationFrame(() => {
      treeRef.current
        ?.querySelector<HTMLElement>(`[data-tree-id="${CSS.escape(id)}"]`)
        ?.focus();
    });
  };

  const navigateByOffset = (index: number, offset: number) => {
    const next = rows[Math.max(0, Math.min(rows.length - 1, index + offset))];
    if (next) {
      focusRow(next.id);
    }
  };

  const handleHorizontalKey = (
    event: KeyboardEvent<HTMLDivElement>,
    active: TreeRow,
    index: number
  ) => {
    if (event.key === "ArrowRight" && active.kind === "table") {
      event.preventDefault();
      if (openTables.has(active.table.name) || normalizedQuery) {
        const firstChild = rows[index + 1];
        if (firstChild?.table.name === active.table.name) {
          focusRow(firstChild.id);
        }
      } else {
        toggleTable(active.table.name, true);
      }
      return true;
    }
    if (event.key !== "ArrowLeft") {
      return false;
    }
    event.preventDefault();
    if (active.kind === "table" && openTables.has(active.table.name)) {
      toggleTable(active.table.name, false);
    } else if (active.kind !== "table") {
      focusRow(`table:${active.table.name}`);
    }
    return true;
  };

  const handleTypeahead = (
    event: KeyboardEvent<HTMLDivElement>,
    index: number
  ) => {
    if (
      event.key.length !== 1 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    ) {
      return;
    }
    typeahead.current += event.key.toLowerCase();
    if (typeaheadTimer.current) {
      clearTimeout(typeaheadTimer.current);
    }
    typeaheadTimer.current = setTimeout(() => {
      typeahead.current = "";
    }, 500);
    const ordered = [...rows.slice(index + 1), ...rows.slice(0, index + 1)];
    const match = ordered.find((row) => {
      const label = row.column?.name ?? row.index?.name ?? row.table.name;
      return label.toLowerCase().startsWith(typeahead.current);
    });
    if (match) {
      focusRow(match.id);
    }
  };

  const onTreeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = rows.findIndex((row) => row.id === resolvedActiveId);
    const active = rows[index];
    if (!active) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      navigateByOffset(index, event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const edge = event.key === "Home" ? rows[0] : rows.at(-1);
      focusRow(edge?.id ?? active.id);
      return;
    }
    if (handleHorizontalKey(event, active, index)) {
      return;
    }
    if (
      (event.key === "Enter" || event.key === " ") &&
      active.kind === "table"
    ) {
      event.preventDefault();
      activateTable(active.table.name);
      return;
    }
    if (event.key === "/") {
      event.preventDefault();
      searchRef.current?.focus();
      return;
    }
    handleTypeahead(event, index);
  };

  return (
    <div
      className={cn(
        "@container w-full min-w-0 overflow-hidden rounded-lg border border-border/60 bg-card shadow-xs",
        className
      )}
      data-slot="schema-explorer"
      {...props}
    >
      <header className="flex min-h-11 items-center gap-2 border-border/60 border-b px-3">
        <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary">
          <HugeiconsIcon
            aria-hidden="true"
            className="size-3.5"
            icon={Database01Icon}
            strokeWidth={2}
          />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-xs">{title}</p>
          <p className="text-[10px] text-muted-foreground">
            {tables.length} {tables.length === 1 ? "table" : "tables"}
          </p>
        </div>
        <span className="ml-auto hidden text-[10px] text-muted-foreground @[280px]:block">
          <kbd className="rounded border border-border/60 bg-background px-1 py-0.5 font-sans shadow-xs">
            /
          </kbd>{" "}
          to search
        </span>
      </header>

      <label className="flex h-10 items-center gap-2 border-border/60 border-b px-3 focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring/40">
        <HugeiconsIcon
          aria-hidden="true"
          className="size-3.5 shrink-0 text-muted-foreground"
          icon={Search01Icon}
          strokeWidth={2}
        />
        <input
          className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/65"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a table, column, or type"
          ref={searchRef}
          type="search"
          value={query}
        />
        {query ? (
          <>
            <span
              aria-live="polite"
              className="text-[10px] text-muted-foreground tabular-nums"
            >
              {tableCount} {tableCount === 1 ? "table" : "tables"}
            </span>
            <button
              aria-label="Clear search"
              className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.96] motion-reduce:active:scale-100"
              onClick={() => {
                setQuery("");
                searchRef.current?.focus();
              }}
              type="button"
            >
              <HugeiconsIcon
                aria-hidden="true"
                className="size-3"
                icon={Cancel01Icon}
                strokeWidth={2}
              />
            </button>
          </>
        ) : null}
      </label>

      {isLoading ? <LoadingTree /> : null}

      {!isLoading && rows.length > 0 ? (
        <div
          aria-label={`${title} database schema`}
          className="neon-scroll-fade max-h-96 space-y-0.5 overflow-y-auto p-1.5"
          onKeyDown={onTreeKeyDown}
          ref={treeRef}
          role="tree"
          tabIndex={-1}
        >
          {rows.map((row) => {
            const active = row.id === resolvedActiveId;
            const common = {
              active,
              onFocus: () => setActiveId(row.id),
              query: normalizedQuery,
              tabIndex: active ? 0 : -1,
            };
            return (
              <div key={row.id} role="none">
                {row.kind === "table" ? (
                  <TableRow
                    {...common}
                    onToggle={() => activateTable(row.table.name)}
                    open={
                      openTables.has(row.table.name) || Boolean(normalizedQuery)
                    }
                    table={row.table}
                    treeId={row.id}
                  />
                ) : (
                  <LeafRow
                    {...common}
                    onSelect={() => {
                      if (row.kind === "column" && row.column) {
                        onColumnSelect?.(row.table, row.column);
                      }
                      if (row.kind === "index" && row.index) {
                        onIndexSelect?.(row.table, row.index);
                      }
                    }}
                    row={row}
                    treeId={row.id}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {!isLoading && rows.length === 0 ? (
        <div className="grid min-h-36 place-items-center px-6 py-8 text-center">
          <div>
            <div className="mx-auto mb-2 grid size-8 place-items-center rounded-lg border border-border/60 bg-background shadow-xs">
              <HugeiconsIcon
                aria-hidden="true"
                className="size-3.5 text-muted-foreground"
                icon={Search01Icon}
                strokeWidth={2}
              />
            </div>
            <p className="font-medium text-xs">No schema objects found</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Try a table, column, or Postgres type.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
