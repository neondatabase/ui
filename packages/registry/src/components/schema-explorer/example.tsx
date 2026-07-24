import { neon } from "@neondatabase/serverless";

import type { Column, Table } from "./schema-explorer";
import { SchemaExplorer } from "./schema-explorer";

interface IntrospectedColumn {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: "YES" | "NO";
  is_primary: boolean;
  ref_table: string | null;
  ref_column: string | null;
}

/**
 * Server component: introspect a database's public schema over the Neon
 * serverless driver and render it. Runs entirely server-side, so the
 * connection string never reaches the browser. Add indexes from
 * pg_indexes if you want the Indexes section populated.
 */
export const SchemaExplorerExample = async () => {
  const sql = neon(process.env.DATABASE_URL ?? "");

  const rows = (await sql`
    WITH pk AS (
      SELECT kcu.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON kcu.constraint_name = tc.constraint_name
       AND kcu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    ),
    fk AS (
      SELECT kcu.table_name, kcu.column_name,
             ccu.table_name AS foreign_table_name,
             ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON kcu.constraint_name = tc.constraint_name
       AND kcu.table_schema = tc.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    )
    SELECT c.table_name, c.column_name, c.data_type, c.is_nullable,
           (pk.column_name IS NOT NULL) AS is_primary,
           fk.foreign_table_name AS ref_table,
           fk.foreign_column_name AS ref_column
    FROM information_schema.columns c
    LEFT JOIN pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name
    LEFT JOIN fk ON fk.table_name = c.table_name AND fk.column_name = c.column_name
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position
  `) as IntrospectedColumn[];

  const byTable = new Map<string, Table>();
  for (const row of rows) {
    const table = byTable.get(row.table_name) ?? {
      columns: [],
      name: row.table_name,
    };
    const column: Column = {
      name: row.column_name,
      nullable: row.is_nullable === "YES",
      primaryKey: row.is_primary,
      type: row.data_type,
    };
    if (row.ref_table && row.ref_column) {
      column.references = { column: row.ref_column, table: row.ref_table };
    }
    table.columns.push(column);
    byTable.set(row.table_name, table);
  }

  return <SchemaExplorer tables={[...byTable.values()]} />;
};
