"use client";

import { PreviewCard } from "@base-ui/react/preview-card";
import type { ComponentProps } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/** Strip a URL down to its readable hostname. */
const hostnameOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./u, "");
  } catch {
    return url;
  }
};

const faviconOf = (url: string): string | null => {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return null;
  }
};

/**
 * The source site's favicon, resolved through Google's favicon
 * service. Decorative — vanishes silently if it fails to load, so
 * the pill never shows a broken-image glyph.
 */
const SourceFavicon = ({
  className,
  url,
}: {
  url: string;
  className?: string;
}) => {
  const [failed, setFailed] = useState(false);
  const src = faviconOf(url);

  if (!src || failed) {
    return null;
  }

  return (
    // oxlint-disable-next-line react/no-unknown-property -- plain img: registry components stay framework-agnostic
    <img
      alt=""
      aria-hidden="true"
      className={cn("size-3 shrink-0 select-none rounded-[2px]", className)}
      data-slot="inline-citation-favicon"
      loading="lazy"
      onError={() => setFailed(true)}
      src={src}
    />
  );
};

export type InlineCitationProps = ComponentProps<"span">;

/* ─────────────────────────────────────────────────────
 * A sourced claim inline with prose: the text reads
 * normally, a small mono pill names where it came from,
 * and hovering (or focusing) the pill previews the
 * source without leaving the paragraph. Sources stack
 * in one readable list — no carousel to page through.
 * Inspired by Inline Citation from Vercel's AI SDK
 * Elements (elements.ai-sdk.dev), rebuilt on Base UI.
 * ─────────────────────────────────────────────────── */
export const InlineCitation = ({
  className,
  ...props
}: InlineCitationProps) => (
  <span
    className={cn("group/citation inline items-baseline", className)}
    data-slot="inline-citation"
    {...props}
  />
);

export type InlineCitationTextProps = ComponentProps<"span">;

/** The cited span itself; tints gently while its pill is hovered. */
export const InlineCitationText = ({
  className,
  ...props
}: InlineCitationTextProps) => (
  <span
    className={cn(
      "transition-colors group-hover/citation:bg-muted/60",
      className
    )}
    data-slot="inline-citation-text"
    {...props}
  />
);

export type InlineCitationCardProps = PreviewCard.Root.Props;

/** The hover-preview boundary around a trigger pill and its body. */
export const InlineCitationCard = (props: InlineCitationCardProps) => (
  <PreviewCard.Root {...props} />
);

export type InlineCitationCardTriggerProps = Omit<
  PreviewCard.Trigger.Props,
  "href"
> & {
  /** Source URLs. The first is the link target and names the pill. */
  sources: string[];
};

/**
 * The citation pill: a mono chip naming the first source's hostname,
 * with a `+n` tail when more sources back the claim. It is a real
 * link — click goes to the source, hover previews it.
 */
export const InlineCitationCardTrigger = ({
  className,
  sources,
  ...props
}: InlineCitationCardTriggerProps) => {
  const [first] = sources;

  return (
    <PreviewCard.Trigger
      className={cn(
        "ml-1 inline-flex max-w-40 items-center gap-1 rounded-sm border border-border/60 bg-muted/50 px-1 align-text-bottom font-mono text-[10px] text-muted-foreground leading-4 no-underline transition-colors hover:border-border hover:text-foreground focus-visible:border-primary focus-visible:outline-none",
        className
      )}
      data-slot="inline-citation-card-trigger"
      href={first}
      rel="noopener noreferrer"
      target="_blank"
      {...props}
    >
      {first ? <SourceFavicon url={first} /> : null}
      <span className="truncate">{first ? hostnameOf(first) : "source"}</span>
      {sources.length > 1 ? (
        <span className="shrink-0 text-muted-foreground/60">
          +{sources.length - 1}
        </span>
      ) : null}
    </PreviewCard.Trigger>
  );
};

export type InlineCitationCardBodyProps = PreviewCard.Popup.Props & {
  align?: PreviewCard.Positioner.Props["align"];
  sideOffset?: PreviewCard.Positioner.Props["sideOffset"];
};

/** The preview popup: stacked sources, quotes, and anything else. */
export const InlineCitationCardBody = ({
  align = "start",
  className,
  sideOffset = 6,
  ...props
}: InlineCitationCardBodyProps) => (
  <PreviewCard.Portal>
    <PreviewCard.Positioner align={align} sideOffset={sideOffset}>
      <PreviewCard.Popup
        className={cn(
          "fade-in-0 slide-in-from-bottom-1 z-50 w-72 max-w-[calc(100vw-2rem)] animate-in space-y-3 rounded-lg border border-border/60 bg-card p-3 duration-200 motion-reduce:animate-none",
          className
        )}
        data-slot="inline-citation-card-body"
        {...props}
      />
    </PreviewCard.Positioner>
  </PreviewCard.Portal>
);

export type InlineCitationSourceProps = ComponentProps<"div"> & {
  title?: string;
  url?: string;
  description?: string;
};

/** One source: title, mono URL, and an optional dimmed description. */
export const InlineCitationSource = ({
  children,
  className,
  description,
  title,
  url,
  ...props
}: InlineCitationSourceProps) => (
  <div
    className={cn("space-y-0.5", className)}
    data-slot="inline-citation-source"
    {...props}
  >
    {title ? (
      <div className="flex items-center gap-1.5 font-medium text-foreground text-sm leading-snug">
        {url ? <SourceFavicon className="size-3.5" url={url} /> : null}
        <span className="min-w-0 truncate">{title}</span>
      </div>
    ) : null}
    {url ? (
      <div className="truncate font-mono text-muted-foreground text-xs">
        {url}
      </div>
    ) : null}
    {description ? (
      <div className="text-muted-foreground/80 text-xs leading-relaxed">
        {description}
      </div>
    ) : null}
    {children}
  </div>
);

export type InlineCitationQuoteProps = ComponentProps<"blockquote">;

/** A short excerpt from the source, on the house rail. */
export const InlineCitationQuote = ({
  className,
  ...props
}: InlineCitationQuoteProps) => (
  <blockquote
    className={cn(
      "border-border/60 border-l-2 pl-2.5 text-muted-foreground text-xs italic leading-relaxed",
      className
    )}
    data-slot="inline-citation-quote"
    {...props}
  />
);
