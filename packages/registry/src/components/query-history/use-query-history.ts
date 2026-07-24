"use client";

import { useCallback, useEffect, useState } from "react";

import type { QueryHistoryEntry } from "./query-history";

export interface UseQueryHistoryOptions {
  endpoint?: string;
  initialEntries?: QueryHistoryEntry[];
}

export const useQueryHistory = ({
  endpoint = "/api/query-history",
  initialEntries = [],
}: UseQueryHistoryOptions = {}) => {
  const [entries, setEntries] = useState<QueryHistoryEntry[]>(initialEntries);
  const [isLoading, setIsLoading] = useState(initialEntries.length === 0);
  const [loadError, setLoadError] = useState<Error | null>(null);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(endpoint, { signal });
        if (!response.ok) {
          throw new Error(`Could not load query history (${response.status}).`);
        }
        const payload = (await response.json()) as {
          entries: QueryHistoryEntry[];
        };
        setEntries(payload.entries);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setLoadError(
          error instanceof Error
            ? error
            : new Error("Could not load query history.")
        );
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint]
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    queueMicrotask(async () => {
      if (active) {
        await refresh(controller.signal);
      }
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [refresh]);

  return {
    entries,
    error: loadError,
    isLoading,
    refresh,
    setEntries,
  };
};
