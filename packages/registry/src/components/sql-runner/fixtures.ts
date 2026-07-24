import type { SQLField, SQLResult, SQLRow } from "./sql-runner";

export const defaultQuery = `select
  id,
  email,
  plan,
  created_at
from users
order by created_at desc
limit 8;`;

export const fields: SQLField[] = [
  { name: "id", type: "uuid" },
  { name: "email", type: "citext" },
  { name: "plan", type: "text" },
  { name: "created_at", type: "timestamptz" },
];

export const rows: SQLRow[] = [
  {
    created_at: "2026-07-24 13:42:18+00",
    email: "maya@northstar.dev",
    id: "6f45a168-5dfa-44cd-9b13-93280a807c2c",
    plan: "scale",
  },
  {
    created_at: "2026-07-24 12:18:03+00",
    email: "liam@refract.studio",
    id: "0e971248-90ab-4ca9-a125-b33ca743892e",
    plan: "launch",
  },
  {
    created_at: "2026-07-24 10:07:49+00",
    email: "sana@fieldnote.app",
    id: "a421e31f-f64b-4e0d-a0c7-57b19c10484f",
    plan: "free",
  },
  {
    created_at: "2026-07-23 22:54:11+00",
    email: "noah@cinder.tools",
    id: "bddf7245-f1fa-4728-aa0a-16c90dad7c71",
    plan: null,
  },
];

export const result: SQLResult = {
  command: "SELECT",
  durationMs: 42.7,
  fields,
  rowCount: rows.length,
  rows,
};

export const syntaxError = Object.assign(
  new Error('syntax error at or near "form"'),
  {
    code: "42601",
    column: 1,
    detail: "Postgres could not parse the statement after SELECT.",
    hint: "Did you mean FROM?",
    line: 2,
  }
);
