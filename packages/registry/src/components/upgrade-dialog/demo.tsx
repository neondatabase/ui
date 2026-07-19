"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { launchPlan } from "./fixtures";
import { UpgradeDialog } from "./upgrade-dialog";

const UPGRADE_MS = 2200;

export const UpgradeDialogDemo = () => {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  const handleUpgrade = () => {
    setIsProcessing(true);
    window.setTimeout(() => {
      setIsProcessing(false);
      setUpgraded(true);
      setOpen(false);
    }, UPGRADE_MS);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        className="active:scale-[0.98]"
        onClick={() => {
          setUpgraded(false);
          setOpen(true);
        }}
        variant="outline"
      >
        Upgrade
      </Button>
      {upgraded ? (
        <p className="fade-in-0 animate-in font-mono text-muted-foreground text-xs duration-300 motion-reduce:animate-none">
          upgraded to launch
        </p>
      ) : null}
      <UpgradeDialog
        isProcessing={isProcessing}
        onOpenChange={setOpen}
        onUpgrade={handleUpgrade}
        open={open}
        plan={launchPlan}
      />
    </div>
  );
};

export default UpgradeDialogDemo;
