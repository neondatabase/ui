"use client";

import { SQLRunner } from "./sql-runner";
import { useSQLRunner } from "./use-sql-runner";

/**
 * Client wiring for a server endpoint backed by @neondatabase/serverless.
 * The endpoint owns authorization and statement policy; SQLRunner owns the
 * editor, cancellation, and result states.
 *
 * The safety mode starts at `read` and rides along with every request
 * (`useSQLRunner` posts `{ query, mode }`), so the endpoint can run a read
 * query inside a READ ONLY transaction and let Postgres enforce it.
 */
export const SQLRunnerExample = () => {
  const { execute } = useSQLRunner({ endpoint: "/api/sql" });

  return (
    <SQLRunner
      database="production / neondb"
      defaultMode="read"
      defaultValue="select now();"
      onExecute={execute}
    />
  );
};
