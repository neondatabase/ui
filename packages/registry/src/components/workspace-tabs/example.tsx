"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { WorkspaceTabs } from "./workspace-tabs";

/**
 * The workspace shell wiring: PreviewFrame, CheckpointTimeline, and
 * UsagePanel each live in a tab, with the tab bar owning the per-pane
 * actions (refresh belongs to preview, snapshot to checkpoints).
 */
export const WorkspaceTabsExample = () => {
  const [tab, setTab] = useState("preview");
  const [checkpoints, setCheckpoints] = useState(3);

  return (
    <WorkspaceTabs
      className="w-full"
      onValueChange={setTab}
      tabs={[
        {
          actions: (
            <Button size="sm" variant="ghost">
              Open app
            </Button>
          ),
          content: (
            <div className="flex h-48 items-center justify-center rounded-lg border border-border/60">
              <p className="font-mono text-muted-foreground text-xs">
                {"<PreviewFrame />"}
              </p>
            </div>
          ),
          id: "preview",
          label: "preview",
        },
        {
          actions: (
            <Button
              onClick={() => setCheckpoints((count) => count + 1)}
              size="sm"
              variant="outline"
            >
              New checkpoint
            </Button>
          ),
          content: (
            <div className="flex h-48 items-center justify-center rounded-lg border border-border/60">
              <p className="font-mono text-muted-foreground text-xs">
                {"<CheckpointTimeline />"} · {checkpoints} checkpoints
              </p>
            </div>
          ),
          count: checkpoints,
          id: "checkpoints",
          label: "checkpoints",
        },
        {
          content: (
            <div className="flex h-48 items-center justify-center rounded-lg border border-border/60">
              <p className="font-mono text-muted-foreground text-xs">
                {"<UsagePanel />"}
              </p>
            </div>
          ),
          id: "usage",
          label: "usage",
        },
      ]}
      value={tab}
    />
  );
};
