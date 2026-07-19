"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { launchPlan } from "./fixtures";
import { UpgradeDialog } from "./upgrade-dialog";

/**
 * The cross-org transfer wiring: upgrading moves the tenant's Neon
 * project from the platform org to a dedicated one, so the flight has
 * real duration — keep isProcessing honest and surface failures
 * through error instead of closing.
 */
export const UpgradeDialogExample = () => {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = () => {
    setIsProcessing(true);
    setError(null);
    // POST /apps/:id/upgrade → project transfer + plan change.
    window.setTimeout(() => {
      setIsProcessing(false);
      setError("The project transfer timed out. Your card wasn't charged.");
    }, 2200);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        Upgrade (fails)
      </Button>
      <UpgradeDialog
        error={error}
        isProcessing={isProcessing}
        onOpenChange={(next) => {
          setOpen(next);

          if (!next) {
            setError(null);
          }
        }}
        onUpgrade={handleUpgrade}
        open={open}
        plan={launchPlan}
      />
    </>
  );
};
