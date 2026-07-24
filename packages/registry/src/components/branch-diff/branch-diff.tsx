"use client";

import {
  Alert02Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  GitBranchIcon,
  Search01Icon,
  Table01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { diffWordsWithSpace } from "diff";
import { useMemo, useState } from "react";

import {
  Tabs,
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ChangeKind = "added" | "removed" | "modified";
type DiffTab = "schema" | "data";
type DiffValue = boolean | number | string | null;

interface BranchDiffBranch {
  id: string;
  name: string;
}

interface SchemaChange {
  id: string;
  kind: ChangeKind;
  objectType: "table" | "column" | "index" | "constraint";
  path: string[];
  before?: string;
  after?: string;
  ddl?: string;
  breaking?: boolean;
}

interface RowChange {
  id: string;
  kind: ChangeKind;
  primaryKey: Record<string, DiffValue>;
  before?: Record<string, DiffValue>;
  after?: Record<string, DiffValue>;
}

interface TableDataDiff {
  id: string;
  schema: string;
  table: string;
  primaryKey: string[];
  rows: RowChange[];
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  unchangedCount?: number;
  hasMore?: boolean;
}

interface BranchDiffProps {
  from: BranchDiffBranch;
  to: BranchDiffBranch;
  schemaChanges: SchemaChange[];
  dataDiffs: TableDataDiff[];
  tab?: DiffTab;
  defaultTab?: DiffTab;
  onTabChange?: (tab: DiffTab) => void;
  onLoadMore?: (table: TableDataDiff) => void | Promise<void>;
  loadingTableId?: string | null;
  isLoading?: boolean;
  error?: Error | string | null;
  className?: string;
}

const KIND = {
  added: {
    className: "text-[var(--status-active)]",
    label: "Added",
    surface: "bg-[var(--status-active)]/8",
    symbol: "+",
  },
  modified: {
    className: "text-[var(--status-scaling)]",
    label: "Modified",
    surface: "bg-[var(--status-scaling)]/8",
    symbol: "~",
  },
  removed: {
    className: "text-destructive",
    label: "Removed",
    surface: "bg-destructive/7",
    symbol: "−",
  },
} satisfies Record<ChangeKind, Record<string, string>>;

const countSchemaKinds = (changes: SchemaChange[]) => ({
  added: changes.filter((change) => change.kind === "added").length,
  modified: changes.filter((change) => change.kind === "modified").length,
  removed: changes.filter((change) => change.kind === "removed").length,
});

const countDataKinds = (tables: TableDataDiff[]) => {
  let added = 0;
  let modified = 0;
  let removed = 0;
  for (const table of tables) {
    added += table.addedCount;
    modified += table.modifiedCount;
    removed += table.removedCount;
  }
  return { added, modified, removed };
};

const matchesSearch = (values: string[], query: string) =>
  values.join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase());

const formatValue = (value: DiffValue | undefined) => {
  if (value === undefined) {
    return "—";
  }
  if (value === null) {
    return "NULL";
  }
  return String(value);
};

const WordDiff = ({
  after,
  before,
  side,
}: {
  after: string;
  before: string;
  side: "before" | "after";
}) => {
  const parts = useMemo(
    () => diffWordsWithSpace(before, after),
    [after, before]
  );
  const highlight =
    side === "before"
      ? "bg-destructive/20 text-destructive"
      : "bg-[var(--status-active)]/20 text-[var(--status-active)]";

  return (
    <span className="break-all">
      {parts.map((part, index) => {
        if (side === "before" ? part.added : part.removed) {
          return null;
        }
        const changed = side === "before" ? part.removed : part.added;
        return (
          <span
            className={changed ? cn("rounded-xs px-0.5", highlight) : undefined}
            key={`${index}-${part.value}`}
          >
            {part.value}
          </span>
        );
      })}
    </span>
  );
};

const TabCount = ({ value }: { value: number }) => (
  <span className="font-normal text-[11px] text-muted-foreground tabular-nums">
    {value}
  </span>
);

const ChangeCount = ({ count, kind }: { count: number; kind: ChangeKind }) => {
  const meta = KIND[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums",
        meta.className
      )}
    >
      <span aria-hidden="true" className="font-mono font-semibold">
        {meta.symbol}
      </span>
      {count}
      <span className="sr-only">{meta.label}</span>
    </span>
  );
};

