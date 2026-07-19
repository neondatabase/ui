"use client";

import { useState } from "react";

import { CheckpointTimeline } from "@/components/checkpoint-timeline/checkpoint-timeline";
import { sampleCheckpoints } from "@/components/checkpoint-timeline/fixtures";

import { ConfirmDialog } from "./confirm-dialog";
import { restoreConfirm } from "./fixtures";

/**
 * The workspace wiring: Restore opens the confirmation, the hold arms
 * it, and only then does the restore flight start.
 */
export const ConfirmDialogExample = () => {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!pendingId) {
      return;
    }

    // POST /apps/:id/checkpoints/:checkpointId/restore
    setRestoringId(pendingId);
    window.setTimeout(() => setRestoringId(null), 2000);
  };

  return (
    <>
      <CheckpointTimeline
        checkpoints={sampleCheckpoints}
        className="max-w-xl"
        onRestore={setPendingId}
        restoringId={restoringId}
      />
      <ConfirmDialog
        confirmLabel={restoreConfirm.confirmLabel}
        description={restoreConfirm.description}
        onConfirm={handleConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setPendingId(null);
          }
        }}
        open={pendingId !== null}
        title={restoreConfirm.title}
      />
    </>
  );
};
