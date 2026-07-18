"use client";

import { Button } from "@/components/ui/button";

import { paneCopy, sampleCheckpointCount } from "./fixtures";
import { WorkspaceTabs } from "./workspace-tabs";

const Pane = ({ label }: { label: string }) => (
  <div className="flex h-40 items-center justify-center rounded-lg border border-border/60 border-dashed">
    <p className="font-mono text-muted-foreground text-xs">{label}</p>
  </div>
);

export const WorkspaceTabsDemo = () => (
  <WorkspaceTabs
    className="w-full max-w-2xl"
    tabs={[
      {
        actions: (
          <Button size="sm" variant="ghost">
            Refresh
          </Button>
        ),
        content: <Pane label={paneCopy.preview} />,
        id: "preview",
        label: "preview",
      },
      {
        actions: (
          <Button size="sm" variant="outline">
            New checkpoint
          </Button>
        ),
        content: <Pane label={paneCopy.checkpoints} />,
        count: sampleCheckpointCount,
        id: "checkpoints",
        label: "checkpoints",
      },
      {
        content: <Pane label={paneCopy.usage} />,
        id: "usage",
        label: "usage",
      },
    ]}
  />
);

export default WorkspaceTabsDemo;
