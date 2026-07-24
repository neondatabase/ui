"use client";

import { BranchDiff } from "./branch-diff";
import { useBranchDiff } from "./use-branch-diff";

export const BranchDiffExample = () => {
  const { dataDiffs, error, isLoading, schemaChanges } = useBranchDiff({
    fromBranchId: "br-main",
    toBranchId: "br-feature-billing",
  });

  return (
    <BranchDiff
      dataDiffs={dataDiffs}
      error={error}
      from={{ id: "br-main", name: "main" }}
      isLoading={isLoading}
      schemaChanges={schemaChanges}
      to={{ id: "br-feature-billing", name: "br-feature-billing" }}
    />
  );
};
