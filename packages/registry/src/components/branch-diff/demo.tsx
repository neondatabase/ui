"use client";

import { useState } from "react";

import { BranchDiff } from "./branch-diff";
import type { TableDataDiff } from "./branch-diff";
import {
  branchDiffDataDiffs,
  branchDiffFrom,
  branchDiffSchemaChanges,
  branchDiffTo,
} from "./fixtures";

const wait = () =>
  // oxlint-disable-next-line promise/avoid-new -- demo keeps the loading state visible long enough to inspect
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, 700);
  });

export const BranchDiffDemo = () => {
  const [tables, setTables] = useState<TableDataDiff[]>(branchDiffDataDiffs);
  const [loadingTableId, setLoadingTableId] = useState<string | null>(null);

  const loadMore = async (table: TableDataDiff) => {
    setLoadingTableId(table.id);
    await wait();
    setTables((current) =>
      current.map((item) =>
        item.id === table.id
          ? {
              ...item,
              addedCount: item.addedCount + 1,
              hasMore: false,
              rows: [
                ...item.rows,
                {
                  after: {
                    id: "enterprise",
                    monthly_cents: 99_900,
                    name: "Enterprise",
                    seats: 250,
                  },
                  id: "row-plans-5",
                  kind: "added" as const,
                  primaryKey: { id: "enterprise" },
                },
              ],
            }
          : item
      )
    );
    setLoadingTableId(null);
  };

  return (
    <BranchDiff
      className="w-full max-w-3xl"
      dataDiffs={tables}
      from={branchDiffFrom}
      loadingTableId={loadingTableId}
      onLoadMore={loadMore}
      schemaChanges={branchDiffSchemaChanges}
      to={branchDiffTo}
    />
  );
};

export default BranchDiffDemo;
