"use client";

import { useCallback, useEffect, useState } from "react";

import type { SchemaChange, TableDataDiff } from "./branch-diff";

export interface BranchDiffPayload {
  schemaChanges: SchemaChange[];
  dataDiffs: TableDataDiff[];
}

export interface UseBranchDiffOptions {
  endpoint?: string;
  fromBranchId: string;
  toBranchId: string;
}

export const useBranchDiff = ({
  endpoint = "/api/branch-diff",
  fromBranchId,
  toBranchId,
}: UseBranchDiffOptions) => {
  const [diff, setDiff] = useState<BranchDiffPayload>({
    dataDiffs: [],
    schemaChanges: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setLoadError(null);

      const search = new URLSearchParams({
        from: fromBranchId,
        to: toBranchId,
      });

      try {
        const response = await fetch(`${endpoint}?${search}`, { signal });
        if (!response.ok) {
          throw new Error(`Could not load branch diff (${response.status}).`);
        }
        setDiff((await response.json()) as BranchDiffPayload);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setLoadError(
          error instanceof Error
            ? error
            : new Error("Could not load branch diff.")
        );
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint, fromBranchId, toBranchId]
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
    dataDiffs: diff.dataDiffs,
    error: loadError,
    isLoading,
    refresh,
    schemaChanges: diff.schemaChanges,
    setDiff,
  };
};
