import { raw } from "@neon/sdk";

import { createNeonClient } from "@/lib/neon-client";

import type { ApiKey, ApiKeyScope } from "./api-key-list";
import { ApiKeyList } from "./api-key-list";

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/**
 * Server component: list the account's Neon API keys and wire create/revoke as
 * server actions. Pass an `orgId` to create and revoke organization keys too.
 * The token is returned once, at creation, and never stored.
 */
export const ApiKeyListExample = async ({ orgId }: { orgId?: string }) => {
  const neon = createNeonClient(process.env.NEON_API_KEY ?? "");
  const { data } = await neon.apiKeys.list();

  const keys: ApiKey[] = (data ?? []).map((item) => ({
    createdAt: shortDate(item.created_at),
    id: String(item.id),
    lastUsedAt: item.last_used_at ? shortDate(item.last_used_at) : undefined,
    name: item.name,
    scope: "personal",
  }));

  const createKey = async (name: string, scope: ApiKeyScope) => {
    "use server";
    const server = createNeonClient(process.env.NEON_API_KEY ?? "");

    if (scope === "organization" && orgId) {
      // Organization keys are not in the SDK's ergonomic layer yet, so this one
      // call drops to the raw layer, reusing the client's auth.
      const { data: orgKey } = await raw.createOrgApiKey({
        body: { key_name: name },
        client: server.client,
        path: { org_id: orgId },
      });

      return orgKey?.key;
    }

    const { data: created } = await server.apiKeys.create(name);

    return created?.key;
  };

  const revokeKey = async (key: ApiKey) => {
    "use server";
    const server = createNeonClient(process.env.NEON_API_KEY ?? "");

    if (key.scope === "organization" && orgId) {
      await raw.revokeOrgApiKey({
        client: server.client,
        path: { key_id: Number(key.id), org_id: orgId },
      });
      return;
    }

    await server.apiKeys.revoke(Number(key.id));
  };

  return <ApiKeyList keys={keys} onCreate={createKey} onRevoke={revokeKey} />;
};
