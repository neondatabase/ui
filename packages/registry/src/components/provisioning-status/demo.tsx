"use client";

import { useEffect, useState } from "react";

import { provisioningSteps, sampleErrorDetail } from "./fixtures";
import type { ProvisioningState } from "./provisioning-status";
import { ProvisioningStatus } from "./provisioning-status";

const STATES: ProvisioningState[] = ["provisioning", "waking", "error"];
const STEP_MS = 1800;

export const ProvisioningStatusDemo = () => {
  const [state, setState] = useState<ProvisioningState>("provisioning");
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (state !== "provisioning") {
      return;
    }

    const timer = window.setInterval(
      () => setStep((current) => (current + 1) % provisioningSteps.length),
      STEP_MS
    );
    return () => window.clearInterval(timer);
  }, [state]);

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <ProvisioningStatus
        detail={state === "error" ? sampleErrorDetail : undefined}
        onRetry={() => setState("provisioning")}
        state={state}
        {...(state === "provisioning" && { detail: provisioningSteps[step] })}
      />
      <div className="flex gap-1.5">
        {STATES.map((option) => (
          <button
            className={
              option === state
                ? "border border-primary/60 px-2.5 py-1 font-mono text-foreground text-xs"
                : "border border-border/60 px-2.5 py-1 font-mono text-muted-foreground text-xs transition-colors hover:border-border hover:text-foreground"
            }
            key={option}
            onClick={() => setState(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProvisioningStatusDemo;
