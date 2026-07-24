"use client";

import { GitBranchIcon, SquareLock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Compute lifecycle, mirrored from ComputeStatus. Drives the node color. */
export type ComputeState = "active" | "idle" | "scaling" | "suspended";

export interface Branch {
  id: string;
  name: string;
  /** The project's default branch: its node wears a primary ring. */
  default?: boolean;
  /** A protected branch: shows a lock. */
  protected?: boolean;
  /** The parent branch's id; the edge is drawn from it. */
  parent?: string;
  /** Compute state, painted onto the node dot. */
  state?: ComputeState;
  /** ISO timestamp of the branch's last update, shown as relative time. */
  updatedAt?: string;
}

interface TreeNode {
  branch: Branch;
  depth: number;
  row: number;
}

/* ─────────────────────────────────────────────────────────
 * GEOMETRY
 *
 *  The graph is a real node-link drawing, not indent guides.
 *  Rows stack at a fixed height; a branch sits in the lane of
 *  its depth. Each child's edge leaves its parent's lane,
 *  runs down, and curves (a fixed-radius quarter turn) into
 *  the child's node. Node color is the compute state; the
 *  default branch and the selected branch wear a ring.
 * ───────────────────────────────────────────────────────── */
const ROW_H = 46;
const LANE_W = 22;
const PAD_X = 18;
const DOT_R = 3.5;
const CORNER = 12;

const laneX = (depth: number) => PAD_X + depth * LANE_W;
const rowY = (row: number) => row * ROW_H + ROW_H / 2;

/** Staggered entrance: edges draw, nodes pop, rows fade, top to bottom. */
const STAGGER = 0.06;
const DRAW = 0.45;
const POP = 0.32;

const BRANCH_TREE_STYLES = `
@keyframes neon-bt-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes neon-bt-pop { from { opacity: 0; transform: scale(0.2); } to { opacity: 1; transform: scale(1); } }
@keyframes neon-bt-row { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  [data-slot="branch-tree"] * { animation: none !important; }
}
`;

/** Depth-first flatten, assigning each branch a row and a depth lane. */
const buildNodes = (branches: Branch[]): TreeNode[] => {
  const ids = new Set(branches.map((branch) => branch.id));
  const parentOf = (branch: Branch) =>
    branch.parent && ids.has(branch.parent) ? branch.parent : undefined;
  const childrenOf = (id?: string) =>
    branches.filter((branch) => parentOf(branch) === id);

  const nodes: TreeNode[] = [];

  const walk = (branch: Branch, depth: number) => {
    nodes.push({ branch, depth, row: nodes.length });
    for (const kid of childrenOf(branch.id)) {
      walk(kid, depth + 1);
    }
  };

  for (const root of childrenOf()) {
    walk(root, 0);
  }

  return nodes;
};

const DOT_STATE: Record<ComputeState, string> = {
  active: "fill-[var(--status-active)] neon-status-breathe",
  idle: "fill-[var(--status-active)]",
  scaling: "fill-[var(--status-scaling)] neon-status-breathe",
  suspended: "fill-[var(--status-sleeping)]",
};

/** Ring stroke matched to the dot color, so the selection halo reads as the node. */
const RING_STATE: Record<ComputeState, string> = {
  active: "stroke-[var(--status-active)]",
  idle: "stroke-[var(--status-active)]",
  scaling: "stroke-[var(--status-scaling)]",
  suspended: "stroke-[var(--status-sleeping)]",
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const relativeTime = (iso?: string): string | null => {
  if (!iso) {
    return null;
  }

  const diff = Date.now() - new Date(iso).getTime();
  if (diff < MINUTE) {
    return "just now";
  }
  if (diff < HOUR) {
    return `${Math.round(diff / MINUTE)}m ago`;
  }
  if (diff < DAY) {
    return `${Math.round(diff / HOUR)}h ago`;
  }
  return `${Math.round(diff / DAY)}d ago`;
};

const edgePath = (parent: TreeNode, child: TreeNode) => {
  const px = laneX(parent.depth);
  const py = rowY(parent.row);
  const cx = laneX(child.depth);
  const cy = rowY(child.row);
  return `M ${px} ${py} V ${cy - CORNER} Q ${px} ${cy} ${px + CORNER} ${cy} H ${cx}`;
};

const Graph = ({
  nodes,
  byId,
  selectedId,
  width,
  height,
}: {
  nodes: TreeNode[];
  byId: Map<string, TreeNode>;
  selectedId?: string;
  width: number;
  height: number;
}) => (
  <svg
    aria-hidden="true"
    className="pointer-events-none absolute top-0 left-0 z-10 overflow-visible"
    height={height}
    width={width}
  >
    {nodes.map((node) => {
      const parent = node.branch.parent
        ? byId.get(node.branch.parent)
        : undefined;
      if (!parent) {
        return null;
      }
      return (
        <path
          className="stroke-border"
          d={edgePath(parent, node)}
          fill="none"
          key={`edge-${node.branch.id}`}
          pathLength={1}
          strokeDasharray={1}
          strokeLinecap="round"
          strokeWidth={1.5}
          style={{
            animation: `neon-bt-draw ${DRAW}s ease ${node.row * STAGGER}s both`,
          }}
        />
      );
    })}
    {nodes.map((node) => {
      const cx = laneX(node.depth);
      const cy = rowY(node.row);
      const selected = node.branch.id === selectedId;
      const ringed = node.branch.default || selected;
      const ringStroke = node.branch.state
        ? RING_STATE[node.branch.state]
        : "stroke-muted-foreground/60";
      const popStyle = {
        animation: `neon-bt-pop ${POP}s cubic-bezier(0.34, 1.56, 0.64, 1) ${
          node.row * STAGGER + 0.14
        }s both`,
        transformBox: "fill-box" as const,
        transformOrigin: "center",
      };
      return (
        <g key={`node-${node.branch.id}`}>
          {ringed ? (
            <rect
              className={selected ? ringStroke : "stroke-primary/40"}
              fill="none"
              height={2 * (DOT_R + 2.5)}
              rx={3}
              strokeWidth={1.5}
              style={popStyle}
              width={2 * (DOT_R + 2.5)}
              x={cx - DOT_R - 2.5}
              y={cy - DOT_R - 2.5}
            />
          ) : null}
          <rect
            className={
              node.branch.state
                ? DOT_STATE[node.branch.state]
                : "fill-muted-foreground/60"
            }
            height={2 * DOT_R}
            rx={1}
            style={popStyle}
            width={2 * DOT_R}
            x={cx - DOT_R}
            y={cy - DOT_R}
          />
        </g>
      );
    })}
  </svg>
);

const Fence = () => (
  <span aria-hidden="true" className="h-2.5 w-px shrink-0 bg-border/60" />
);

const BranchRow = ({
  node,
  selected,
  onSelect,
}: {
  node: TreeNode;
  selected: boolean;
  onSelect: () => void;
}) => {
  const time = relativeTime(node.branch.updatedAt);
  return (
    <button
      aria-current={selected || undefined}
      className={cn(
        "relative flex w-full items-center rounded-md pr-3 text-left transition-colors",
        !selected && "hover:bg-muted/50"
      )}
      onClick={onSelect}
      style={{
        animation: `neon-bt-row 0.4s ease ${node.row * STAGGER}s both`,
        height: ROW_H,
        paddingLeft: laneX(node.depth) + DOT_R + 14,
      }}
      type="button"
    >
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span
          className={cn(
            "min-w-0 truncate font-mono text-xs",
            selected ? "text-foreground" : "text-foreground/85"
          )}
        >
          {node.branch.name}
        </span>
        {node.branch.default ? (
          <span className="shrink-0 rounded-sm border border-primary/40 px-1 py-px font-mono text-[9px] text-primary">
            default
          </span>
        ) : null}
        {node.branch.protected ? (
          <HugeiconsIcon
            aria-label="protected"
            className="size-3 shrink-0 text-muted-foreground/70"
            icon={SquareLock01Icon}
            strokeWidth={2}
          />
        ) : null}
      </span>

      <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] text-muted-foreground">
        {node.branch.state ? (
          <span className="capitalize">{node.branch.state}</span>
        ) : null}
        {node.branch.state && time ? <Fence /> : null}
        {time ? <span className="text-muted-foreground/70">{time}</span> : null}
      </span>
    </button>
  );
};

export type BranchTreeProps = Omit<
  ComponentProps<"div">,
  "onSelect" | "value" | "defaultValue"
> & {
  /** The branches to draw. Each references its parent by id. */
  branches: Branch[];
  /** Selected branch id (controlled). */
  value?: string;
  /** Initial selected branch id (uncontrolled). */
  defaultValue?: string;
  /** Notified when a branch node is chosen. */
  onValueChange?: (id: string) => void;
};

export const BranchTree = ({
  branches,
  value,
  defaultValue,
  onValueChange,
  className,
  ...props
}: BranchTreeProps) => {
  const [internal, setInternal] = useState(defaultValue);
  const selectedId = value ?? internal;

  const nodes = buildNodes(branches);
  const byId = new Map(nodes.map((node) => [node.branch.id, node]));
  const maxDepth = Math.max(0, ...nodes.map((node) => node.depth));
  const selectedNode = selectedId ? byId.get(selectedId) : undefined;
  const gutterWidth = laneX(maxDepth) + DOT_R + 6;
  const treeHeight = nodes.length * ROW_H;

  const choose = (id: string) => {
    if (value === undefined) {
      setInternal(id);
    }
    onValueChange?.(id);
  };

  return (
    <div
      className={cn("rounded-lg border border-border/60 bg-card", className)}
      data-slot="branch-tree"
      {...props}
    >
      <style>{BRANCH_TREE_STYLES}</style>
      <header className="flex items-center gap-2 border-border/60 border-b px-3 py-2">
        <HugeiconsIcon
          className="size-3.5 text-muted-foreground"
          icon={GitBranchIcon}
          strokeWidth={2}
        />
        <span className="font-mono text-foreground text-xs">Branches</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground tabular-nums">
          {branches.length}
        </span>
      </header>

      <div className="neon-scroll-fade max-h-80 overflow-auto px-2 py-1.5">
        <div className="relative" style={{ height: treeHeight }}>
          {selectedNode ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 rounded-md bg-muted transition-transform duration-300 ease-out motion-reduce:transition-none"
              style={{
                height: ROW_H,
                transform: `translateY(${selectedNode.row * ROW_H}px)`,
              }}
            />
          ) : null}
          <Graph
            byId={byId}
            height={treeHeight}
            nodes={nodes}
            selectedId={selectedId}
            width={gutterWidth}
          />
          {nodes.map((node) => (
            <BranchRow
              key={node.branch.id}
              node={node}
              onSelect={() => choose(node.branch.id)}
              selected={node.branch.id === selectedId}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
