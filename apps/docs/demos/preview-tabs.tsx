"use client";

import { Button } from "@neon-ui/registry/components/ui/button";
import { CheckIcon, CopyIcon } from "lucide-react";
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
 *  code     plain source renders instantly; Shiki
 *           (github-dark, Blume's code theme) swaps in
 *           once it lazily loads, with line numbers
 *           counted in CSS
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
  minHeight = 320,
  source,
}: {
  children: ReactNode;
  /** Minimum height of the preview stage in px. */
  minHeight?: number;
  /** The demo source text shown in the code section. */
  source: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const regionId = useId();

  useEffect(() => {
    if (!expanded || highlighted !== null) {
      return;
    }

    let cancelled = false;

    (async () => {
      const { codeToHtml } = await import("shiki");
      const html = await codeToHtml(source.trim(), {
        lang: "tsx",
        theme: "github-dark",
      });

      if (!cancelled) {
        setHighlighted(html);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [expanded, highlighted, source]);

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
        className="not-prose flex items-center justify-center bg-muted/10 p-8 preview-ghost"
        style={{ minHeight }}
      >
        {children}
      </div>

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
            {highlighted ? (
              <div
                className="preview-code p-5 pb-14 text-xs leading-5 [&_pre]:!m-0 [&_pre]:!rounded-none [&_pre]:!border-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:font-mono"
                // oxlint-disable-next-line react/no-danger -- Shiki output from our own source text
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            ) : (
              <div className="preview-code p-5 pb-14 text-xs leading-5">
                <code className="block whitespace-pre font-mono">
                  {source.trim()}
                </code>
              </div>
            )}
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
