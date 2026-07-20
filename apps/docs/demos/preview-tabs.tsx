"use client";

import { Button } from "@neon-ui/registry/components/ui/button";
import { CheckIcon, CopyIcon, Maximize2Icon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────
 * PREVIEW CARD STORYBOARD
 *
 * One card, two voices: the living preview on top, the
 * source underneath. No tabs — the code is always
 * truthfully there, just resting.
 *
 *  rest     the preview breathes; below the hairline, a
 *           three-line glimpse of the source sits dimmed
 *           under a fade, with a "view code" pill floating
 *           on it
 *  expand   the glimpse rises to full height (350ms strong
 *           ease-out on max-height, interruptible), the
 *           fade lifts, the copy action appears, and the
 *           pill — now "hide code" — docks at the bottom
 *           edge
 *  collapse the same road home; scroll position resets so
 *           the glimpse always shows the opening lines
 *  code     highlighted at build time (github-light /
 *           github-dark, matching Blume's fences) by
 *           scripts/build-highlighted.mjs, so the static
 *           HTML is colored from first paint — no client
 *           Shiki, no swap, nothing to wait for
 *  motion   static under prefers-reduced-motion
 * ───────────────────────────────────────────────────────── */
const GLIMPSE_HEIGHT = 128;
const EXPANDED_MAX = 520;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

/** The scroll container only scrolls once open. */
const cnScroll = (expanded: boolean) =>
  expanded ? "preview-scroll overflow-auto" : "overflow-hidden";

export default function PreviewTabs({
  children,
  fullSize = false,
  fullSizeTitle = "Full-size preview",
  highlighted,
  minHeight = 320,
  source,
}: {
  children: ReactNode;
  /** Adds an "open full size" action that shows the demo in a modal. */
  fullSize?: boolean;
  /** Heading announced by the full-size dialog. */
  fullSizeTitle?: string;
  /** Build-time highlighted HTML for the source (see build-highlighted.mjs). */
  highlighted: string;
  /** Minimum height of the preview stage in px. */
  minHeight?: number;
  /** The demo source text copied to the clipboard. */
  source: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const regionId = useId();

  // A fixed overlay, NOT a native <dialog>: the top layer would sit
  // above portaled popups (Base UI selects render into document.body),
  // leaving dropdowns invisible behind the modal.
  useEffect(() => {
    if (!fullOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.removeProperty("overflow");
    };
  }, [fullOpen]);

  const toggle = () => {
    setExpanded((current) => {
      if (current) {
        scrollRef.current?.scrollTo({ top: 0 });
      }

      return !current;
    });
  };

  const copySource = async () => {
    await navigator.clipboard.writeText(source.trim());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-background">
      <div
        className="not-prose relative flex items-center justify-center bg-muted/10 p-8 preview-ghost"
        style={{ minHeight }}
      >
        {children}
        {fullSize ? (
          <Button
            aria-label="Open full size"
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            onClick={() => setFullOpen(true)}
            size="icon-sm"
            variant="ghost"
          >
            <Maximize2Icon />
          </Button>
        ) : null}
      </div>

      {/* Near-fullscreen and chromeless: the block IS the dialog.
          The close button floats outside it, on the backdrop. */}
      {fullSize && fullOpen ? (
        <dialog
          aria-label={fullSizeTitle}
          aria-modal="true"
          className="fixed inset-0 z-40 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-black/70 p-0 text-foreground backdrop-blur-sm"
          open
        >
          <Button
            aria-label="Close full-size preview"
            className="fixed top-4 right-4 z-10 rounded-full border border-border/60 bg-card text-muted-foreground shadow-lg hover:text-foreground"
            onClick={() => setFullOpen(false)}
            size="icon"
            variant="ghost"
          >
            <XIcon />
          </Button>
          <div className="not-prose flex h-full items-center overflow-auto p-6 md:p-10">
            <div className="mx-auto w-full max-w-4xl">{children}</div>
          </div>
        </dialog>
      ) : null}

      <div className="relative border-border/60 border-t">
        <div
          aria-hidden={!expanded}
          className="not-prose relative overflow-hidden bg-muted/20 transition-[max-height] duration-350 motion-reduce:transition-none"
          id={regionId}
          style={{
            maxHeight: expanded ? EXPANDED_MAX : GLIMPSE_HEIGHT,
            transitionTimingFunction: EASE_OUT,
          }}
        >
          <div
            className={cnScroll(expanded)}
            ref={scrollRef}
            style={{ maxHeight: EXPANDED_MAX }}
          >
            <div
              className="preview-code p-5 pb-14 text-xs leading-5 [&_.shiki]:!m-0 [&_.shiki]:!rounded-none [&_.shiki]:!border-0 [&_.shiki]:!bg-transparent [&_.shiki]:!p-0 [&_.shiki]:whitespace-pre [&_code]:font-mono"
              // oxlint-disable-next-line react/no-danger -- build-time Shiki output from our own source text
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </div>

          {/* The fade that keeps the resting glimpse quiet. */}
          <div
            aria-hidden="true"
            className={
              expanded
                ? "pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background to-transparent"
                : "pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 to-background"
            }
          />

          {expanded ? (
            <Button
              aria-label="Copy source"
              className="absolute top-3 right-3"
              onClick={copySource}
              size="icon-sm"
              variant="ghost"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </Button>
          ) : null}
        </div>

        {/* The pill: floats on the glimpse, docks at the open edge. */}
        <div
          className={
            expanded
              ? "-translate-x-1/2 absolute bottom-3 left-1/2"
              : "-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2"
          }
        >
          <button
            aria-controls={regionId}
            aria-expanded={expanded}
            className="h-7 rounded-full border border-border/60 bg-card px-3 font-mono text-muted-foreground text-xs shadow-lg transition-colors hover:border-border hover:text-foreground active:scale-[0.98] motion-reduce:active:scale-100"
            onClick={toggle}
            type="button"
          >
            {expanded ? "hide code" : "view code"}
          </button>
        </div>
      </div>
    </div>
  );
}
