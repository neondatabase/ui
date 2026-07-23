import type {
  ConnectionEntry,
  DBConnectionCardProps,
} from "./db-connection-card";

const HOST = "ep-cool-darkness-a1b2c3d4.us-east-2.aws.neon.tech";
const POOLED_HOST = "ep-cool-darkness-a1b2c3d4-pooler.us-east-2.aws.neon.tech";
const PASSWORD = "npg_aB3xY7zQ9wErTyUi";

const buildUri = (
  role: string,
  database: string,
  pooled: boolean
): ConnectionEntry => ({
  database,
  pooled,
  role,
  uri: `postgresql://${role}:${PASSWORD}@${pooled ? POOLED_HOST : HOST}/${database}?sslmode=require`,
});

const roles = ["neondb_owner", "app_user"];
const databases = ["neondb", "analytics"];

/** Every role/database/pooled combination, as a server would prefetch them. */
const allConnections: ConnectionEntry[] = roles.flatMap((role) =>
  databases.flatMap((database) => [
    buildUri(role, database, false),
    buildUri(role, database, true),
  ])
);

export const connectionDefault: DBConnectionCardProps = {
  connections: allConnections,
};

/** A single role and database: the selectors collapse to static text. */
export const connectionSingle: DBConnectionCardProps = {
  connections: [
    buildUri("neondb_owner", "neondb", false),
    buildUri("neondb_owner", "neondb", true),
  ],
};
