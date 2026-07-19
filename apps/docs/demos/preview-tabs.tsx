"use client";

import { Tabs } from "@base-ui/react/tabs";
import { Button } from "@neon-ui/registry/components/ui/button";
import { CheckIcon, CopyIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

/*
 * The shared Preview / Code shell for docs islands.
 *
 * Only the active panel exists in layout — the inactive one is
 * display:none, so switching never paints two heavy subtrees at once
 * (the old keepMounted + visibility:hidden pattern froze the frame on
 * shader pages). Height stays honest: the wrapper locks to the last
 * measured preview height before the preview unmounts from layout, so
 * nothing jumps. The code panel fades in over 150ms, renders the plain
 * source immediately, and swaps in Shiki highlighting (github-dark,
 * the same theme as Blume's code blocks) once it loads — the
 * highlighter is only fetched on the first Code open.
 */
const triggerClass =
  "relative h-11 px-4 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground data-[active]:text-foreground data-[active]:after:absolute data-[active]:after:inset-x-3 data-[active]:after:bottom-0 data-[active]:after:h-0.5 data-[active]:after:bg-primary";

export default function PreviewTabs({
  children,
  minHeight = 320,
  source,
}: {
  children: ReactNode;
  /** Fallback height in px before the preview has been measured. */
  minHeight?: number;
  /** The demo source text shown in the Code tab. */
  source: string;
}) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("preview");
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab !== "code" || highlighted !== null) {
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
  }, [tab, highlighted, source]);

  const handleTabChange = (value: unknown) => {
    // Lock the wrapper to the preview's rendered height before the
    // preview leaves layout, so the switch never shifts the page.
    const measured = previewRef.current?.offsetHeight;

    if (measured) {
      setLockedHeight(measured);
    }

    setTab(String(value));
  };

  const copySource = async () => {
    await navigator.clipboard.writeText(source.trim());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Tabs.Root
      className="overflow-hidden border border-border/60 bg-background"
      onValueChange={handleTabChange}
      value={tab}
    >
      <Tabs.List aria-label="Component preview" className="flex bg-muted/15">
        <Tabs.Tab className={triggerClass} value="preview">
          Preview
        </Tabs.Tab>
        <Tabs.Tab className={triggerClass} value="code">
          Code
        </Tabs.Tab>
      </Tabs.List>

      <div className="border-border/60 border-t">
        <Tabs.Panel
          className="not-prose flex items-center justify-center bg-muted/10 p-8 preview-ghost outline-none"
          keepMounted
          ref={previewRef}
          style={{ minHeight }}
          value="preview"
        >
          {children}
        </Tabs.Panel>
        <Tabs.Panel
          className="not-prose fade-in-0 relative animate-in overflow-hidden duration-150 code-overlay outline-none motion-reduce:animate-none"
          style={{ height: lockedHeight ?? minHeight }}
          value="code"
        >
          <Button
            aria-label="Copy source"
            className="absolute top-3 right-3"
            onClick={copySource}
            size="icon-sm"
            variant="ghost"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
          {highlighted ? (
            <div
              className="h-full overflow-auto bg-muted/30 p-5 text-xs leading-5 [&_pre]:!m-0 [&_pre]:!rounded-none [&_pre]:!border-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:font-mono"
              // oxlint-disable-next-line react/no-danger -- Shiki output from our own source text
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          ) : (
            <div className="h-full overflow-auto bg-muted/30 p-5 text-xs leading-5">
              <code className="block whitespace-pre font-mono">
                {source.trim()}
              </code>
            </div>
          )}
        </Tabs.Panel>
      </div>
    </Tabs.Root>
  );
}