const BranchDirection = ({
  from,
  to,
}: {
  from: BranchDiffBranch;
  to: BranchDiffBranch;
}) => (
  <div className="flex min-w-0 items-center gap-2 font-mono text-xs">
    <HugeiconsIcon
      aria-hidden="true"
      className="size-3.5 shrink-0 text-muted-foreground"
      icon={GitBranchIcon}
      strokeWidth={1.75}
    />
    <span className="min-w-0 truncate text-muted-foreground">{from.name}</span>
    <HugeiconsIcon
      aria-hidden="true"
      className="size-3 shrink-0 text-muted-foreground/60"
      icon={ArrowRight01Icon}
      strokeWidth={2}
    />
    <span className="min-w-0 truncate font-medium text-foreground">
      {to.name}
    </span>
  </div>
);

const SearchField = ({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <label className="relative block min-w-0 flex-1">
    <span className="sr-only">{label}</span>
    <HugeiconsIcon
      aria-hidden="true"
      className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
      icon={Search01Icon}
      strokeWidth={1.75}
    />
    <input
      className="h-8 w-full rounded-md border border-input bg-transparent pr-3 pl-8 text-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-3 focus:ring-ring/20"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type="search"
      value={value}
    />
  </label>
);

const KindFilter = ({
  value,
  onChange,
}: {
  value: "all" | ChangeKind;
  onChange: (value: "all" | ChangeKind) => void;
}) => (
  <fieldset className="flex shrink-0 items-center self-start rounded-md border border-input p-0.5 sm:self-auto">
    <legend className="sr-only">Filter changes</legend>
    {(["all", "added", "modified", "removed"] as const).map((kind) => (
      <button
        aria-pressed={value === kind}
        className="h-6 rounded-sm px-2 text-[10px] font-medium capitalize text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none aria-pressed:bg-muted aria-pressed:text-foreground"
        key={kind}
        onClick={() => onChange(kind)}
        type="button"
      >
        {kind}
      </button>
    ))}
  </fieldset>
);

const SchemaValuePanel = ({
  change,
  side,
}: {
  change: SchemaChange;
  side: "before" | "after";
}) => {
  const isBefore = side === "before";
  const value = isBefore ? change.before : change.after;
  const fallback = isBefore ? "Not present" : "Removed";
  const hasBoth = Boolean(change.before && change.after);

  return (
    <div
      className={cn(
        "min-w-0 rounded-sm px-2 py-1.5 font-mono text-muted-foreground",
        isBefore ? "bg-destructive/5" : "bg-[var(--status-active)]/5"
      )}
    >
      <span
        className={cn(
          "mb-1 block font-sans font-medium",
          isBefore ? "text-destructive/80" : "text-[var(--status-active)]"
        )}
      >
        {isBefore ? "Before" : "After"}
      </span>
      {hasBoth && change.before && change.after ? (
        <WordDiff after={change.after} before={change.before} side={side} />
      ) : (
        <span className="break-all">{value ?? fallback}</span>
      )}
    </div>
  );
};

const SchemaChangeDetails = ({ change }: { change: SchemaChange }) => (
  <div className="border-border/60 border-t bg-muted/20 px-6 py-2.5">
    {change.before || change.after ? (
      <div className="grid gap-1.5 text-[10px] sm:grid-cols-2">
        <SchemaValuePanel change={change} side="before" />
        <SchemaValuePanel change={change} side="after" />
      </div>
    ) : null}
    {change.ddl ? (
      <pre className="neon-scroll-fade !m-0 mt-2 max-h-40 overflow-auto whitespace-pre !rounded-none !border-0 !bg-transparent font-mono text-[10px] text-foreground leading-relaxed !shadow-none">
        <code>{change.ddl}</code>
      </pre>
    ) : null}
  </div>
);

const SchemaChangeRow = ({ change }: { change: SchemaChange }) => {
  const [open, setOpen] = useState(false);
  const meta = KIND[change.kind];
  const detailsId = `schema-change-${change.id}`;
  const hasDetails = Boolean(change.before || change.after || change.ddl);

  return (
    <li
      className="border-border/60 border-b last:border-b-0"
      data-kind={change.kind}
    >
      <button
        aria-controls={hasDetails ? detailsId : undefined}
        aria-expanded={hasDetails ? open : undefined}
        className="flex w-full min-w-0 items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/35 focus-visible:bg-muted/35 focus-visible:outline-none"
        disabled={!hasDetails}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span
          aria-hidden="true"
          className={cn(
            "mt-px w-3 shrink-0 font-mono text-xs font-semibold",
            meta.className
          )}
        >
          {meta.symbol}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate font-mono text-xs text-foreground">
              {change.path.join(".")}
            </span>
            <span className="text-[10px] capitalize text-muted-foreground">
              {change.objectType}
            </span>
            {change.breaking ? (
              <span className="rounded-sm bg-destructive/8 px-1 py-0.5 text-[9px] font-medium text-destructive uppercase tracking-wide">
                breaking
              </span>
            ) : null}
          </span>
          {change.before || change.after ? (
            <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
              {change.before ?? "not present"} → {change.after ?? "removed"}
            </span>
          ) : null}
        </span>
        {hasDetails ? (
          <HugeiconsIcon
            aria-hidden="true"
            className={cn(
              "mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none",
              open && "rotate-180"
            )}
            icon={ArrowDown01Icon}
            strokeWidth={1.75}
          />
        ) : null}
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-150 motion-reduce:transition-none",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
        id={detailsId}
      >
        <div className="overflow-hidden">
          <SchemaChangeDetails change={change} />
        </div>
      </div>
    </li>
  );
};

const ValueDiff = ({
  before,
  after,
}: {
  before?: Record<string, DiffValue>;
  after?: Record<string, DiffValue>;
}) => {
  const keys = [
    ...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
  ];
  return (
    <div className="neon-scroll-fade overflow-x-auto">
      <table className="w-full min-w-[440px] border-collapse text-left text-[10px]">
        <thead className="text-muted-foreground">
          <tr className="border-border/60 border-b">
            <th className="w-32 px-3 py-1.5 font-medium">Column</th>
            <th className="px-3 py-1.5 font-medium">Before</th>
            <th className="px-3 py-1.5 font-medium">After</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {keys.map((key) => {
            const previous = before?.[key];
            const next = after?.[key];
            const changed = previous !== next;
            return (
              <tr
                className="border-border/40 border-b last:border-b-0"
                key={key}
              >
                <th className="px-3 py-1.5 font-medium text-muted-foreground">
                  {key}
                </th>
                <td
                  className={cn(
                    "px-3 py-1.5",
                    changed && "bg-destructive/5 text-destructive"
                  )}
                >
                  {changed && previous !== undefined && next !== undefined ? (
                    <WordDiff
                      after={formatValue(next)}
                      before={formatValue(previous)}
                      side="before"
                    />
                  ) : (
                    formatValue(previous)
                  )}
                </td>
                <td
                  className={cn(
                    "px-3 py-1.5",
                    changed &&
                      "bg-[var(--status-active)]/5 text-[var(--status-active)]"
                  )}
                >
                  {changed && previous !== undefined && next !== undefined ? (
                    <WordDiff
                      after={formatValue(next)}
                      before={formatValue(previous)}
                      side="after"
                    />
                  ) : (
                    formatValue(next)
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const RowChangeItem = ({ row }: { row: RowChange }) => {
  const [open, setOpen] = useState(false);
  const meta = KIND[row.kind];
  const detailsId = `row-change-${row.id}`;
  const keyText = Object.entries(row.primaryKey)
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(", ");

  return (
    <li className="border-border/50 border-b last:border-b-0">
      <button
        aria-controls={detailsId}
        aria-expanded={open}
        className="flex w-full min-w-0 items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span
          aria-hidden="true"
          className={cn("w-3 font-mono font-semibold", meta.className)}
        >
          {meta.symbol}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[11px]">
          {keyText}
        </span>
        <span
          className={cn(
            "text-[9px] font-medium uppercase tracking-wide",
            meta.className
          )}
        >
          {meta.label}
        </span>
        <HugeiconsIcon
          aria-hidden="true"
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none",
            open && "rotate-180"
          )}
          icon={ArrowDown01Icon}
          strokeWidth={1.75}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-150 motion-reduce:transition-none",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
        id={detailsId}
      >
        <div className="overflow-hidden">
          <div className="border-border/50 border-t bg-muted/15">
            <ValueDiff after={row.after} before={row.before} />
          </div>
        </div>
      </div>
    </li>
  );
};

const DataTable = ({
  table,
  onLoadMore,
  loading,
}: {
  table: TableDataDiff;
  onLoadMore?: (table: TableDataDiff) => void | Promise<void>;
  loading: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const detailsId = `table-diff-${table.id}`;
  return (
    <section className="overflow-hidden rounded-md border border-border/70">
      <button
        aria-controls={detailsId}
        aria-expanded={open}
        className="flex w-full min-w-0 items-center gap-2 bg-muted/20 px-3 py-2 text-left hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <HugeiconsIcon
          aria-hidden="true"
          className="size-3.5 text-muted-foreground"
          icon={Table01Icon}
          strokeWidth={1.75}
        />
        <span className="min-w-0 flex-1 truncate font-mono text-xs">
          {table.schema}.{table.table}
        </span>
        <span className="hidden items-center gap-2 text-[10px] sm:flex">
          <ChangeCount count={table.addedCount} kind="added" />
          <ChangeCount count={table.modifiedCount} kind="modified" />
          <ChangeCount count={table.removedCount} kind="removed" />
        </span>
        <HugeiconsIcon
          aria-hidden="true"
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none",
            open && "rotate-180"
          )}
          icon={ArrowDown01Icon}
          strokeWidth={1.75}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-150 motion-reduce:transition-none",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
        id={detailsId}
      >
        <div className="overflow-hidden">
          <ul>
            {table.rows.map((row) => (
              <RowChangeItem key={row.id} row={row} />
            ))}
          </ul>
          {table.hasMore && onLoadMore ? (
            <div className="border-border/50 border-t p-2 text-center">
              <button
                aria-busy={loading}
                className="rounded-sm px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
                disabled={loading}
                onClick={() => onLoadMore(table)}
                type="button"
              >
                {loading ? "Loading changes…" : "Load more changes"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

const EmptyDiff = ({ query }: { query?: string }) => (
  <div className="flex min-h-48 flex-col items-center justify-center gap-2 p-6 text-center">
    <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <HugeiconsIcon
        aria-hidden="true"
        className="size-4"
        icon={GitBranchIcon}
        strokeWidth={1.75}
      />
    </div>
    <p className="text-sm font-medium">
      {query ? "No matching changes" : "Branches are in sync"}
    </p>
    <p className="max-w-72 text-xs text-muted-foreground">
      {query
        ? "Try a table, column, primary key, or value."
        : "No schema or row changes were found for this comparison."}
    </p>
  </div>
);

const LoadingDiff = () => (
  <output
    aria-label="Loading branch comparison"
    className="block space-y-2 p-3"
  >
    {Array.from({ length: 4 }, (_, index) => (
      <div
        className="h-10 animate-pulse rounded-md bg-muted motion-reduce:animate-none"
        key={index}
      />
    ))}
  </output>
);

const BranchDiff = ({
  from,
  to,
  schemaChanges,
  dataDiffs,
  tab: controlledTab,
  defaultTab = "schema",
  onTabChange,
  onLoadMore,
  loadingTableId,
  isLoading = false,
  error,
  className,
}: BranchDiffProps) => {
  const errorMessage =
    error instanceof Error ? error.message : (error ?? undefined);
  const [internalTab, setInternalTab] = useState<DiffTab>(defaultTab);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | ChangeKind>("all");
  const tab = controlledTab ?? internalTab;
  const schemaCounts = useMemo(
    () => countSchemaKinds(schemaChanges),
    [schemaChanges]
  );
  const dataCounts = useMemo(() => countDataKinds(dataDiffs), [dataDiffs]);
  const counts = {
    added: schemaCounts.added + dataCounts.added,
    modified: schemaCounts.modified + dataCounts.modified,
    removed: schemaCounts.removed + dataCounts.removed,
  };
  const filteredSchema = useMemo(
    () =>
      schemaChanges.filter(
        (change) =>
          (kind === "all" || change.kind === kind) &&
          matchesSearch(
            [
              ...change.path,
              change.before ?? "",
              change.after ?? "",
              change.ddl ?? "",
            ],
            query
          )
      ),
    [kind, query, schemaChanges]
  );
  const filteredData = useMemo(
    () =>
      dataDiffs
        .map((table) => ({
          ...table,
          rows: table.rows.filter(
            (row) =>
              (kind === "all" || row.kind === kind) &&
              matchesSearch(
                [
                  table.schema,
                  table.table,
                  JSON.stringify(row.primaryKey),
                  JSON.stringify(row.before),
                  JSON.stringify(row.after),
                ],
                query
              )
          ),
        }))
        .filter((table) => table.rows.length > 0),
    [dataDiffs, kind, query]
  );
  const total = counts.added + counts.modified + counts.removed;
  const setTab = (next: DiffTab) => {
    if (controlledTab === undefined) {
      setInternalTab(next);
    }
    onTabChange?.(next);
  };

  return (
    <section
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-lg border border-border/70 bg-card text-card-foreground shadow-xs",
        className
      )}
      data-slot="branch-diff"
    >
      <header className="flex min-w-0 flex-col gap-2 border-border/60 border-b px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Branch diff</h2>
          <BranchDirection from={from} to={to} />
        </div>
        <div
          aria-label={`${total} total changes`}
          className="flex items-center gap-3 text-[10px]"
        >
          <ChangeCount count={counts.added} kind="added" />
          <ChangeCount count={counts.modified} kind="modified" />
          <ChangeCount count={counts.removed} kind="removed" />
        </div>
      </header>
      {errorMessage ? (
        <div
          className="flex min-h-48 items-center justify-center gap-2 p-6 text-sm text-destructive"
          role="alert"
        >
          <HugeiconsIcon
            aria-hidden="true"
            className="size-4"
            icon={Alert02Icon}
            strokeWidth={1.75}
          />
          {errorMessage}
        </div>
      ) : null}
      {isLoading && !errorMessage ? <LoadingDiff /> : null}
      {isLoading || errorMessage ? null : (
        <Tabs onValueChange={(value) => setTab(value as DiffTab)} value={tab}>
          <div className="flex min-w-0 flex-col gap-2 border-border/60 border-b p-3">
            <TabsList className="relative w-fit shrink-0" variant="default">
              <TabsIndicator />
              <TabsTrigger
                className="z-1 flex-none gap-1.5 bg-transparent text-xs shadow-none data-active:bg-transparent data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-transparent"
                value="schema"
              >
                <span>Schema</span>
                <TabCount value={schemaChanges.length} />
              </TabsTrigger>
              <TabsTrigger
                className="z-1 flex-none gap-1.5 bg-transparent text-xs shadow-none data-active:bg-transparent data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-transparent"
                value="data"
              >
                <span>Data</span>
                <TabCount
                  value={
                    dataCounts.added + dataCounts.modified + dataCounts.removed
                  }
                />
              </TabsTrigger>
            </TabsList>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <SearchField
                label={`Search ${tab} changes`}
                onChange={setQuery}
                placeholder={`Search ${tab} changes…`}
                value={query}
              />
              <KindFilter onChange={setKind} value={kind} />
            </div>
          </div>
          <TabsContent
            className="fade-in-0 slide-in-from-left-1 animate-in duration-200 ease-out motion-reduce:animate-none"
            value="schema"
          >
            {filteredSchema.length > 0 ? (
              <ul className="neon-scroll-fade max-h-[30rem] overflow-y-auto">
                {filteredSchema.map((change) => (
                  <SchemaChangeRow change={change} key={change.id} />
                ))}
              </ul>
            ) : (
              <EmptyDiff
                query={query || kind !== "all" ? query || kind : undefined}
              />
            )}
          </TabsContent>
          <TabsContent
            className="fade-in-0 slide-in-from-right-1 animate-in p-3 duration-200 ease-out motion-reduce:animate-none"
            value="data"
          >
            {filteredData.length > 0 ? (
              <div className="neon-scroll-fade max-h-[34rem] space-y-2 overflow-y-auto">
                {filteredData.map((table) => (
                  <DataTable
                    key={table.id}
                    loading={loadingTableId === table.id}
                    onLoadMore={onLoadMore}
                    table={table}
                  />
                ))}
              </div>
            ) : (
              <EmptyDiff
                query={query || kind !== "all" ? query || kind : undefined}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </section>
  );
};

export { BranchDiff };
export type {
  BranchDiffBranch,
  BranchDiffProps,
  ChangeKind,
  DiffTab,
  DiffValue,
  RowChange,
  SchemaChange,
  TableDataDiff,
};
