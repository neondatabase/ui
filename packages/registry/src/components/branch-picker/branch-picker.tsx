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
  /** The parent branch's id; drives the drawn hierarchy. */
  parent?: string;
}

interface TreeNode {
  branch: Branch;
  depth: number;
}

/* ─────────────────────────────────────────────────────────
 * GEOMETRY
 *
 *  The list draws a real branch graph, not indent guides:
 *  a branch sits in the lane of its depth, and a curved edge
 *  runs from its parent's node into it. Tuned tight for the
 *  32px popover rows. While searching, the list flattens to
 *  one lane and drops the edges.
 * ───────────────────────────────────────────────────────── */
const ROW_H = 32;
const LANE_W = 18;
const PAD_X = 12;
const DOT_R = 3;
const CORNER = 8;

const laneX = (depth: number) => PAD_X + depth * LANE_W;
const rowY = (row: number) => row * ROW_H + ROW_H / 2;

/** Depth-first flatten, assigning each branch a depth lane. */
const buildTree = (branches: Branch[]): TreeNode[] => {
  const ids = new Set(branches.map((branch) => branch.id));
  const parentOf = (branch: Branch) =>
    branch.parent && ids.has(branch.parent) ? branch.parent : undefined;
  const childrenOf = (id?: string) =>
    branches.filter((branch) => parentOf(branch) === id);

  const nodes: TreeNode[] = [];

  const walk = (branch: Branch, depth: number) => {
    nodes.push({ branch, depth });
    for (const kid of childrenOf(branch.id)) {
      walk(kid, depth + 1);
    }
  };

  for (const root of childrenOf()) {
    walk(root, 0);
  }

  return nodes;
};

const edgePath = (px: number, py: number, cx: number, cy: number) =>
  `M ${px} ${py} V ${cy - CORNER} Q ${px} ${cy} ${px + CORNER} ${cy} H ${cx}`;

const Graph = ({
  nodes,
  byId,
  selectedId,
  drawEdges,
  width,
  height,
}: {
  nodes: TreeNode[];
  byId: Map<string, { depth: number; row: number }>;
  selectedId?: string;
  drawEdges: boolean;
  width: number;
  height: number;
}) => (
  <svg
    aria-hidden="true"
    className="pointer-events-none absolute top-0 left-0 z-10 overflow-visible"
    height={height}
    width={width}
  >
    {drawEdges
      ? nodes.map((node, index) => {
          const parent = node.branch.parent
            ? byId.get(node.branch.parent)
            : undefined;
          if (!parent) {
            return null;
          }
          return (
            <path
              className="stroke-border"
              d={edgePath(
                laneX(parent.depth),
                rowY(parent.row),
                laneX(node.depth),
                rowY(index)
              )}
              fill="none"
              key={`edge-${node.branch.id}`}
              strokeLinecap="round"
              strokeWidth={1.5}
            />
          );
        })
      : null}
    {nodes.map((node, index) => {
      const cx = laneX(node.depth);
      const cy = rowY(index);
      const selected = node.branch.id === selectedId;
      const ringed = node.branch.default || selected;
      return (
        <g key={`node-${node.branch.id}`}>
          {ringed ? (
            <rect
              className={selected ? "stroke-primary" : "stroke-primary/40"}
              fill="none"
              height={2 * (DOT_R + 2)}
              rx={2.5}
              strokeWidth={1.5}
              width={2 * (DOT_R + 2)}
              x={cx - DOT_R - 2}
              y={cy - DOT_R - 2}
            />
          ) : null}
          <rect
            className={selected ? "fill-primary" : "fill-muted-foreground/60"}
            height={2 * DOT_R}
            rx={1}
            width={2 * DOT_R}
            x={cx - DOT_R}
            y={cy - DOT_R}
          />
        </g>
      );
    })}
  </svg>
);

const BranchBadge = ({ children }: { children: string }) => (
  <span className="shrink-0 rounded-sm border border-primary/40 px-1 py-px font-mono text-[9px] text-primary">
    {children}
  </span>
);

const BranchOption = ({
  node,
  selected,
  highlighted,
  canBranch,
  onSelect,
  onBranchFrom,
  onHighlight,
}: {
  node: TreeNode;
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
      style={{ paddingLeft: laneX(node.depth) + DOT_R + 10 }}
      type="button"
    >
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="min-w-0 truncate font-mono text-xs">
          {node.branch.name}
        </span>
        {node.branch.default ? <BranchBadge>default</BranchBadge> : null}
        {node.branch.protected ? (
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
                aria-label={`New branch from ${node.branch.name}`}
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
          <TooltipContent>New branch from {node.branch.name}</TooltipContent>
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
  const nodes: TreeNode[] = searching
    ? branches
        .filter((branch) => normalize(branch.name).includes(normalize(query)))
        .map((branch) => ({ branch, depth: 0 }))
    : buildTree(branches);

  const byId = new Map(
    nodes.map((node, index) => [
      node.branch.id,
      { depth: node.depth, row: index },
    ])
  );
  const maxDepth = Math.max(0, ...nodes.map((node) => node.depth));
  const gutterWidth = laneX(maxDepth) + DOT_R + 6;

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
      setHighlight((current) => Math.min(current + 1, nodes.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      const node = nodes[highlight];
      if (node) {
        event.preventDefault();
        choose(node.branch.id);
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

              <div
                className="neon-scroll-fade max-h-72 overflow-auto p-1"
                role="listbox"
              >
                <div className="relative">
                  {nodes.length > 0 ? (
                    <Graph
                      byId={byId}
                      drawEdges={!searching}
                      height={nodes.length * ROW_H}
                      nodes={nodes}
                      selectedId={selectedId}
                      width={gutterWidth}
                    />
                  ) : null}
                  {nodes.map((node, index) => (
                    <BranchOption
                      canBranch={Boolean(onCreateBranch)}
                      highlighted={highlight === index}
                      key={node.branch.id}
                      node={node}
                      onBranchFrom={() => {
                        setCreateFrom(node.branch);
                        setNewName("");
                      }}
                      onHighlight={() => setHighlight(index)}
                      onSelect={() => choose(node.branch.id)}
                      selected={node.branch.id === selectedId}
                    />
                  ))}

                  {nodes.length === 0 ? (
                    <p className="px-2 py-6 text-center text-muted-foreground text-xs">
                      No branches found.
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  );
};
