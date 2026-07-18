"use client";

import { useEffect, useState } from "react";

import type { ProvisioningState } from "./provisioning-status";
import { ProvisioningStatus } from "./provisioning-status";

/**
 * The workspace wiring: poll your provisioning endpoint and feed the
 * reported step into `detail` — each swap crossfades in place. On
 * failure, flip to the error state and let retry restart the flow.
 */
export const ProvisioningStatusExample = () => {
  const [state, setState] = useState<ProvisioningState>("provisioning");
  const [detail, setDetail] = useState("Creating Neon project…");

  useEffect(() => {
    // Stand-in for polling GET /apps/:id/provisioning.
    const steps = [
      "Provisioning database…",
      "Scaffolding application…",
      "Starting sandbox…",
    ];
    let index = 0;
    const timer = window.setInterval(() => {
      const step = steps[index];

      if (!step) {
        window.clearInterval(timer);
        return;
      }

      setDetail(step);
      index += 1;
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  const handleRetry = () => {
    // POST /apps/:id/provision, then resume polling.
    setState("provisioning");
    setDetail("Creating Neon project…");
  };

  return (
    <ProvisioningStatus
      className="h-72 w-full"
      detail={detail}
      onRetry={handleRetry}
      state={state}
    />
  );
};
