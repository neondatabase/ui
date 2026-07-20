"use client";

import { useState } from "react";

import { useRegionPing } from "@/hooks/use-region-ping";

import type { CreateProjectValues } from "./create-project";
import { CreateProject } from "./create-project";
import { neonAwsRegions } from "./fixtures";

/**
 * The console wiring: submit the values to your projects endpoint,
 * hold `isBusy` while the request is in flight, and route away on
 * success. useRegionPing feeds real round-trips into the map card
 * and globe caption — any reachable per-region URL works.
 */
export const CreateProjectExample = () => {
  const [isBusy, setIsBusy] = useState(false);
  const { pings } = useRegionPing({
    "aws-eu-central-1": "https://eu-central-1.aws.example.com/health",
    "aws-us-east-1": "https://us-east-1.aws.example.com/health",
  });

  const handleSubmit = (values: CreateProjectValues) => {
    setIsBusy(true);
    // POST /projects with values, then route to the new project.
    void values;
  };

  return (
    <CreateProject
      isBusy={isBusy}
      latencies={pings}
      onCancel={() => setIsBusy(false)}
      onClose={() => setIsBusy(false)}
      onSubmit={handleSubmit}
      regions={neonAwsRegions}
    />
  );
};
