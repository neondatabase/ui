import type { Table } from "./schema-explorer";

/** A small, realistic Postgres schema for docs previews and tests. */
export const tables: Table[] = [
  {
    columns: [
      { name: "id", primaryKey: true, type: "uuid" },
      { name: "email", type: "citext", unique: true },
      { name: "name", nullable: true, type: "text" },
      { name: "created_at", type: "timestamptz" },
    ],
    indexes: [
      { columns: ["email"], name: "users_email_key", unique: true },
      { columns: ["created_at"], name: "users_created_at_idx" },
    ],
    name: "users",
    rowCount: 48_210,
  },
  {
    columns: [
      { name: "id", primaryKey: true, type: "uuid" },
      {
        name: "owner_id",
        references: { column: "id", table: "users" },
        type: "uuid",
      },
      { name: "name", type: "text" },
      { name: "region", type: "text" },
      { name: "created_at", type: "timestamptz" },
    ],
    indexes: [{ columns: ["owner_id"], name: "projects_owner_id_idx" }],
    name: "projects",
    rowCount: 1204,
  },
  {
    columns: [
      { name: "id", primaryKey: true, type: "uuid" },
      {
        name: "project_id",
        references: { column: "id", table: "projects" },
        type: "uuid",
      },
      { name: "hash", type: "text", unique: true },
      { name: "scopes", type: "text[]" },
      { name: "last_used_at", nullable: true, type: "timestamptz" },
      { name: "revoked_at", nullable: true, type: "timestamptz" },
    ],
    indexes: [{ columns: ["project_id"], name: "api_keys_project_id_idx" }],
    name: "api_keys",
    rowCount: 3320,
  },
];
