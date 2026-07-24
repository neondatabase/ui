"use client";

import { SQLRunner } from "./sql-runner";
import { useSQLRunner } from "./use-sql-runner";

/**
 * Client wiring for a server endpoint backed by @neondatabase/serverless.
 * The endpoint owns authorization and statement policy; SQLRunner owns the
 * editor, cancellation, and result states.
 */
export const SQLRunnerExample = () => {
  const { execute } = useSQLRunner({ endpoint: "/api/sql" });

  return (
    <SQLRunner
      database="production / neondb"
      defaultValue="select now();"
      onExecute={execute}
    />
  );
};
