"use client";

import { useState } from "react";

import { queryHistoryEntries } from "./fixtures";
import { QueryHistory } from "./query-history";
import type { QueryHistoryEntry } from "./query-history";

const wait = () =>
  // oxlint-disable-next-line promise/avoid-new -- demo keeps the running state visible long enough to inspect
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, 700);
  });

export const QueryHistoryDemo = () => {
  const [entries, setEntries] =
    useState<QueryHistoryEntry[]>(queryHistoryEntries);

  return (
    <QueryHistory
      className="w-full max-w-2xl"
      entries={entries}
      onRerun={async (entry) => {
        await wait();
        setEntries((current) => [
          {
            ...entry,
            id: `${entry.id}-rerun-${current.length}`,
            timestamp: "just now",
          },
          ...current,
        ]);
      }}
      onSavedChange={(entry, saved) =>
        setEntries((current) =>
          current.map((item) =>
            item.id === entry.id ? { ...item, saved } : item
          )
        )
      }
    />
  );
};

export default QueryHistoryDemo;
