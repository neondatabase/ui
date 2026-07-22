"use client";

import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";

import { AnimatedWash } from "@/components/animated-wash/animated-wash";
import { NeonLoader } from "@/components/neon-loader/neon-loader";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PreviewFrameState = "ready" | "sleeping" | "waking" | "error";

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
   * Lifecycle state: "ready" shows the app, "sleeping" dims it behind
   * a wake-on-click scrim, "waking" covers it with the loader while
   * the sandbox spins up, "error" offers a restart.
   */
  state?: PreviewFrameState;
  /** Renders the wake action in the sleeping state. */
  onWake?: () => void;
  /** One line under the sleeping title. */
  sleepingDetail?: string;
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
  /**
   * The agent is editing the app right now: the header dot breathes and a
   * quiet "editing…" readout joins the URL. The app stays visible — it is
   * still live and hot-reloading under the changes.
   */
  working?: boolean;
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
 *  sleeping the app dims behind the scrim — suspended, not
 *           gone; the dot rests dim, and a click anywhere
 *           on the frame (or the wake action) brings the
 *           compute back
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
  sleeping: "bg-muted-foreground/40",
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

const MoonIcon = () => (
  <svg
    aria-hidden="true"
    className="size-4 text-muted-foreground/70"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

/** The header's live vocabulary: state dot, URL, and the editing readout. */
const HeaderStatus = ({
  state,
  url,
  working,
}: {
  state: PreviewFrameState;
  url: string;
  working: boolean;
}) => {
  const editing = working && state === "ready";
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0 transition-colors duration-300",
          editing
            ? "neon-status-breathe bg-primary text-primary"
            : STATE_DOT[state]
        )}
        data-slot="preview-frame-dot"
      />
      <span
        className="min-w-0 flex-1 truncate font-mono text-muted-foreground text-xs"
        data-slot="preview-frame-url"
        title={url}
      >
        {url}
      </span>
      {editing && (
        <span
          className="shimmer shimmer-duration-2400 shrink-0 font-mono text-muted-foreground text-xs"
          data-slot="preview-frame-working"
        >
          agent editing…
        </span>
      )}
    </>
  );
};

export const PreviewFrame = ({
  actions,
  className,
  displaySrc,
  errorDetail,
  onRefresh,
  onRestart,
  onWake,
  sleepingDetail = "Compute suspended after inactivity.",
  reloadSignal = 0,
  sandbox = "allow-scripts allow-same-origin allow-forms",
  src,
  state = "ready",
  title,
  wakingLabel = "Waking sandbox",
  working = false,
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
      data-working={working || undefined}
      {...props}
    >
      <div
        className="flex items-center gap-2 border-border/40 border-b px-3 py-1.5"
        data-slot="preview-frame-header"
      >
        <HeaderStatus
          state={state}
          url={displayUrl(displaySrc ?? src)}
          working={working}
        />
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
        {state === "sleeping" ? (
          /* One semantic wake affordance: the whole scrim is the button. */
          <button
            className={cn(
              "fade-in-0 group/wake absolute inset-0 isolate flex w-full animate-in flex-col items-center justify-center gap-3 overflow-hidden bg-background/90 duration-300 motion-reduce:animate-none",
              onWake ? "cursor-pointer" : "cursor-default"
            )}
            data-slot="preview-frame-sleeping"
            disabled={!onWake}
            onClick={onWake}
            type="button"
          >
            <AnimatedWash
              aria-hidden="true"
              className="-z-10 pointer-events-none absolute inset-x-0 bottom-0 h-32 text-muted-foreground opacity-50"
              data-slot="preview-frame-wash"
            />
            <MoonIcon />
            <p className="font-mono text-muted-foreground text-xs">sleeping</p>
            <p className="max-w-sm text-pretty text-center text-muted-foreground/70 text-xs">
              {sleepingDetail}
            </p>
            {onWake ? (
              <span className="mt-1 inline-flex h-6 items-center rounded-full border border-border/60 px-2.5 text-muted-foreground text-xs transition-colors group-hover/wake:border-primary/60 group-hover/wake:text-primary">
                Wake sandbox
              </span>
            ) : null}
          </button>
        ) : null}
        {state === "waking" ? (
          <div
            className="fade-in-0 slide-in-from-bottom-1 absolute inset-0 isolate flex animate-in flex-col items-center justify-center gap-4 overflow-hidden bg-background/90 duration-300 motion-reduce:animate-none"
            data-slot="preview-frame-waking"
          >
            <AnimatedWash
              aria-hidden="true"
              className="-z-10 pointer-events-none absolute inset-x-0 bottom-0 h-32 text-primary"
              data-slot="preview-frame-wash"
            />
            <NeonLoader label={wakingLabel} showLabel={false} size="md" />
            <p className="shimmer shimmer-duration-2400 text-muted-foreground text-xs">
              {wakingLabel}…
            </p>
          </div>
        ) : null}
        {state === "error" ? (
          <div
            className="fade-in-0 slide-in-from-bottom-1 absolute inset-0 isolate flex animate-in flex-col items-center justify-center gap-3 overflow-hidden bg-background/90 duration-300 motion-reduce:animate-none"
            data-slot="preview-frame-error"
            role="alert"
          >
            <AnimatedWash
              aria-hidden="true"
              className="-z-10 pointer-events-none absolute inset-x-0 bottom-0 h-32 text-destructive opacity-50"
              data-slot="preview-frame-wash"
            />
            <p className="flex items-baseline gap-2 text-sm">
              <span className="font-mono text-destructive text-xs">error</span>
              <span className="font-medium text-foreground">
                Sandbox stopped responding.
              </span>
            </p>
            {errorDetail ? (
              <p className="max-w-sm text-pretty text-center text-muted-foreground text-xs">
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
