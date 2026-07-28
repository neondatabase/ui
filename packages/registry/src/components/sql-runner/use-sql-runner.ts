"use client";

import type {
  SQLExecutionContext,
  SQLResult,
} from "@/components/sql-runner/sql-runner";

export interface UseSQLRunnerOptions {
  /** Server endpoint that executes authorized SQL. */
  endpoint?: string;
}

/** Fetch adapter for SQLRunner. The AbortSignal cancels the HTTP request. */
export const useSQLRunner = ({
  endpoint = "/api/sql",
}: UseSQLRunnerOptions = {}) => {
  const execute = async (
    query: string,
    context: SQLExecutionContext
  ): Promise<SQLResult> => {
    const response = await fetch(endpoint, {
      body: JSON.stringify({ mode: context.mode, query }),
      headers: { "content-type": "application/json" },
      method: "POST",
      signal: context.signal,
    });

    const payload = (await response.json()) as SQLResult | { error: string };
    if (!response.ok || "error" in payload) {
      throw new Error("error" in payload ? payload.error : "Query failed.");
    }
    return payload;
  };

  return { execute };
};
