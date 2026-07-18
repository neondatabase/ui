"use client";

import type { ComponentProps, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface WorkspaceTab {
  /** Stable id, doubles as the panel value, e.g. "preview". */
  id: string;
  /** Mono label, e.g. "preview". */
  label: string;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Optional count rendered after the label, e.g. checkpoints. */
  count?: number;
  /** Right-aligned actions shown only while this tab is active. */
  actions?: ReactNode;
  /** The pane content. */
  content: ReactNode;
  disabled?: boolean;
}

export type WorkspaceTabsProps = Omit<
  ComponentProps<typeof Tabs>,
  "children"
> & {
  tabs: WorkspaceTab[];
  /** Controlled active tab id. */
  value?: string;
  /** Uncontrolled initial tab id; defaults to the first tab. */
  defaultValue?: string;
  onValueChange?: (id: string) => void;
};

/* ─────────────────────────────────────────────────────────
 * TAB BAR STORYBOARD
 *
 *  rest     mono lowercase labels, muted; the active tab
 *           holds foreground with a primary underline
 *  switch   the underline glides to the new tab (240ms
 *           strong ease-out, transform-only) and the new
 *           pane fades up 4px; the old pane just leaves
 *  actions  each tab owns a right-aligned action slot that
 *           crossfades with the tab switch — the bar's
 *           height never changes
 *  hover    label warms to foreground, nothing moves
 * ───────────────────────────────────────────────────────── */
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

/** The underline that glides between active tabs. */
const GlideUnderline = ({ activeId }: { activeId: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [rect, setRect] = useState<{ left: number; width: number } | null>(
    null
  );

  useEffect(() => {
    const list = ref.current?.closest('[data-slot="tabs-list"]');

    if (!(list instanceof HTMLElement)) {
      return;
    }

    const measure = () => {
      const active = list.querySelector<HTMLElement>("[data-active]");

      if (active) {
        setRect({ left: active.offsetLeft, width: active.offsetWidth });
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeId]);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute bottom-0 h-0.5 bg-primary motion-reduce:transition-none",
        rect ? "opacity-100" : "opacity-0"
      )}
      ref={ref}
      style={{
        left: rect?.left ?? 0,
        transition: `left 240ms ${EASE_OUT}, width 240ms ${EASE_OUT}`,
        width: rect?.width ?? 0,
      }}
    />
  );
};

export const WorkspaceTabs = ({
  className,
  defaultValue,
  onValueChange,
  tabs,
  value,
  ...props
}: WorkspaceTabsProps) => {
  const fallback = defaultValue ?? tabs[0]?.id;
  const [internal, setInternal] = useState(fallback);
  const active = value ?? internal;
  const activeTab = tabs.find((tab) => tab.id === active);

  const handleChange = (next: unknown) => {
    const id = String(next);
    setInternal(id);
    onValueChange?.(id);
  };

  return (
    <Tabs
      className={cn("gap-0", className)}
      data-slot="workspace-tabs"
      onValueChange={handleChange}
      value={active}
      {...props}
    >
      <div className="flex items-center justify-between gap-3 border-border/40 border-b">
        <TabsList
          className="relative h-9 gap-1 rounded-none bg-transparent p-0"
          variant="line"
        >
          {tabs.map((tab) => (
            <TabsTrigger
              className="h-full flex-none rounded-none px-3 font-mono text-muted-foreground text-xs after:hidden hover:text-foreground data-active:bg-transparent data-active:text-foreground dark:data-active:border-transparent dark:data-active:bg-transparent"
              disabled={tab.disabled}
              key={tab.id}
              value={tab.id}
            >
              {tab.icon}
              {tab.label}
              {typeof tab.count === "number" ? (
                <span
                  className="inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-sm border border-border/60 px-[3px] pt-px text-[10px] text-muted-foreground leading-none tabular-nums transition-colors"
                  data-slot="workspace-tabs-count"
                >
                  {tab.count}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
          <GlideUnderline activeId={active} />
        </TabsList>
        {activeTab?.actions ? (
          <div
            className="fade-in-0 flex animate-in items-center gap-1.5 pr-1 duration-200 motion-reduce:animate-none"
            data-slot="workspace-tabs-actions"
            key={active}
          >
            {activeTab.actions}
          </div>
        ) : null}
      </div>
      {tabs.map((tab) => (
        <TabsContent
          className="fade-in-0 slide-in-from-bottom-1 animate-in pt-4 duration-300 motion-reduce:animate-none"
          key={tab.id}
          value={tab.id}
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};
