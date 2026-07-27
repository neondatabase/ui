"use client";

import { BranchUsageTable } from "./branch-usage-table";
import { branchColumns, branchRows } from "./fixtures";

export const BranchUsageTableDemo = () => (
  <BranchUsageTable
    className="w-full max-w-2xl"
    columns={branchColumns}
    meteredThrough="metered through 21:40 UTC · ~15m behind"
    rows={branchRows}
    topN={6}
  />
);

export default BranchUsageTableDemo;
