"use client";

import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog/confirm-dialog";
import { restoreConfirm } from "@/components/confirm-dialog/fixtures";

import { CheckpointTimeline } from "./checkpoint-timeline";
import { sampleCheckpoints } from "./fixtures";

const RESTORE_MS = 2000;

export const CheckpointTimelineDemo = () => {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!pendingId) {
      return;
    }

    setRestoringId(pendingId);
    window.setTimeout(() => setRestoringId(null), RESTORE_MS);
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

export default CheckpointTimelineDemo;
