import { createNeonClient } from "@/lib/neon-client";

import type { ConnectionEntry } from "./db-connection-card";
import { DBConnectionCard } from "./db-connection-card";

/**
 * Server component: prefetch every connection URI for a branch's roles and
 * databases (pooled and direct) and hand them to DBConnectionCard as plain
 * data. The secret never leaves the server as anything but the string the user
 * asks to copy.
 */
export const DBConnectionCardExample = async ({
  projectId,
  branchId,
  roles,
  databases,
}: {
  projectId: string;
  branchId: string;
  roles: string[];
  databases: string[];
}) => {
  const neon = createNeonClient(process.env.NEON_API_KEY ?? "");

  const combinations = roles.flatMap((role) =>
    databases.flatMap((database) =>
      [false, true].map((pooled) => ({ database, pooled, role }))
    )
  );

  const connections: ConnectionEntry[] = await Promise.all(
    combinations.map(async ({ role, database, pooled }) => {
      const { data: uri } = await neon.postgres.connectionString({
        branchId,
        databaseName: database,
        pooled,
        projectId,
        roleName: role,
      });

      return { database, pooled, role, uri: uri ?? "" };
    })
  );

  return <DBConnectionCard connections={connections} />;
};
