/* oxlint-disable jsx-a11y/prefer-tag-over-role -- a custom ARIA listbox; a native select cannot filter, create, or draw the tree. */
"use client";

import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  GitBranchIcon,
  PlusSignIcon,
  Search01Icon,
  SquareLock01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import type { ComponentProps, FormEvent, KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface Branch {
  id: string;
  name: string;
  /** The project's default branch. */
  default?: boolean;
  /** A protected branch. */
  protected?: boolean;
  /** The parent branch's id; drives the hierarchy the picker draws. */
  parent?: string;
}

interface BranchRow {
  branch: Branch;
  depth: number;
  /** Per ancestor level: does that ancestor have a following sibling (draw a line)? */
  guides: boolean[];
  /** Last among its siblings (elbow vs tee). */
  isLast: boolean;
}

/** Flatten the branches into depth-first rows carrying tree-guide metadata. */
const buildTree = (branches: Branch[]): BranchRow[] => {
  const ids = new Set(branches.map((branch) => branch.id));
  const parentOf = (branch: Branch) =>
    branch.parent && ids.has(branch.parent) ? branch.parent : undefined;
  const childrenOf = (id?: string) =>
    branches.filter((branch) => parentOf(branch) === id);

  const rows: BranchRow[] = [];

  const walk = (
    branch: Branch,
    depth: number,
    guides: boolean[],
    isLast: boolean
  ) => {
    rows.push({ branch, depth, guides, isLast });
    const kids = childrenOf(branch.id);
    for (const [index, kid] of kids.entries()) {
      walk(kid, depth + 1, [...guides, !isLast], index === kids.length - 1);
    }
  };

  const roots = childrenOf();
  for (const [index, root] of roots.entries()) {
    walk(root, 0, [], index === roots.length - 1);
  }

  return rows;
};

type GuideVariant = "empty" | "line" | "tee" | "elbow";

const Guide = ({ variant }: { variant: GuideVariant }) => (
  <span aria-hidden="true" className="relative block h-full w-4 shrink-0">
    {variant === "empty" ? null : (
      <span className="absolute top-0 bottom-1/2 left-1/2 w-px -translate-x-1/2 bg-border" />
    )}
    {variant === "line" || variant === "tee" ? (
      <span className="absolute top-1/2 bottom-0 left-1/2 w-px -translate-x-1/2 bg-border" />
    ) : null}
    {variant === "tee" || variant === "elbow" ? (
      <span className="absolute top-1/2 right-0 left-1/2 h-px -translate-y-1/2 bg-border" />
    ) : null}
  </span>
);

const BranchBadge = ({ children }: { children: string }) => (
  <span className="shrink-0 rounded-sm border border-primary/40 px-1 py-px font-mono text-[9px] text-primary">
    {children}
  </span>
);

const BranchOption = ({
  row,
  selected,
  highlighted,
  canBranch,
  onSelect,
  onBranchFrom,
  onHighlight,
}: {
  row: BranchRow;
  selected: boolean;
  highlighted: boolean;
  canBranch: boolean;
  onSelect: () => void;
  onBranchFrom: () => void;
  onHighlight: () => void;
}) => (
  <div
    aria-selected={selected}
    className={cn(
      "group/row relative flex h-8 items-center rounded-md pr-1 transition-colors",
      highlighted && "bg-muted"
    )}
    data-highlighted={highlighted || undefined}
    onMouseMove={onHighlight}
    role="option"
    tabIndex={-1}
  >
    <button
      className={cn(
        "flex h-full min-w-0 flex-1 items-center rounded-md text-left outline-none",
        highlighted ? "text-foreground" : "text-foreground/80"
      )}
      onClick={onSelect}
      type="button"
    >
      {row.guides.map((hasNext, level) => (
        <Guide
          key={`${row.branch.id}-${level}`}
          variant={hasNext ? "line" : "empty"}
        />
      ))}
      {row.depth > 0 ? <Guide variant={row.isLast ? "elbow" : "tee"} /> : null}

      <span className="flex min-w-0 flex-1 items-center gap-1.5 pl-1.5">
        <HugeiconsIcon
          className="size-3.5 shrink-0 text-muted-foreground"
          icon={GitBranchIcon}
          strokeWidth={2}
        />
        <span className="min-w-0 truncate font-mono text-xs">
          {row.branch.name}
        </span>
        {row.branch.default ? <BranchBadge>default</BranchBadge> : null}
        {row.branch.protected ? (
          <HugeiconsIcon
            aria-label="protected"
            className="size-3 shrink-0 text-muted-foreground/70"
            icon={SquareLock01Icon}
            strokeWidth={2}
          />
        ) : null}
      </span>
    </button>

    <div className="flex shrink-0 items-center gap-0.5 pl-1">
      {selected ? (
        <HugeiconsIcon
          className={cn(
            "size-3.5 text-primary",
            canBranch && "group-hover/row:hidden"
          )}
          icon={Tick02Icon}
          strokeWidth={2}
        />
      ) : null}
      {canBranch ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                aria-label={`New branch from ${row.branch.name}`}
                className="flex size-6 scale-75 items-center justify-center rounded-md text-muted-foreground/50 opacity-0 outline-none transition-all duration-150 ease-out hover:bg-muted-foreground/10 hover:text-foreground focus-visible:scale-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50 group-hover/row:scale-100 group-hover/row:opacity-100 motion-reduce:transition-none motion-reduce:group-hover/row:scale-100"
                onClick={onBranchFrom}
                type="button"
              >
                <HugeiconsIcon
                  className="size-3.5"
                  icon={PlusSignIcon}
                  strokeWidth={2}
                />
              </button>
            }
          />
          <TooltipContent>New branch from {row.branch.name}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  </div>
);

const normalize = (value: string) => value.trim().toLowerCase();

export type BranchPickerProps = Omit<
  ComponentProps<"button">,
  "value" | "defaultValue" | "onChange"
> & {
  /** The branches to choose from. */
  branches: Branch[];
  /** Selected branch id (controlled). */
  value?: string;
  /** Initial selected branch id (uncontrolled). */
  defaultValue?: string;
  /** Notified when a branch is chosen. */
  onValueChange?: (id: string) => void;
  /** Create a branch off `fromId`. Hides the per-branch affordance when omitted. */
  onCreateBranch?: (name: string, fromId: string) => void;
  /** Trigger text when nothing is selected. */
  placeholder?: string;
};

export const BranchPicker = ({
  branches,
  value,
  defaultValue,
  onValueChange,
  onCreateBranch,
  placeholder = "Select branch",
  className,
  ...props
}: BranchPickerProps) => {
  const [internal, setInternal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [createFrom, setCreateFrom] = useState<Branch>();
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const createRef = useRef<HTMLInputElement>(null);

  const selectedId = value ?? internal;
  const selected = branches.find((branch) => branch.id === selectedId);

  const searching = query.trim().length > 0;
  const rows: BranchRow[] = searching
    ? branches
        .filter((branch) => normalize(branch.name).includes(normalize(query)))
        .map((branch) => ({ branch, depth: 0, guides: [], isLast: true }))
    : buildTree(branches);

  useEffect(() => {
    if (!open) {
      return;
    }

    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!createFrom) {
      return;
    }

    const id = window.setTimeout(() => createRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [createFrom]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);

    if (next) {
      setQuery("");
      setHighlight(0);
      setCreateFrom(undefined);
      setNewName("");
    }
  };

  const choose = (id: string) => {
    if (value === undefined) {
      setInternal(id);
    }
    onValueChange?.(id);
    setOpen(false);
  };

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();

    if (createFrom && newName.trim()) {
      onCreateBranch?.(newName.trim(), createFrom.id);
      setOpen(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((current) => Math.min(current + 1, rows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      const row = rows[highlight];
      if (row) {
        event.preventDefault();
        choose(row.branch.id);
      }
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      <PopoverTrigger
        render={
          <Button
            aria-expanded={open}
            aria-haspopup="listbox"
            className={cn("w-56 justify-between font-mono", className)}
            variant="outline"
            {...props}
          >
            <span className="flex min-w-0 items-center gap-2">
              <HugeiconsIcon
                className="size-3.5 shrink-0 text-muted-foreground"
                icon={GitBranchIcon}
                strokeWidth={2}
              />
              <span
                className={cn(
                  "truncate text-xs",
                  selected ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {selected?.name ?? placeholder}
              </span>
            </span>
            <HugeiconsIcon
              className="size-4 shrink-0 text-muted-foreground"
              icon={ArrowDown01Icon}
              strokeWidth={2}
            />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-72 overflow-hidden p-0">
        <TooltipProvider>
          {createFrom ? (
            <form
              className="fade-in-0 slide-in-from-right-3 animate-in p-2 duration-200 motion-reduce:animate-none"
              onSubmit={submitCreate}
            >
              <button
                className="mb-2 flex items-center gap-1 font-mono text-[10px] text-muted-foreground outline-none transition-colors hover:text-foreground"
                onClick={() => {
                  setCreateFrom(undefined);
                  setNewName("");
                }}
                type="button"
              >
                <HugeiconsIcon
                  className="size-3"
                  icon={ArrowLeft01Icon}
                  strokeWidth={2}
                />
                New branch from{" "}
                <span className="text-foreground">{createFrom.name}</span>
              </button>
              <Input
                className="h-8 font-mono text-xs focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/15"
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setCreateFrom(undefined);
                    setNewName("");
                  }
                }}
                placeholder="branch-name"
                ref={createRef}
                value={newName}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setCreateFrom(undefined);
                    setNewName("");
                  }}
                  size="xs"
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  disabled={newName.trim().length === 0}
                  size="xs"
                  type="submit"
                >
                  Create branch
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-2 border-border/60 border-b px-2.5">
                <HugeiconsIcon
                  className="size-3.5 shrink-0 text-muted-foreground/60"
                  icon={Search01Icon}
                  strokeWidth={2}
                />
                <Input
                  className="h-9 rounded-none border-0 bg-transparent px-0 font-mono text-xs shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setHighlight(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search branches"
                  ref={inputRef}
                  value={query}
                />
              </div>

              <div className="max-h-72 overflow-auto p-1" role="listbox">
                {rows.map((row, index) => (
                  <BranchOption
                    canBranch={Boolean(onCreateBranch)}
                    highlighted={highlight === index}
                    key={row.branch.id}
                    onBranchFrom={() => {
                      setCreateFrom(row.branch);
                      setNewName("");
                    }}
                    onHighlight={() => setHighlight(index)}
                    onSelect={() => choose(row.branch.id)}
                    row={row}
                    selected={row.branch.id === selectedId}
                  />
                ))}

                {rows.length === 0 ? (
                  <p className="px-2 py-6 text-center text-muted-foreground text-xs">
                    No branches found.
                  </p>
                ) : null}
              </div>
            </>
          )}
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  );
};
