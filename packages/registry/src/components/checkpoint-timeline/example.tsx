"use client";

import { useState } from "react";

import type { Checkpoint } from "./checkpoint-timeline";
import { CheckpointTimeline } from "./checkpoint-timeline";

/**
 * The workspace wiring: checkpoints come from your API newest first;
 * restore posts back and pins the acting row until the flight lands.
 * The empty state renders itself before the first checkpoint exists.
 */
export const CheckpointTimelineExample = () => {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = (id: string) => {
    // POST /apps/:id/checkpoints/:checkpointId/restore
    setRestoringId(id);
    window.setTimeout(() => setRestoringId(null), 2000);
  };

  const addCheckpoint = () => {
    setCheckpoints((current) => [
      {
        createdAt: "just now",
        id: `cp_${current.length + 1}`,
        label: `Checkpoint ${current.length + 1}`,
        projectId: "damp-forest-123456",
        sha: Math.random().toString(16).slice(2, 9),
        snapshot: current.length % 2 === 0,
      },
      ...current,
    ]);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <CheckpointTimeline
        checkpoints={checkpoints}
        onRestore={handleRestore}
        restoringId={restoringId}
      />
      <button
        className="self-start border border-border/60 px-2.5 py-1 font-mono text-muted-foreground text-xs transition-colors hover:border-border hover:text-foreground"
        onClick={addCheckpoint}
        type="button"
      >
        simulate agent checkpoint
      </button>
    </div>
  );
};
