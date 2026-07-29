"use client";

import {
  ArrowDown01Icon,
  Copy01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { cn } from "@/lib/utils";

const COPIED_FEEDBACK_MS = 1500;
const DEFAULT_MAX_HEIGHT = 280;

interface CodeBlockCopyButtonProps extends Omit<
  React.ComponentProps<"button">,
  "value"
> {
  value: string;
}

export const CodeBlockCopyButton = ({
  value,
  className,
  ...props
}: CodeBlockCopyButtonProps): React.JSX.Element => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  };

  return (
    <button
      aria-label={copied ? "Copied code" : "Copy code"}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
      data-slot="code-block-copy-button"
      onClick={handleCopy}
      type="button"
      {...props}
    >
      <HugeiconsIcon
        className="size-3.5"
        icon={copied ? Tick02Icon : Copy01Icon}
        strokeWidth={2}
      />
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

export type CodeBlockOverflow = "default" | "scrollable" | "collapsible";

interface CodeBlockWrapperProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  overflow: CodeBlockOverflow;
  maxHeight?: number;
  muted?: boolean;
  children: React.ReactNode;
}

export const CodeBlockWrapper = ({
  overflow,
  maxHeight = DEFAULT_MAX_HEIGHT,
  muted = false,
  children,
}: CodeBlockWrapperProps): React.JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const regionId = React.useId();

  if (overflow === "default") {
    return <div className="overflow-x-auto">{children}</div>;
  }

  if (overflow === "scrollable") {
    return (
      <div className="overflow-auto" style={{ maxHeight }}>
        {children}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "overflow-hidden transition-all",
          !expanded && "relative"
        )}
        id={regionId}
        style={expanded ? undefined : { maxHeight }}
      >
        {children}
        {expanded ? null : (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t to-transparent",
              muted ? "from-muted/30" : "from-card"
            )}
          />
        )}
      </div>
      <button
        aria-controls={regionId}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 border-t py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
          muted
            ? "border-border/40 bg-muted/10 hover:bg-muted/30"
            : "border-border/60 bg-muted/30 hover:bg-muted/50"
        )}
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <HugeiconsIcon
          className={cn(
            "size-3.5 transition-transform",
            expanded && "rotate-180"
          )}
          icon={ArrowDown01Icon}
          strokeWidth={2}
        />
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
};
