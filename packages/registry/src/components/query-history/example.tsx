"use client";

import { QueryHistory } from "./query-history";
import { useQueryHistory } from "./use-query-history";

export const QueryHistoryExample = () => {
  const { entries, error, isLoading, setEntries } = useQueryHistory();

  const setSaved = async (id: string, saved: boolean) => {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, saved } : entry))
    );
    await fetch(`/api/query-history/${id}`, {
      body: JSON.stringify({ saved }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    });
  };

  return (
    <QueryHistory
      entries={entries}
      error={error}
      isLoading={isLoading}
      onRerun={(entry) => {
        window.location.assign(
          `/database/sql-runner?query=${encodeURIComponent(entry.query)}`
        );
      }}
      onSavedChange={(entry, saved) => setSaved(entry.id, saved)}
    />
  );
};
