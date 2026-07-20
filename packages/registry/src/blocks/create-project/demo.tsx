"use client";

import { useState } from "react";

import type { CreateProjectValues } from "./create-project";
import { CreateProject } from "./create-project";
import { neonAwsRegions, postgresVersions, sampleLatencies } from "./fixtures";

export const CreateProjectDemo = () => {
  const [submitted, setSubmitted] = useState<CreateProjectValues | null>(null);

  return (
    <div className="flex w-full flex-col gap-3">
      <CreateProject
        defaultRegionId="aws-eu-central-1"
        latencies={sampleLatencies}
        onCancel={() => setSubmitted(null)}
        onSubmit={setSubmitted}
        postgresVersions={postgresVersions}
        regions={neonAwsRegions}
      />
      {submitted ? (
        <p className="font-mono text-muted-foreground text-xs">
          POST /projects {JSON.stringify(submitted)}
        </p>
      ) : null}
    </div>
  );
};

export default CreateProjectDemo;
