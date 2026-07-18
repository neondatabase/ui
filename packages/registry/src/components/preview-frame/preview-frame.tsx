"use client";

import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";

import { NeonLoader } from "@/components/neon-loader/neon-loader";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PreviewFrameState = "ready" | "waking" | "error";

export type PreviewFrameProps = Omit<ComponentProps<"div">, "title"> & {
  /** The sandbox URL the frame renders. */
  src: string;
  /**
   * What the header readout shows when the real src is an internal
   * sandbox host. Defaults to src.
   */
  displaySrc?: string;
  /** Accessible name for the iframe, e.g. the app's name. */
  title: string;
  /**
   * Lifecycle state: "ready" shows the app, "waking" covers it with
   * the loader while the sandbox spins up, "error" offers a restart.
   */
  state?: PreviewFrameState;
  /**
   * Bump this number to force a reload from outside — e.g. after the
   * agent finishes an edit. Merged with the internal refresh count.
   */
  reloadSignal?: number;
  /** Renders the restart action (header and error panel). */
  onRestart?: () => void;
  /** Notified after the built-in refresh action reloads the frame. */
  onRefresh?: () => void;
  /** One line of detail under the error title. */
  errorDetail?: string;
  /** Copy under the loader while waking. */
  wakingLabel?: string;
  /** Extra actions rendered before the built-in header buttons. */
  actions?: ReactNode;
  /** The iframe sandbox policy. */
  sandbox?: string;
};

/* ─────────────────────────────────────────────────────────
 * LIFECYCLE STORYBOARD
 *
 * The chrome stays constant; only the stage changes. Every
 * overlay is absolute, so the frame never changes height.
 *
 *  ready    the app, full bleed; the header dot holds
 *           primary and the URL reads in mono
 *  refresh  the refresh glyph spins one turn (500ms
 *           ease-out) while the iframe remounts — the
 *           chrome acknowledges the click even when the
 *           app reloads too fast to notice
 *  waking   a scrim covers the app; the NeonLoader
 *           resolves out of grain with one mono line under
 *           it; the dot breathes muted
 *  error    the scrim holds; mono "error" prefix, one
 *           detail line, and a restart action; the dot
 *           cools to destructive
 *  signal   reloadSignal bumps from outside (e.g. the
 *           agent finished an edit) and the frame remounts
 *           without any chrome motion
 * ───────────────────────────────────────────────────────── */
const STATE_DOT: Record<PreviewFrameState, string> = {
  error: "bg-destructive",
  ready: "bg-primary",
  waking: "animate-pulse bg-muted-foreground/60 motion-reduce:animate-none",
};

const SPIN_MS = 500;

const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    aria-hidden="true"
    className={cn(
      "size-3.5",
      spinning &&
        "animate-[neon-spin-once_500ms_cubic-bezier(0.23,1,0.32,1)] motion-reduce:animate-none"
    )}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
  </svg>
);

const RestartIcon = () => (
  <svg
    aria-hidden="true"
    className="size-3.5"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M12 2v10" />
    <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
  </svg>
);

const ExternalIcon = () => (
  <svg
    aria-hidden="true"
    className="size-3.5"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);

/** Strips the scheme so the readout stays quiet, like a browser. */
const displayUrl = (src: string) => src.replace(/^https?:\/\//u, "");

export const PreviewFrame = ({
  actions,
  className,
  displaySrc,
  errorDetail,
  onRefresh,
  onRestart,
  reloadSignal = 0,
  sandbox = "allow-scripts allow-same-origin allow-forms",
  src,
  state = "ready",
  title,
  wakingLabel = "Waking sandbox",
  ...props
}: PreviewFrameProps) => {
  const [refreshCount, setRefreshCount] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const refresh = () => {
    setRefreshCount((count) => count + 1);
    setSpinning(true);
    window.setTimeout(() => setSpinning(false), SPIN_MS);
    onRefresh?.();
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border/60 bg-card transition-colors hover:border-border",
        className
      )}
      data-slot="preview-frame"
      data-state={state}
      {...props}
    >
      <div
        className="flex items-center gap-2 border-border/40 border-b px-3 py-1.5"
        data-slot="preview-frame-header"
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 shrink-0 transition-colors duration-300",
            STATE_DOT[state]
          )}
          data-slot="preview-frame-dot"
        />
        <span
          className="min-w-0 flex-1 truncate font-mono text-muted-foreground text-xs"
          data-slot="preview-frame-url"
        >
          {displayUrl(displaySrc ?? src)}
        </span>
        {actions}
        <Button
          aria-label="Refresh preview"
          disabled={state !== "ready"}
          onClick={refresh}
          size="icon-sm"
          variant="ghost"
        >
          <RefreshIcon spinning={spinning} />
        </Button>
        {onRestart ? (
          <Button
            aria-label="Restart sandbox"
            className={cn(
              "transition-colors",
              state === "ready"
                ? "hover:text-destructive"
                : "hover:text-primary"
            )}
            onClick={onRestart}
            size="icon-sm"
            variant="ghost"
          >
            <RestartIcon />
          </Button>
        ) : null}
        <a
          aria-label="Open in new tab"
          className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
          href={src}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalIcon />
        </a>
      </div>

      <div className="relative min-h-0 flex-1 bg-background">
        <iframe
          className={cn(
            "block h-full w-full border-0 transition-opacity duration-300",
            state !== "ready" && "opacity-0"
          )}
          key={reloadSignal + refreshCount}
          sandbox={sandbox}
          src={src}
          title={title}
        />
        {state === "waking" ? (
          <div
            className="fade-in-0 slide-in-from-bottom-1 absolute inset-0 flex animate-in flex-col items-center justify-center gap-4 bg-background/90 duration-300 motion-reduce:animate-none"
            data-slot="preview-frame-waking"
          >
            <NeonLoader label={wakingLabel} showLabel={false} size="md" />
            <p className="shimmer shimmer-duration-2400 font-mono text-muted-foreground text-xs">
              {wakingLabel}…
            </p>
          </div>
        ) : null}
        {state === "error" ? (
          <div
            className="fade-in-0 slide-in-from-bottom-1 absolute inset-0 flex animate-in flex-col items-center justify-center gap-3 bg-background/90 duration-300 motion-reduce:animate-none"
            data-slot="preview-frame-error"
            role="alert"
          >
            <p className="flex items-baseline gap-2 text-sm">
              <span className="font-mono text-destructive text-xs">error</span>
              <span className="font-medium text-foreground">
                Sandbox stopped responding.
              </span>
            </p>
            {errorDetail ? (
              <p className="max-w-sm text-center text-muted-foreground text-xs">
                {errorDetail}
              </p>
            ) : null}
            {onRestart ? (
              <Button
                className="mt-2 active:scale-[0.98]"
                onClick={onRestart}
                size="sm"
                variant="outline"
              >
                Restart sandbox
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
